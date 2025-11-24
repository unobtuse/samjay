<?php
// Lightweight PHP-only News Scraper using Bing RSS
// No Puppeteer/Node required. Run this via Cron.

$outputFile = __DIR__ . '/news_data.json';
$lockFile = __DIR__ . '/news_fetch.lock';

// Prevent concurrent executions
if (file_exists($lockFile) && (time() - filemtime($lockFile)) < 300) {
    die("Scraper is already running.\n");
}
touch($lockFile);

// 1. Fetch Bing News RSS
$query = "Sam Jay Comedian";
$rssUrl = "https://www.bing.com/news/search?q=" . urlencode($query) . "&format=rss";

echo "Fetching RSS from: $rssUrl\n";

$rssContent = fetchUrl($rssUrl);
if (!$rssContent) {
    unlink($lockFile);
    die("Failed to fetch RSS feed.\n");
}

$xml = @simplexml_load_string($rssContent);
if (!$xml) {
    unlink($lockFile);
    die("Failed to parse XML.\n");
}

$articles = [];
$maxArticles = 8; // Get a few more to filter bad ones
$count = 0;

$mh = curl_multi_init();
$curlHandles = [];

foreach ($xml->channel->item as $item) {
    if ($count >= $maxArticles) break;

    $bingLink = (string)$item->link;
    $realUrl = $bingLink;

    // Extract real URL from Bing redirect params
    // Format: url=https%3a%2f%2f...
    $parts = parse_url($bingLink);
    if (isset($parts['query'])) {
        parse_str($parts['query'], $queryParts);
        if (isset($queryParts['url'])) {
            $realUrl = $queryParts['url'];
        }
    }

    $articles[$count] = [
        'headline' => (string)$item->title,
        'link' => $realUrl,
        'date' => date('M d, Y', strtotime((string)$item->pubDate)),
        'source' => (string)$item->children('News', true)->Source ?? (string)$item->source,
        'image' => null
    ];

    // Prepare CURL to scrape the DESTINATION page for og:image
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $realUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    // Only fetch first 150kb to find meta tags quickly
    curl_setopt($ch, CURLOPT_RANGE, '0-150000'); 
    
    curl_multi_add_handle($mh, $ch);
    $curlHandles[$count] = $ch;
    
    $count++;
}

// Execute parallel requests
$running = null;
do {
    curl_multi_exec($mh, $running);
} while ($running);

// Process Results
foreach ($curlHandles as $id => $ch) {
    $html = curl_multi_getcontent($ch);
    
    if ($html) {
        // Look for og:image
        if (preg_match('/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $matches)) {
            $articles[$id]['image'] = html_entity_decode($matches[1]);
        }
        // Fallback to twitter:image
        elseif (preg_match('/<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $matches)) {
            $articles[$id]['image'] = html_entity_decode($matches[1]);
        }
        
        // Resolve relative URLs
        if (!empty($articles[$id]['image'])) {
            $img = $articles[$id]['image'];
            if (strpos($img, 'http') !== 0) {
                if (strpos($img, '//') === 0) {
                    $articles[$id]['image'] = 'https:' . $img;
                } else {
                    $host = parse_url($articles[$id]['link'], PHP_URL_HOST);
                    $scheme = parse_url($articles[$id]['link'], PHP_URL_SCHEME) ?: 'https';
                    $articles[$id]['image'] = $scheme . '://' . $host . '/' . ltrim($img, '/');
                }
            }
        }
    }
    
    curl_multi_remove_handle($mh, $ch);
    curl_close($ch);
}

curl_multi_close($mh);

// Filter articles to only those with images? Or keep all?
// Let's keep top 6, prioritizing those with images
usort($articles, function($a, $b) {
    // Give weight to having an image
    $scoreA = $a['image'] ? 10 : 0;
    $scoreB = $b['image'] ? 10 : 0;
    // And recency (simple string comparison of date might fail, but they are already sorted by RSS)
    return $scoreB - $scoreA; 
});

$finalData = array_slice($articles, 0, 6);

// Save to JSON
$bytes = file_put_contents($outputFile, json_encode($finalData, JSON_PRETTY_PRINT));
echo "Success: Saved " . count($finalData) . " articles to $outputFile ($bytes bytes).\n";

unlink($lockFile);

function fetchUrl($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; SamJayBot/1.0)');
    $data = curl_exec($ch);
    curl_close($ch);
    return $data;
}
