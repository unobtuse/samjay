<?php
declare(strict_types=1);

require_once __DIR__ . '/../../../includes/google.php';
require_once __DIR__ . '/../../../includes/oauth_state.php';

session_start();

$client = samjay_google_client();

if (isset($_GET['error'])) {
    echo 'Authorization error: ' . htmlspecialchars((string) $_GET['error']);
    exit;
}

if (empty($_GET['state']) || !samjay_consume_oauth_state((string) $_GET['state'], $_SESSION['google_oauth_state'])) {
    http_response_code(400);
    echo 'Invalid OAuth state. Please retry the authorization flow.';
    exit;
}

if (empty($_GET['code'])) {
    http_response_code(400);
    echo 'Authorization code missing.';
    exit;
}

$code = $_GET['code'];

$response = samjay_http_request('POST', 'https://oauth2.googleapis.com/token', [
    'headers' => [
        'Content-Type: application/x-www-form-urlencoded',
    ],
    'body' => http_build_query([
        'code' => $code,
        'client_id' => $client['client_id'],
        'client_secret' => $client['client_secret'],
        'redirect_uri' => $client['redirect_uri'],
        'grant_type' => 'authorization_code',
    ]),
    'expect_json' => true,
]);

if (!$response['success']) {
    http_response_code(500);
    echo 'Token exchange failed: ' . htmlspecialchars($response['error'] ?: $response['body']);
    exit;
}

$data = $response['json'] ?? [];

if (empty($data['refresh_token']) && empty(samjay_google_load_tokens()['refresh_token'])) {
    echo 'Authorization succeeded but no refresh token was returned. Ensure you used prompt=consent and remove existing access first.';
    exit;
}

$tokens = [
    'access_token' => $data['access_token'] ?? null,
    'expires_at' => time() + (int) ($data['expires_in'] ?? 0),
];

if (!empty($data['refresh_token'])) {
    $tokens['refresh_token'] = $data['refresh_token'];
}

samjay_google_save_tokens(array_filter($tokens));

echo 'Google authorization complete. You may close this window and run the sync script.';
