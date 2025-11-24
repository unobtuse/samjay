<?php
declare(strict_types=1);

require_once __DIR__ . '/env.php';

function samjay_google_client(): array
{
    $appUrl = rtrim(samjay_env('APP_URL', ''), '/');
    $defaultRedirect = $appUrl !== ''
        ? $appUrl . '/samjay/auth/google/callback.php'
        : null;

    return [
        'client_id' => samjay_env('GOOGLE_CLIENT_ID', ''),
        'client_secret' => samjay_env('GOOGLE_CLIENT_SECRET', ''),
        'redirect_uri' => samjay_env('GOOGLE_REDIRECT_URI', $defaultRedirect),
    ];
}

function samjay_google_token_file(): string
{
    return samjay_storage_path('google_tokens.json');
}

function samjay_google_load_tokens(): array
{
    $file = samjay_google_token_file();
    if (!file_exists($file)) {
        return [];
    }

    $json = json_decode((string) file_get_contents($file), true);
    return is_array($json) ? $json : [];
}

function samjay_google_save_tokens(array $tokens): void
{
    $payload = array_merge(samjay_google_load_tokens(), $tokens);
    file_put_contents(samjay_google_token_file(), json_encode($payload, JSON_PRETTY_PRINT));
}

function samjay_google_get_access_token(): ?string
{
    $tokens = samjay_google_load_tokens();
    $accessToken = $tokens['access_token'] ?? null;
    $expiresAt = $tokens['expires_at'] ?? 0;

    if ($accessToken && $expiresAt > time() + 60) {
        return $accessToken;
    }

    if (empty($tokens['refresh_token'])) {
        return null;
    }

    $refreshed = samjay_google_refresh_access_token($tokens['refresh_token']);
    if (!isset($refreshed['access_token'])) {
        return null;
    }

    return $refreshed['access_token'];
}

function samjay_google_refresh_access_token(string $refreshToken): array
{
    $client = samjay_google_client();
    $response = samjay_http_request('POST', 'https://oauth2.googleapis.com/token', [
        'headers' => [
            'Content-Type: application/x-www-form-urlencoded',
        ],
        'body' => http_build_query([
            'client_id' => $client['client_id'],
            'client_secret' => $client['client_secret'],
            'refresh_token' => $refreshToken,
            'grant_type' => 'refresh_token',
        ]),
        'expect_json' => true,
    ]);

    if (!$response['success']) {
        return [];
    }

    $data = $response['json'] ?? [];
    if (!isset($data['access_token'])) {
        return [];
    }

    $tokens = [
        'access_token' => $data['access_token'],
        'expires_at' => time() + (int) ($data['expires_in'] ?? 0),
    ];

    samjay_google_save_tokens($tokens);
    return $tokens;
}

function samjay_http_request(string $method, string $url, array $options = []): array
{
    $method = strtoupper($method);
    $query = $options['query'] ?? [];
    $headers = $options['headers'] ?? [];
    $body = $options['body'] ?? null;
    $json = $options['json'] ?? null;
    $timeout = $options['timeout'] ?? 20;
    $expectJson = $options['expect_json'] ?? false;

    if (!empty($query)) {
        $qs = http_build_query($query);
        $url .= (str_contains($url, '?') ? '&' : '?') . $qs;
    }

    if ($json !== null) {
        $body = json_encode($json);
        $headers[] = 'Content-Type: application/json';
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }

    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $responseBody = curl_exec($ch);
    $error = curl_error($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $success = $error === '' && $status >= 200 && $status < 300;
    $decoded = null;
    if ($expectJson && $responseBody !== false) {
        $decoded = json_decode($responseBody, true);
    }

    return [
        'success' => $success,
        'status' => $status,
        'body' => $responseBody ?: '',
        'error' => $error,
        'json' => $decoded,
    ];
}

function samjay_google_api(string $method, string $url, array $options = []): array
{
    $token = $options['access_token'] ?? samjay_google_get_access_token();
    if (!$token) {
        return ['success' => false, 'status' => 401, 'body' => '', 'error' => 'Missing access token'];
    }

    $headers = $options['headers'] ?? [];
    $headers[] = 'Authorization: Bearer ' . $token;

    $options['headers'] = $headers;
    $options['expect_json'] = $options['expect_json'] ?? true;

    return samjay_http_request($method, $url, $options);
}
