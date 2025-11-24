<?php
$url = "https://news.google.com/rss/topics/CAAqKAgKIiJDQkFTRXdvTkwyY3ZNVEZtTVRJeWNITTJaeElDWlc0b0FBUAE?hl=en-US&gl=US&ceid=US:en";
$xml = simplexml_load_file($url);
if (!$xml) die("Failed to load XML\n");

$item = $xml->channel->item[0];
echo "Title: " . $item->title . "\n";
echo "Link: " . $item->link . "\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, (string)$item->link);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_HEADER, true); // Show headers to see redirects
curl_setopt($ch, CURLOPT_NOBODY, true); // Don't fetch body yet
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
curl_setopt($ch, CURLOPT_COOKIEJAR, '/tmp/cookie_debug.txt'); 
curl_setopt($ch, CURLOPT_COOKIEFILE, '/tmp/cookie_debug.txt');
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$output = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);

echo "Final URL: " . $info['url'] . "\n";
echo "HTTP Code: " . $info['http_code'] . "\n";
