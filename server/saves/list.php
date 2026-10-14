<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

$user = requireAuth();
$db = getDb();

$stmt = $db->prepare("
    SELECT 
        id, 
        slot_number, 
        game_mode, 
        protagonist_id, 
        protagonist_name, 
        nationality, 
        is_alive, 
        current_year, 
        current_month, 
        current_day, 
        current_port_id, 
        gold, 
        fame_adventure, 
        fame_trade, 
        fame_piracy, 
        updated_at 
    FROM save_slots 
    WHERE user_id = ? 
    ORDER BY slot_number ASC
");
$stmt->execute([$user['id']]);
$slots = $stmt->fetchAll();

jsonResponse([
    'success' => true,
    'slots' => $slots,
]);
