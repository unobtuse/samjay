<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/env.php';

header('Content-Type: application/json; charset=utf-8');

$query = trim($_GET['q'] ?? 'Sam Jay');
$limit = max(4, min(20, (int) ($_GET['limit'] ?? 8)));
$cacheMinutes = max(1, samjay_env_int('PRESS_CACHE_MINUTES', 15));
$cacheFile = samjay_storage_path('press_cache.json');

if (empty($_GET['refresh']) && ($cached = loadCache($cacheFile, $cacheMinutes))) {
    echo json_encode($cached, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

$feedUrl = buildFeedUrl($query);
$raw = fetchFeed($feedUrl);

if ($raw === null) {
    http_response_code(502);
    echo json_encode(['success' => false, 'message' => 'Unable to contact Google News']);
    exit;
}

$items = parseFeed($raw, $limit);
$payload = [
    'success' => true,
    'query' => $query,
    'count' => count($items),
    'items' => $items,
    'fetched_at' => gmdate('c'),
];

file_put_contents($cacheFile, json_encode(['expiry' => time() + ($cacheMinutes * 60), 'payload' => $payload]));

echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

function buildFeedUrl(string $query): string
{
    $encoded = urlencode($query);
    return "https://news.google.com/rss/search?q={$encoded}&hl=en-US&gl=US&ceid=US:en";
}

function fetchFeed(string $url): ?string
{
    return httpFetch($url, 12);
}

function parseFeed(string $xmlString, int $limit): array
{
    $items = [];
    $xml = @simplexml_load_string($xmlString, 'SimpleXMLElement', LIBXML_NOCDATA);
    if (!$xml || empty($xml->channel->item)) {
        return $items;
    }

    $namespaces = $xml->getNamespaces(true);
    foreach ($xml->channel->item as $item) {
        if (count($items) >= $limit) {
            break;
        }

        $title = trim((string) $item->title);
        $link = extractLink((string) $item->link);
        $pubDate = date(DATE_ATOM, strtotime((string) $item->pubDate));
        $source = trim((string) $item->source);
        $description = sanitizeDescription((string) $item->description);
        $image = extractImage($item, $namespaces);
        if (!$image) {
            $image = fetchOgImage($link);
        }

        $items[] = array_filter([
            'title' => $title,
            'link' => $link,
            'published_at' => $pubDate,
            'source' => $source,
            'excerpt' => truncate($description, 220),
            'image' => $image,
        ]);
    }

    return $items;
}

function extractLink(string $raw): string
{
    if (preg_match('/url=([^&]+)/', $raw, $matches)) {
        return urldecode($matches[1]);
    }
    return $raw;
}

function extractImage(SimpleXMLElement $item, array $namespaces): ?string
{
    if (!empty($namespaces['media'])) {
        foreach ($item->children($namespaces['media']) as $media) {
            if (!empty($media->attributes()->url)) {
                return (string) $media->attributes()->url;
            }
        }
    }

    if (!empty($item->enclosure['url'])) {
        return (string) $item->enclosure['url'];
    }

    return null;
}

function fetchOgImage(string $url): ?string
{
    if ($url === '') {
        return null;
    }

    $html = httpFetch($url, 8);
    if ($html === null) {
        return null;
    }

    return matchMetaImage($html, ['og:image', 'og:image:secure_url', 'twitter:image', 'twitter:image:src']);
}

function matchMetaImage(string $html, array $properties): ?string
{
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    if (!$dom->loadHTML($html)) {
        libxml_clear_errors();
        return null;
    }
    libxml_clear_errors();

    $metaTags = $dom->getElementsByTagName('meta');
    foreach ($properties as $property) {
        foreach ($metaTags as $meta) {
            $propValue = strtolower($meta->getAttribute('property') ?: $meta->getAttribute('name'));
            if ($propValue === strtolower($property)) {
                $content = trim($meta->getAttribute('content'));
                if ($content !== '') {
                    return html_entity_decode($content, ENT_QUOTES | ENT_HTML5);
                }
            }
        }
    }

    return null;
}

function truncate(string $text, int $max): string
{
    if (mb_strlen($text) <= $max) {
        return $text;
    }
    return mb_substr($text, 0, $max - 1) . '…';
}

function sanitizeDescription(string $text): string
{
    return trim(strip_tags(html_entity_decode($text, ENT_QUOTES | ENT_HTML5)));
}

function loadCache(string $file, int $cacheMinutes): ?array
{
    if (!file_exists($file)) {
        return null;
    }

    $payload = json_decode((string) file_get_contents($file), true);
    if (!$payload || ($payload['expiry'] ?? 0) < time()) {
        return null;
    }

    return $payload['payload'] ?? null;
}

function httpFetch(string $url, int $timeout = 12): ?string
{
    $context = stream_context_create([
        'http' => [
            'timeout' => $timeout,
            'header' => "User-Agent: samjay-site\r\n",
        ],
    ]);
    $data = @file_get_contents($url, false, $context);
    if ($data !== false) {
        return $data;
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_USERAGENT => 'samjay-site',
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    return $error === '' ? $response : null;
}
