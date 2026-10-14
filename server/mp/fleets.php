<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

$user = getAuthenticatedUser();
$db = getDb();

// Query ghost fleets around player's ocean coordinates (within radius)
$x = isset($_GET['x']) ? (int)round((float)$_GET['x']) : null;
$y = isset($_GET['y']) ? (int)round((float)$_GET['y']) : null;
$radius = isset($_GET['radius']) ? (int)$_GET['radius'] : 120; // world grid pixels radius

$params = [];
$whereClauses = [];

if ($user) {
    $whereClauses[] = "user_id != :current_user_id";
    $params[':current_user_id'] = $user['id'];
}

// Coordinate bounding box with cylindrical X wrap
if ($x !== null && $y !== null) {
    $minY = max(0, $y - $radius);
    $maxY = min(1080, $y + $radius);
    $whereClauses[] = "(world_y BETWEEN :min_y AND :max_y)";
    $params[':min_y'] = $minY;
    $params[':max_y'] = $maxY;

    $minX = $x - $radius;
    $maxX = $x + $radius;

    if ($minX < 0) {
        $wrapMinX = 2160 + $minX;
        $whereClauses[] = "(world_x >= :wrap_min_x OR world_x <= :max_x)";
        $params[':wrap_min_x'] = $wrapMinX;
        $params[':max_x'] = $maxX;
    } elseif ($maxX >= 2160) {
        $wrapMaxX = $maxX - 2160;
        $whereClauses[] = "(world_x >= :min_x OR world_x <= :wrap_max_x)";
        $params[':min_x'] = $minX;
        $params[':wrap_max_x'] = $wrapMaxX;
    } else {
        $whereClauses[] = "(world_x BETWEEN :min_x AND :max_x)";
        $params[':min_x'] = $minX;
        $params[':max_x'] = $maxX;
    }
}

$whereSql = !empty($whereClauses) ? "WHERE " . implode(" AND ", $whereClauses) : "";

$sql = "
    SELECT 
        id, 
        user_id,
        captain_name, 
        nation, 
        world_x, 
        world_y, 
        heading, 
        is_pirate, 
        bounty_gold, 
        last_seen,
        fleet_data_json
    FROM mp_ghost_fleets
    $whereSql
    ORDER BY last_seen DESC
    LIMIT 35
";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$fleets = $stmt->fetchAll();

foreach ($fleets as &$f) {
    $f['fleet_data'] = json_decode($f['fleet_data_json'] ?? '{}', true);
    unset($f['fleet_data_json']);
}

// If few player fleets nearby, supply authentic roaming AI merchant/patrol fleets
if (count($fleets) === 0 && $x !== null && $y !== null) {
    $nations = ['Portugal', 'Spain', 'England', 'Netherlands', 'Ottoman', 'Italy'];
    $captains = ['Captain Mendoza', 'Commander Van der Meer', 'Commodore Drake', 'Captain Da Gama', 'Raider Reis', 'Captain Rossi'];
    for ($i = 0; $i < 3; $i++) {
        $offsetX = ($i % 2 === 0 ? 1 : -1) * (20 + $i * 18);
        $offsetY = ($i % 2 === 0 ? -1 : 1) * (15 + $i * 12);
        $fx = ($x + $offsetX + 2160) % 2160;
        $fy = max(50, min(1030, $y + $offsetY));
        $fleets[] = [
            'id' => 8000 + $i,
            'captain_name' => $captains[($x + $i) % count($captains)],
            'nation' => $nations[($y + $i) % count($nations)],
            'world_x' => $fx,
            'world_y' => $fy,
            'heading' => ($i * 2) % 6,
            'is_pirate' => 0,
            'bounty_gold' => 0,
            'last_seen' => date('Y-m-d H:i:s'),
            'fleet_data' => [
                'shipType' => 'Caravel',
                'crew' => 45,
                'guns' => 12,
            ],
        ];
    }
}

jsonResponse([
    'success' => true,
    'count' => count($fleets),
    'ghost_fleets' => $fleets,
]);
