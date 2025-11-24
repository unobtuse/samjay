<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');

$encoded = $_GET['src'] ?? '';
if ($encoded === '') {
    http_response_code(400);
    echo 'Missing src parameter';
    exit;
}

$url = base64_decode($encoded, true);
if ($url === false || !filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo 'Invalid URL';
    exit;
}

$parts = parse_url($url);
if ($parts === false || empty($parts['host'])) {
    http_response_code(400);
    echo 'Invalid URL';
    exit;
}

$host = strtolower($parts['host']);
$allowedHost = (strpos($host, 'cdninstagram.com') !== false || strpos($host, 'fbcdn.net') !== false);
if (!$allowedHost) {
    http_response_code(403);
    echo 'Host not allowed';
    exit;
}

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; SamJaySite/1.0)',
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_HEADER => true,
]);

$response = curl_exec($ch);
if ($response === false) {
    http_response_code(502);
    echo 'Upstream fetch failed';
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$headersRaw = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);
$status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE) ?: 500;
curl_close($ch);

if ($status >= 400 || $body === '') {
    http_response_code(502);
    echo 'Upstream returned error';
    exit;
}

$contentType = 'application/octet-stream';
foreach (preg_split("/[\r\n]+/", $headersRaw) as $line) {
    if (stripos($line, 'Content-Type:') === 0) {
        $contentType = trim(substr($line, strlen('Content-Type:')));
        break;
    }
}

header_remove('X-Powered-By');
header('Content-Type: ' . $contentType);
header('Cache-Control: public, max-age=900');
echo $body;
