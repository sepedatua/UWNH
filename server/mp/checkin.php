<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

$user = getAuthenticatedUser();
if (!$user) {
    jsonResponse(['success' => true, 'guest' => true]);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    jsonResponse(['error' => 'Invalid JSON input'], 400);
}

$db = getDb();
$worldX = (int)($input['world_x'] ?? 840);
$worldY = (int)($input['world_y'] ?? 358);
$heading = (int)($input['heading'] ?? 0);
$captainName = trim((string)($input['captain_name'] ?? $user['name']));
$nation = trim((string)($input['nation'] ?? 'Portugal'));
$isPirate = !empty($input['is_pirate']) ? 1 : 0;
$bounty = (int)($input['bounty_gold'] ?? 0);
$fleetData = is_string($input['fleet_data'] ?? '') 
    ? $input['fleet_data'] 
    : json_encode($input['fleet_data'] ?? [], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

// Find active MP save slot ID or default to 1
$slotStmt = $db->prepare("SELECT id FROM save_slots WHERE user_id = ? AND game_mode = 'mp_endless' LIMIT 1");
$slotStmt->execute([$user['id']]);
$slot = $slotStmt->fetch();
$slotId = $slot ? (int)$slot['id'] : $user['id'];

$upsertSql = "
    INSERT INTO mp_ghost_fleets (
        user_id, save_slot_id, captain_name, nation, world_x, world_y, heading, fleet_data_json, is_pirate, bounty_gold, last_seen
    ) VALUES (
        :uid, :sid, :name, :nation, :wx, :wy, :heading, :fleet, :is_pirate, :bounty, NOW()
    ) ON DUPLICATE KEY UPDATE
        captain_name = VALUES(captain_name),
        nation = VALUES(nation),
        world_x = VALUES(world_x),
        world_y = VALUES(world_y),
        heading = VALUES(heading),
        fleet_data_json = VALUES(fleet_data_json),
        is_pirate = VALUES(is_pirate),
        bounty_gold = VALUES(bounty_gold),
        last_seen = NOW()
";
$stmt = $db->prepare($upsertSql);
$stmt->execute([
    ':uid' => $user['id'],
    ':sid' => $slotId,
    ':name' => $captainName,
    ':nation' => $nation,
    ':wx' => $worldX,
    ':wy' => $worldY,
    ':heading' => $heading,
    ':fleet' => $fleetData,
    ':is_pirate' => $isPirate,
    ':bounty' => $bounty,
]);

jsonResponse([
    'success' => true,
    'checked_in' => true,
    'captain' => $captainName,
    'world_x' => $worldX,
    'world_y' => $worldY,
]);
