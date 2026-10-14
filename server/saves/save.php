<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

$user = requireAuth();
$db = getDb();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    jsonResponse(['error' => 'Invalid JSON payload'], 400);
}

$slotNumber = (int)($input['slot_number'] ?? 0);
if ($slotNumber < 1 || $slotNumber > 10) {
    jsonResponse(['error' => 'Invalid slot number (must be 1 to 10)'], 400);
}

$gameMode = (string)($input['game_mode'] ?? 'sp_scenario');
if (!in_array($gameMode, ['sp_scenario', 'sp_endless', 'mp_endless'], true)) {
    jsonResponse(['error' => 'Invalid game mode'], 400);
}

$protagonistId = (string)($input['protagonist_id'] ?? '1');
$protagonistName = trim((string)($input['protagonist_name'] ?? 'Captain'));
$nationality = trim((string)($input['nationality'] ?? 'Portugal'));
$isAlive = isset($input['is_alive']) ? (int)(bool)$input['is_alive'] : 1;
$currentYear = (int)($input['current_year'] ?? 1522);
$currentMonth = (int)($input['current_month'] ?? 5);
$currentDay = (int)($input['current_day'] ?? 17);
$currentPortId = (string)($input['current_port_id'] ?? '1');
$gold = (int)($input['gold'] ?? 0);
$fameAdventure = (int)($input['fame_adventure'] ?? 0);
$fameTrade = (int)($input['fame_trade'] ?? 0);
$famePiracy = (int)($input['fame_piracy'] ?? 0);

$savePayload = is_string($input['save_payload']) 
    ? $input['save_payload'] 
    : json_encode($input['save_payload'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

// Permadeath check for Endless modes
$existingStmt = $db->prepare("SELECT id, is_alive, game_mode FROM save_slots WHERE user_id = ? AND slot_number = ?");
$existingStmt->execute([$user['id'], $slotNumber]);
$existingSlot = $existingStmt->fetch();

$isNewGame = !empty($input['is_new_game']);

if ($existingSlot && (int)$existingSlot['is_alive'] === 0 && !$isNewGame) {
    jsonResponse(['error' => 'This captain has perished in Endless mode. Cannot overwrite a fallen captain unless starting a new game.'], 403);
}

// Upsert save slot
$upsertSql = "
    INSERT INTO save_slots (
        user_id, slot_number, game_mode, protagonist_id, protagonist_name, nationality,
        is_alive, current_year, current_month, current_day, current_port_id,
        gold, fame_adventure, fame_trade, fame_piracy, save_payload
    ) VALUES (
        :user_id, :slot_number, :game_mode, :protagonist_id, :protagonist_name, :nationality,
        :is_alive, :current_year, :current_month, :current_day, :current_port_id,
        :gold, :fame_adventure, :fame_trade, :fame_piracy, :save_payload
    ) ON DUPLICATE KEY UPDATE
        game_mode = VALUES(game_mode),
        protagonist_id = VALUES(protagonist_id),
        protagonist_name = VALUES(protagonist_name),
        nationality = VALUES(nationality),
        is_alive = VALUES(is_alive),
        current_year = VALUES(current_year),
        current_month = VALUES(current_month),
        current_day = VALUES(current_day),
        current_port_id = VALUES(current_port_id),
        gold = VALUES(gold),
        fame_adventure = VALUES(fame_adventure),
        fame_trade = VALUES(fame_trade),
        fame_piracy = VALUES(fame_piracy),
        save_payload = VALUES(save_payload),
        updated_at = NOW()
";

$stmt = $db->prepare($upsertSql);
$stmt->execute([
    ':user_id' => $user['id'],
    ':slot_number' => $slotNumber,
    ':game_mode' => $gameMode,
    ':protagonist_id' => $protagonistId,
    ':protagonist_name' => $protagonistName,
    ':nationality' => $nationality,
    ':is_alive' => $isAlive,
    ':current_year' => $currentYear,
    ':current_month' => $currentMonth,
    ':current_day' => $currentDay,
    ':current_port_id' => $currentPortId,
    ':gold' => $gold,
    ':fame_adventure' => $fameAdventure,
    ':fame_trade' => $fameTrade,
    ':fame_piracy' => $famePiracy,
    ':save_payload' => $savePayload,
]);

$slotId = $existingSlot ? (int)$existingSlot['id'] : (int)$db->lastInsertId();

// If this is a living Multiplayer Endless save, publish/update ghost fleet
if ($gameMode === 'mp_endless') {
    if ($isAlive === 1 && isset($input['world_x'], $input['world_y'])) {
        $worldX = (int)$input['world_x'];
        $worldY = (int)$input['world_y'];
        $heading = (int)($input['heading'] ?? 0);
        $isPirate = ($famePiracy > 5000) ? 1 : 0;
        $bounty = (int)($input['bounty_gold'] ?? ($isPirate ? $famePiracy * 2 : 0));

        $ghostSql = "
            INSERT INTO mp_ghost_fleets (
                user_id, save_slot_id, captain_name, nation, world_x, world_y, heading, fleet_data_json, is_pirate, bounty_gold
            ) VALUES (
                :user_id, :slot_id, :name, :nation, :wx, :wy, :heading, :fleet_data, :is_pirate, :bounty
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
        $ghostStmt = $db->prepare($ghostSql);
        $ghostStmt->execute([
            ':user_id' => $user['id'],
            ':slot_id' => $slotId,
            ':name' => $protagonistName,
            ':nation' => $nationality,
            ':wx' => $worldX,
            ':wy' => $worldY,
            ':heading' => $heading,
            ':fleet_data' => $savePayload,
            ':is_pirate' => $isPirate,
            ':bounty' => $bounty,
        ]);
    } else if ($isAlive === 0) {
        // Remove ghost fleet if fallen
        $delGhost = $db->prepare("DELETE FROM mp_ghost_fleets WHERE save_slot_id = ?");
        $delGhost->execute([$slotId]);
    }
}

jsonResponse([
    'success' => true,
    'message' => 'Game saved successfully',
    'slot_id' => $slotId,
    'slot_number' => $slotNumber,
]);
