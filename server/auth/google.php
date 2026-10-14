<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$idToken = $input['credential'] ?? $input['id_token'] ?? '';

if (empty($idToken)) {
    jsonResponse(['error' => 'Google credential/ID token is required'], 400);
}

// Verify token using Google's public tokeninfo endpoint
$url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => true,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($httpCode !== 200 || !$response) {
    error_log("Google Token Verification Failed: HTTP $httpCode, Error: $curlError");
    jsonResponse(['error' => 'Invalid Google ID token'], 401);
}

$payload = json_decode($response, true);
if (!isset($payload['sub'], $payload['email'])) {
    jsonResponse(['error' => 'Malformed token payload'], 401);
}

$googleSub = (string)$payload['sub'];
$email = strtolower(trim((string)$payload['email']));
$name = (string)($payload['name'] ?? $email);
$avatarUrl = (string)($payload['picture'] ?? '');

$db = getDb();

// Check if user already exists
$stmt = $db->prepare("SELECT id, role, status FROM users WHERE google_sub = ? OR email = ?");
$stmt->execute([$googleSub, $email]);
$existing = $stmt->fetch();

if ($existing) {
    if ($existing['status'] === 'banned') {
        jsonResponse(['error' => 'Your account has been suspended by an administrator.'], 403);
    }
    // Update profile
    $updateStmt = $db->prepare("UPDATE users SET google_sub = ?, name = ?, avatar_url = ?, last_login = NOW() WHERE id = ?");
    $updateStmt->execute([$googleSub, $name, $avatarUrl, $existing['id']]);
    $userId = (int)$existing['id'];
    $role = $existing['role'];
} else {
    // Check if this is the very first registered user -> auto-grant Admin role
    $countStmt = $db->query("SELECT COUNT(*) FROM users");
    $isFirstUser = ((int)$countStmt->fetchColumn()) === 0;
    $role = $isFirstUser ? 'admin' : 'player';

    $insertStmt = $db->prepare("INSERT INTO users (google_sub, email, name, avatar_url, role, status) VALUES (?, ?, ?, ?, ?, 'active')");
    $insertStmt->execute([$googleSub, $email, $name, $avatarUrl, $role]);
    $userId = (int)$db->lastInsertId();
}

$_SESSION['user_id'] = $userId;

$userData = [
    'id' => $userId,
    'email' => $email,
    'name' => $name,
    'avatar_url' => $avatarUrl,
    'role' => $role,
];

jsonResponse([
    'success' => true,
    'message' => 'Successfully signed in with Google',
    'user' => $userData,
]);
