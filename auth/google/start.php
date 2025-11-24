<?php
declare(strict_types=1);

require_once __DIR__ . '/../../includes/google.php';
require_once __DIR__ . '/../../includes/oauth_state.php';

session_start();

$client = samjay_google_client();
if ($client['client_id'] === '' || $client['redirect_uri'] === null) {
    http_response_code(500);
    echo 'Google client is not configured. Check GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI in .env';
    exit;
}

$state = bin2hex(random_bytes(24));
$_SESSION['google_oauth_state'] = $state;
samjay_store_oauth_state($state);

$scopes = [
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/youtube.readonly',
];

$params = [
    'client_id' => $client['client_id'],
    'redirect_uri' => $client['redirect_uri'],
    'response_type' => 'code',
    'scope' => implode(' ', $scopes),
    'access_type' => 'offline',
    'include_granted_scopes' => 'true',
    'prompt' => 'consent',
    'state' => $state,
];

$authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);

header('Location: ' . $authUrl);
exit;
