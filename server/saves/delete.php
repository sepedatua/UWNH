<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

$user = requireAuth();
$db = getDb();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_GET;
$slotNumber = (int)($input['slot_number'] ?? 0);

if ($slotNumber < 1 || $slotNumber > 10) {
    jsonResponse(['error' => 'Invalid slot number'], 400);
}

// Check if slot exists
$stmt = $db->prepare("SELECT id FROM save_slots WHERE user_id = ? AND slot_number = ?");
$stmt->execute([$user['id'], $slotNumber]);
$slot = $stmt->fetch();

if (!$slot) {
    jsonResponse(['error' => 'Save slot not found'], 404);
}

// Delete ghost fleet if any
$db->prepare("DELETE FROM mp_ghost_fleets WHERE save_slot_id = ?")->execute([$slot['id']]);

// Delete save slot
$delStmt = $db->prepare("DELETE FROM save_slots WHERE id = ?");
$delStmt->execute([$slot['id']]);

jsonResponse([
    'success' => true,
    'message' => "Slot $slotNumber cleared successfully",
]);
