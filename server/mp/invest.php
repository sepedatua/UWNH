<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

$user = requireAuth();
$db = getDb();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$portId = (int)($input['port_id'] ?? 0);
$gold = (int)($input['gold'] ?? 0);
$nation = strtolower(trim((string)($input['nation'] ?? 'portugal')));
$sector = (string)($input['sector'] ?? 'economy'); // 'economy' or 'industry'

if ($portId < 0 || $gold <= 0) {
    jsonResponse(['error' => 'Invalid investment parameters'], 400);
}

$validNations = ['portugal', 'spain', 'ottoman', 'england', 'holland', 'italy'];
if (!in_array($nation, $validNations, true)) {
    $nation = 'portugal';
}

$db->beginTransaction();
try {
    $stmt = $db->prepare("SELECT * FROM mp_port_economy WHERE port_id = ? FOR UPDATE");
    $stmt->execute([$portId]);
    $port = $stmt->fetch();

    if (!$port) {
        $db->prepare("INSERT INTO mp_port_economy (port_id, port_name, economy_value, industry_value) VALUES (?, ?, 500, 500)")
            ->execute([$portId, "Port $portId"]);
        $stmt->execute([$portId]);
        $port = $stmt->fetch();
    }

    // Boost Economy or Industry
    $increase = (int)floor($gold / 100);
    $newEconomy = (int)$port['economy_value'];
    $newIndustry = (int)$port['industry_value'];

    if ($sector === 'industry') {
        $newIndustry = min(1000, $newIndustry + $increase);
    } else {
        $newEconomy = min(1000, $newEconomy + $increase);
    }

    // Boost nation support
    $supportCol = "support_" . $nation;
    $currentSupport = (int)($port[$supportCol] ?? 0);
    $supportGain = (int)floor($gold / 500);
    if ($supportGain < 1) $supportGain = 1;
    $newSupport = min(100, $currentSupport + $supportGain);

    // Check if controlling nation flips (Support reaches 75%)
    $newController = $port['controlling_nation'];
    if ($newSupport >= 75) {
        $newController = ucfirst($nation);
    }

    $updateSql = "
        UPDATE mp_port_economy SET 
            economy_value = :econ,
            industry_value = :ind,
            $supportCol = :sup,
            controlling_nation = :controller,
            updated_at = NOW()
        WHERE port_id = :port_id
    ";
    $updateStmt = $db->prepare($updateSql);
    $updateStmt->execute([
        ':econ' => $newEconomy,
        ':ind' => $newIndustry,
        ':sup' => $newSupport,
        ':controller' => $newController,
        ':port_id' => $portId,
    ]);

    $db->commit();

    jsonResponse([
        'success' => true,
        'port_id' => $portId,
        'economy' => $newEconomy,
        'industry' => $newIndustry,
        'support' => $newSupport,
        'controlling_nation' => $newController,
    ]);
} catch (Exception $e) {
    $db->rollBack();
    error_log("MP Invest error: " . $e->getMessage());
    jsonResponse(['error' => 'Investment failed'], 500);
}
