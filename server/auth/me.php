<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

$user = getAuthenticatedUser();

jsonResponse([
    'authenticated' => ($user !== null),
    'user' => $user,
]);
