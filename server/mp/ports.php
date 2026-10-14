<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

$portId = (int)($_GET['port_id'] ?? 0);
if ($portId < 0 || $portId > 500) {
    jsonResponse(['error' => 'Invalid port ID'], 400);
}

$db = getDb();

// If port_id is 0, return all ports overview
if ($portId === 0) {
    $allPortsStmt = $db->query("SELECT port_id, port_name, economy_value, industry_value, controlling_nation, updated_at FROM mp_port_economy ORDER BY port_id ASC LIMIT 100");
    $ports = $allPortsStmt->fetchAll();
    jsonResponse([
        'success' => true,
        'count' => count($ports),
        'ports' => $ports,
    ]);
}

// Fetch shared port economy
$portStmt = $db->prepare("SELECT * FROM mp_port_economy WHERE port_id = ?");
$portStmt->execute([$portId]);
$port = $portStmt->fetch();

// If port record doesn't exist yet, lazily initialize with defaults
if (!$port) {
    $portName = (string)($_GET['port_name'] ?? "Port $portId");
    $initStmt = $db->prepare("
        INSERT INTO mp_port_economy (port_id, port_name, economy_value, industry_value, controlling_nation)
        VALUES (?, ?, 500, 500, 'Neutral')
        ON DUPLICATE KEY UPDATE port_id = port_id
    ");
    $initStmt->execute([$portId, $portName]);

    $portStmt->execute([$portId]);
    $port = $portStmt->fetch();
}

// Fetch shared commodity prices for this port
$priceStmt = $db->prepare("SELECT commodity_id, price_index, stock_quantity, updated_at FROM mp_commodity_prices WHERE port_id = ?");
$priceStmt->execute([$portId]);
$prices = $priceStmt->fetchAll();

$priceMap = [];
$now = time();
$updateBatch = [];

foreach ($prices as $row) {
    $cid = (int)$row['commodity_id'];
    $idx = (int)$row['price_index'];
    $stock = (int)$row['stock_quantity'];
    $updatedAt = strtotime($row['updated_at'] ?: 'now');

    // Periodic Background Economic Regeneration (Gradual Price Normalization towards 100% over real-world hours)
    $hoursPassed = (int)floor(($now - $updatedAt) / 3600);
    if ($hoursPassed > 0) {
        $decayRate = 2; // ~2% normalization per hour
        if ($idx > 100) {
            $idx = max(100, $idx - ($hoursPassed * $decayRate));
        } elseif ($idx < 100) {
            $idx = min(100, $idx + ($hoursPassed * $decayRate));
        }

        // Replenish depleted stock towards standard baseline
        if ($stock < 1000) {
            $stock = min(1000, $stock + ($hoursPassed * 25));
        }

        $updateBatch[] = [
            'port_id' => $portId,
            'commodity_id' => $cid,
            'price_index' => $idx,
            'stock_quantity' => $stock,
        ];
    }

    $priceMap[$cid] = [
        'price_index' => $idx,
        'stock_quantity' => $stock,
    ];
}

// Persist any normalized prices
if (!empty($updateBatch)) {
    $upStmt = $db->prepare("UPDATE mp_commodity_prices SET price_index = ?, stock_quantity = ?, updated_at = NOW() WHERE port_id = ? AND commodity_id = ?");
    foreach ($updateBatch as $item) {
        $upStmt->execute([$item['price_index'], $item['stock_quantity'], $item['port_id'], $item['commodity_id']]);
    }
}

jsonResponse([
    'success' => true,
    'port' => $port,
    'commodity_prices' => $priceMap,
]);
