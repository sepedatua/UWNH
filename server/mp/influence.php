<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

$db = getDb();

// Calculate total ports controlled by each nation and aggregate economy
$sql = "
    SELECT 
        controlling_nation, 
        COUNT(*) as port_count,
        COALESCE(SUM(economy_value), 0) as total_economy,
        COALESCE(SUM(industry_value), 0) as total_industry,
        COALESCE(SUM(support_portugal), 0) as sum_portugal,
        COALESCE(SUM(support_spain), 0) as sum_spain,
        COALESCE(SUM(support_ottoman), 0) as sum_ottoman,
        COALESCE(SUM(support_england), 0) as sum_england,
        COALESCE(SUM(support_holland), 0) as sum_holland,
        COALESCE(SUM(support_italy), 0) as sum_italy
    FROM mp_port_economy
    GROUP BY controlling_nation
    ORDER BY port_count DESC
";
$rows = $db->query($sql)->fetchAll();

// Get recent port flips or top contested ports
$contestedStmt = $db->query("
    SELECT port_id, port_name, controlling_nation, economy_value, industry_value, updated_at
    FROM mp_port_economy
    ORDER BY updated_at DESC
    LIMIT 6
");
$recent = $contestedStmt->fetchAll();

jsonResponse([
    'success' => true,
    'global_control' => $rows,
    'contested_ports' => $recent,
]);
