<?php
$rssUrl = "https://news.google.com/rss/topics/CAAqKAgKIiJDQkFTRXdvTkwyY3ZNVEZtTVRJeWNITTJaeElDWlc0b0FBUAE?hl=en-US&gl=US&ceid=US:en";
$content = file_get_contents($rssUrl);
echo "Content Length: " . strlen($content) . "\n";
$xml = simplexml_load_string($content);
echo "XML Loaded: " . ($xml ? "Yes" : "No") . "\n";
echo "Channel Items: " . count($xml->channel->item) . "\n";
foreach($xml->channel->item as $item) {
    echo "Item: " . $item->title . "\n";
}
