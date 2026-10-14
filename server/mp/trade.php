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
$commodityId = (int)($input['commodity_id'] ?? 0);
$action = (string)($input['action'] ?? ''); // 'buy' or 'sell'
$quantity = (int)($input['quantity'] ?? 0);

if ($quantity <= 0 || !in_array($action, ['buy', 'sell'], true)) {
    jsonResponse(['error' => 'Invalid trade parameters'], 400);
}

$db->beginTransaction();
try {
    // Lock row for atomic update
    $stmt = $db->prepare("SELECT price_index, stock_quantity FROM mp_commodity_prices WHERE port_id = ? AND commodity_id = ? FOR UPDATE");
    $stmt->execute([$portId, $commodityId]);
    $current = $stmt->fetch();

    $currentIndex = $current ? (int)$current['price_index'] : 100;
    $currentStock = $current ? (int)$current['stock_quantity'] : 1000;

    // Price index shift calculation:
    // Selling 10 units drops index by ~1 point, minimum 50%
    // Buying 10 units raises index by ~1 point, maximum 150%
    $shift = (int)floor($quantity / 10);
    if ($shift < 1) $shift = 1;

    if ($action === 'sell') {
        $newIndex = max(50, $currentIndex - $shift);
        $newStock = $currentStock + $quantity;
    } else {
        $newIndex = min(150, $currentIndex + $shift);
        $newStock = max(0, $currentStock - $quantity);
    }

    $upsertStmt = $db->prepare("
        INSERT INTO mp_commodity_prices (port_id, commodity_id, price_index, stock_quantity, updated_at)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            price_index = VALUES(price_index),
            stock_quantity = VALUES(stock_quantity),
            updated_at = NOW()
    ");
    $upsertStmt->execute([$portId, $commodityId, $newIndex, $newStock]);

    $db->commit();

    jsonResponse([
        'success' => true,
        'action' => $action,
        'port_id' => $portId,
        'commodity_id' => $commodityId,
        'new_price_index' => $newIndex,
        'new_stock' => $newStock,
    ]);
} catch (Exception $e) {
    $db->rollBack();
    error_log("MP Trade error: " . $e->getMessage());
    jsonResponse(['error' => 'Trade processing failed'], 500);
}
