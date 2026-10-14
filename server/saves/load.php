<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

$user = requireAuth();
$db = getDb();

$slotNumber = isset($_GET['slot_number']) ? (int)$_GET['slot_number'] : 0;
$slotId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($slotNumber > 0) {
    $stmt = $db->prepare("SELECT * FROM save_slots WHERE user_id = ? AND slot_number = ?");
    $stmt->execute([$user['id'], $slotNumber]);
} else if ($slotId > 0) {
    $stmt = $db->prepare("SELECT * FROM save_slots WHERE user_id = ? AND id = ?");
    $stmt->execute([$user['id'], $slotId]);
} else {
    jsonResponse(['error' => 'Please specify slot_number or id'], 400);
}

$slot = $stmt->fetch();
if (!$slot) {
    jsonResponse(['error' => 'Save slot not found'], 404);
}

// Parse save_payload JSON
$slot['save_payload'] = json_decode($slot['save_payload'], true);

jsonResponse([
    'success' => true,
    'save_data' => $slot,
]);
