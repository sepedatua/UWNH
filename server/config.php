<?php
declare(strict_types=1);

/**
 * Uncharted Waters: New Horizons — Backend Configuration & Database Bootstrap
 * Optimized for Debian 13 Virtualmin LAMP (PHP 8.2+ / MariaDB)
 */

// Error reporting for production/development
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Secure Session Configuration
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.use_only_cookies', '1');
    session_start();
}

// CORS Headers for Frontend API Calls
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
];

if (in_array($origin, $allowedOrigins, true) || empty($allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// JSON Response Helper
function jsonResponse(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit();
}

// Database Connection via PDO
function getDb(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $host = getenv('DB_HOST') ?: '127.0.0.1';
        $port = getenv('DB_PORT') ?: '3306';
        $dbname = getenv('DB_NAME') ?: 'uncharted_waters';
        $username = getenv('DB_USER') ?: 'root';
        $password = getenv('DB_PASS') ?: '';

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        try {
            $pdo = new PDO($dsn, $username, $password, $options);
        } catch (PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());
            jsonResponse(['error' => 'Database connection failed'], 500);
        }
    }
    return $pdo;
}

// Auth Helper: Require authenticated user
function getAuthenticatedUser(): ?array {
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    $db = getDb();
    $stmt = $db->prepare("SELECT id, google_sub, email, name, avatar_url, role, status FROM users WHERE id = ?");
    $stmt->execute([(int)$_SESSION['user_id']]);
    $user = $stmt->fetch();

    if (!$user || $user['status'] === 'banned') {
        session_destroy();
        return null;
    }
    return $user;
}

function requireAuth(): array {
    $user = getAuthenticatedUser();
    if (!$user) {
        jsonResponse(['error' => 'Unauthorized. Please log in with Google.'], 401);
    }
    return $user;
}

function requireAdmin(): array {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        jsonResponse(['error' => 'Forbidden. Admin privileges required.'], 403);
    }
    return $user;
}
