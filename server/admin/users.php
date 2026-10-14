<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

$admin = requireAdmin();
$db = getDb();

// POST: Manage User Action (Ban/Unban, Change Role)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = (string)($input['action'] ?? '');
    $targetUserId = (int)($input['user_id'] ?? 0);

    if ($targetUserId <= 0) {
        jsonResponse(['error' => 'Invalid user ID'], 400);
    }

    if ($targetUserId === (int)$admin['id'] && $action === 'toggle_ban') {
        jsonResponse(['error' => 'You cannot ban your own administrator account'], 400);
    }

    if ($action === 'toggle_ban') {
        $stmt = $db->prepare("SELECT status FROM users WHERE id = ?");
        $stmt->execute([$targetUserId]);
        $currentStatus = $stmt->fetchColumn();

        if (!$currentStatus) {
            jsonResponse(['error' => 'User not found'], 404);
        }

        $newStatus = ($currentStatus === 'active') ? 'banned' : 'active';
        $db->prepare("UPDATE users SET status = ? WHERE id = ?")->execute([$newStatus, $targetUserId]);

        jsonResponse([
            'success' => true,
            'message' => "User status updated to $newStatus",
            'status' => $newStatus,
        ]);
    }

    if ($action === 'set_role') {
        $newRole = (string)($input['role'] ?? 'player');
        if (!in_array($newRole, ['player', 'admin'], true)) {
            jsonResponse(['error' => 'Invalid role'], 400);
        }

        $db->prepare("UPDATE users SET role = ? WHERE id = ?")->execute([$newRole, $targetUserId]);

        jsonResponse([
            'success' => true,
            'message' => "User role updated to $newRole",
            'role' => $newRole,
        ]);
    }

    jsonResponse(['error' => 'Unknown action'], 400);
}

// GET: List users with search and pagination
$search = trim((string)($_GET['search'] ?? ''));
$limit = min(50, max(10, (int)($_GET['limit'] ?? 20)));
$page = max(1, (int)($_GET['page'] ?? 1));
$offset = ($page - 1) * $limit;

$params = [];
$whereClause = "";

if ($search !== '') {
    $whereClause = "WHERE u.name LIKE :search OR u.email LIKE :search OR u.google_sub LIKE :search";
    $params[':search'] = "%$search%";
}

// Count total
$countStmt = $db->prepare("SELECT COUNT(*) FROM users u $whereClause");
$countStmt->execute($params);
$totalUsers = (int)$countStmt->fetchColumn();

// Fetch users with save slots count
$sql = "
    SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.avatar_url, 
        u.role, 
        u.status, 
        u.created_at, 
        u.last_login,
        COUNT(s.id) AS total_saves,
        SUM(CASE WHEN s.game_mode = 'mp_endless' THEN 1 ELSE 0 END) AS mp_saves,
        SUM(CASE WHEN s.is_alive = 0 THEN 1 ELSE 0 END) AS fallen_captains
    FROM users u
    LEFT JOIN save_slots s ON u.id = s.user_id
    $whereClause
    GROUP BY u.id
    ORDER BY u.last_login DESC
    LIMIT $limit OFFSET $offset
";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$users = $stmt->fetchAll();

jsonResponse([
    'success' => true,
    'total' => $totalUsers,
    'page' => $page,
    'limit' => $limit,
    'users' => $users,
]);
