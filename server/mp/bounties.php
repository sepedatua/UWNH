<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

$db = getDb();

// Query top wanted pirates
$stmt = $db->query("
    SELECT 
        id, 
        captain_name, 
        nation, 
        world_x, 
        world_y, 
        heading, 
        is_pirate, 
        bounty_gold, 
        last_seen
    FROM mp_ghost_fleets
    WHERE is_pirate = 1 OR bounty_gold > 0
    ORDER BY bounty_gold DESC, last_seen DESC
    LIMIT 10
");
$bounties = $stmt->fetchAll();

// If less than 4 player bounties exist, supplement with legendary server outlaws
if (count($bounties) < 4) {
    $seedOutlaws = [
        [
            'id' => 901,
            'captain_name' => 'Khayr ad-Din Barbarossa',
            'nation' => 'Ottoman',
            'world_x' => 1060,
            'world_y' => 380,
            'heading' => 2,
            'is_pirate' => 1,
            'bounty_gold' => 45000,
            'last_seen' => date('Y-m-d H:i:s'),
        ],
        [
            'id' => 902,
            'captain_name' => 'Black Jack Hawkins',
            'nation' => 'England',
            'world_x' => 910,
            'world_y' => 250,
            'heading' => 4,
            'is_pirate' => 1,
            'bounty_gold' => 30000,
            'last_seen' => date('Y-m-d H:i:s'),
        ],
        [
            'id' => 903,
            'captain_name' => 'Jean Lafitte',
            'nation' => 'France',
            'world_x' => 820,
            'world_y' => 330,
            'heading' => 1,
            'is_pirate' => 1,
            'bounty_gold' => 25000,
            'last_seen' => date('Y-m-d H:i:s'),
        ],
        [
            'id' => 904,
            'captain_name' => 'Calico Jack Rackham',
            'nation' => 'Pirate',
            'world_x' => 420,
            'world_y' => 520,
            'heading' => 3,
            'is_pirate' => 1,
            'bounty_gold' => 38000,
            'last_seen' => date('Y-m-d H:i:s'),
        ],
    ];
    $bounties = array_merge($bounties, array_slice($seedOutlaws, 0, 5 - count($bounties)));
}

jsonResponse([
    'success' => true,
    'count' => count($bounties),
    'bounties' => $bounties,
]);
