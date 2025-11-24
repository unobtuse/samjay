<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/env.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$query = isset($_GET['q']) && trim((string) $_GET['q']) !== '' ? trim((string) $_GET['q']) : 'sam jay';
$limit = isset($_GET['limit']) ? max(5, min(100, (int) $_GET['limit'])) : 15;

try {
    $appleItems = fetchApplePodcasts($query, $limit);
    $spotifyItems = fetchSpotifyEpisodes($query, $limit);
    $items = mergePodcastResults($appleItems, $spotifyItems, $limit);

    echo json_encode([
        'query' => $query,
        'count' => count($items),
        'items' => $items,
        'spotifyEnabled' => (bool) $spotifyItems['available'],
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Unable to fetch podcast data',
        'details' => $e->getMessage(),
    ]);
}

/**
 * Fetch podcast episodes from Apple Search API.
 */
function fetchApplePodcasts(string $query, int $limit): array
{
    $url = 'https://itunes.apple.com/search?entity=podcastEpisode&media=podcast&limit='
        . ($limit * 2)
        . '&term='
        . rawurlencode($query);

    $response = httpJsonRequest($url);
    if (!$response || !isset($response['results'])) {
        return [];
    }

    $normalizedQuery = strtolower($query);
    $items = [];
    foreach ($response['results'] as $result) {
        $haystack = strtolower(($result['trackName'] ?? '') . ' ' . ($result['description'] ?? ''));
        if ($normalizedQuery !== '' && strpos($haystack, $normalizedQuery) === false) {
            continue;
        }

        $items[] = [
            'id' => $result['trackId'] ?? null,
            'title' => $result['trackName'] ?? $result['collectionName'] ?? 'Untitled Episode',
            'description' => html_entity_decode($result['description'] ?? '', ENT_QUOTES | ENT_HTML5),
            'published_at' => $result['releaseDate'] ?? null,
            'image' => $result['artworkUrl600'] ?? $result['artworkUrl100'] ?? '',
            'apple_url' => $result['trackViewUrl'] ?? $result['collectionViewUrl'] ?? '',
            'show' => $result['collectionName'] ?? '',
        ];

        if (count($items) >= $limit) {
            break;
        }
    }

    return $items;
}

/**
 * Fetch Spotify episodes/shows matching the query.
 *
 * @return array{available:bool,items:array<int,array<string,mixed>>}
 */
function fetchSpotifyEpisodes(string $query, int $limit): array
{
    $clientId = samjay_env('SPOTIFY_CLIENT_ID', '') ?: '';
    $clientSecret = samjay_env('SPOTIFY_CLIENT_SECRET', '') ?: '';

    if ($clientId === '' || $clientSecret === '') {
        return ['available' => false, 'items' => []];
    }

    $token = getSpotifyAccessToken($clientId, $clientSecret);
    if ($token === null) {
        return ['available' => false, 'items' => []];
    }

    $searchUrl = 'https://api.spotify.com/v1/search?type=episode,show&limit='
        . ($limit * 2)
        . '&q='
        . rawurlencode($query);

    $response = httpJsonRequest($searchUrl, [
        'Authorization: Bearer ' . $token,
    ]);

    if (!$response) {
        return ['available' => false, 'items' => []];
    }

    $items = [];

    $episodes = $response['episodes']['items'] ?? [];
    foreach ($episodes as $episode) {
        $items[] = normalizeSpotifyItem($episode, 'episode');
    }

    $shows = $response['shows']['items'] ?? [];
    foreach ($shows as $show) {
        $items[] = normalizeSpotifyItem($show, 'show');
    }

    return [
        'available' => true,
        'items' => $items,
    ];
}

function normalizeSpotifyItem(array $item, string $type): array
{
    $images = $item['images'] ?? $item['show']['images'] ?? [];
    $image = '';
    if (!empty($images)) {
        usort($images, static fn($a, $b) => ($b['width'] ?? 0) <=> ($a['width'] ?? 0));
        $image = $images[0]['url'] ?? '';
    }

    return [
        'id' => $item['id'] ?? null,
        'title' => $item['name'] ?? 'Spotify Entry',
        'description' => $item['description'] ?? '',
        'published_at' => $item['release_date'] ?? ($item['show']['release_date'] ?? null),
        'image' => $image,
        'spotify_url' => $item['external_urls']['spotify'] ?? '',
        'show' => $item['show']['name'] ?? $item['publisher'] ?? '',
        'type' => $type,
    ];
}

function getSpotifyAccessToken(string $clientId, string $clientSecret): ?string
{
    $cacheKey = sys_get_temp_dir() . '/samjay_spotify_token.json';
    if (file_exists($cacheKey)) {
        $cached = json_decode((string) file_get_contents($cacheKey), true);
        if ($cached && isset($cached['token'], $cached['expires']) && $cached['expires'] > time() + 30) {
            return $cached['token'];
        }
    }

    $tokenResponse = httpRequest('https://accounts.spotify.com/api/token', [
        'Authorization: Basic ' . base64_encode($clientId . ':' . $clientSecret),
        'Content-Type: application/x-www-form-urlencoded',
    ], http_build_query(['grant_type' => 'client_credentials']));

    if (!$tokenResponse['success']) {
        return null;
    }

    $decoded = json_decode($tokenResponse['body'], true);
    if (!isset($decoded['access_token'])) {
        return null;
    }

    $payload = [
        'token' => $decoded['access_token'],
        'expires' => time() + (int) ($decoded['expires_in'] ?? 300),
    ];

    @file_put_contents($cacheKey, json_encode($payload));

    return $payload['token'];
}

function mergePodcastResults(array $appleItems, array $spotifyData, int $limit): array
{
    $spotifyItems = $spotifyData['items'] ?? [];
    $matched = [];

    foreach ($appleItems as $appleItem) {
        $match = findSpotifyMatch($appleItem, $spotifyItems);
        
        $spotifyUrl = $match['spotify_url'] ?? null;
        if (!$spotifyUrl) {
            // Fallback to Spotify Search if direct match not found
            $spotifyUrl = 'https://open.spotify.com/search/' . rawurlencode($appleItem['title']);
        }

        $matched[] = array_filter([
            'title' => $appleItem['title'],
            'description' => $appleItem['description'],
            'published_at' => $appleItem['published_at'],
            'image' => $appleItem['image'],
            'show' => $appleItem['show'],
            'apple_url' => $appleItem['apple_url'],
            'spotify_url' => $spotifyUrl,
        ]);
    }

    if (count($matched) < $limit) {
        foreach ($spotifyItems as $item) {
            if (count($matched) >= $limit) {
                break;
            }

            if (spotifyAlreadyUsed($item, $matched)) {
                continue;
            }

            $matched[] = array_filter([
                'title' => $item['title'],
                'description' => $item['description'],
                'published_at' => $item['published_at'],
                'image' => $item['image'],
                'show' => $item['show'],
                'spotify_url' => $item['spotify_url'],
            ]);
        }
    }

    return array_slice($matched, 0, $limit);
}

function findSpotifyMatch(array $appleItem, array &$spotifyItems): ?array
{
    $appleTitle = normalizeString($appleItem['title'] ?? '');
    $appleShow = normalizeString($appleItem['show'] ?? '');

    $bestIndex = null;
    $bestScore = 0.0;

    foreach ($spotifyItems as $index => $item) {
        $titleScore = similarityScore($appleTitle, normalizeString($item['title'] ?? ''));
        $showScore = similarityScore($appleShow, normalizeString($item['show'] ?? ''));
        $score = max($titleScore, $showScore);

        if ($score > $bestScore) {
            $bestScore = $score;
            $bestIndex = $index;
        }

        if ($score >= 0.85) {
            break;
        }
    }

    if ($bestIndex !== null && $bestScore >= 0.4) {
        $match = $spotifyItems[$bestIndex];
        unset($spotifyItems[$bestIndex]);
        return $match;
    }

    return null;
}

function spotifyAlreadyUsed(array $item, array $existing): bool
{
    foreach ($existing as $entry) {
        if (!empty($entry['spotify_url']) && $entry['spotify_url'] === $item['spotify_url']) {
            return true;
        }
    }
    return false;
}

function normalizeString(string $value): string
{
    $value = strtolower($value);
    return preg_replace('/[^a-z0-9]+/', '', $value) ?? '';
}

function similarityScore(string $a, string $b): float
{
    if ($a === '' || $b === '') {
        return 0.0;
    }
    similar_text($a, $b, $percent);
    return $percent / 100;
}

function httpJsonRequest(string $url, array $headers = []): ?array
{
    $response = httpRequest($url, $headers);
    if (!$response['success']) {
        return null;
    }

    $decoded = json_decode($response['body'], true);
    return is_array($decoded) ? $decoded : null;
}

function httpRequest(string $url, array $headers = [], ?string $body = null): array
{
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }

    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $responseBody = curl_exec($ch);
    $error = curl_error($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'success' => $error === '' && $status >= 200 && $status < 300,
        'status' => $status,
        'body' => $responseBody ?: '',
        'error' => $error,
    ];
}
