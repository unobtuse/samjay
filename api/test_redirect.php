<?php
// Test URL from Vanyaland article via Google News
$url = "https://news.google.com/rss/articles/CBMimwFBVV95cUxNM2lvSGhPY2JTbHN2S1pkUFR5d1pHZHhwV19qQXdDVkxXMEZRNUlNX0t2SXlWak1HWjZldmdCVGtWd05tZE05MmZtTXdhcG4xdmNyU0NnYVZoZk9ic2MzdFowelRJcmNxSkdiQ0JocF9lNTRyU0gtTU1Ld0VRY2I1Mk1CdUJPc0lxVzNtSmo1S20zS1NnQ3dBV29Pbw?oc=5";

function follow_google_redirect($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 10);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    curl_setopt($ch, CURLOPT_COOKIEJAR, '/tmp/test_cookies.txt'); 
    curl_setopt($ch, CURLOPT_COOKIEFILE, '/tmp/test_cookies.txt');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    curl_close($ch);
    
    // If we are stuck on a Google page, we might need to parse the "opening" link
    if (strpos($finalUrl, 'news.google.com') !== false || strpos($finalUrl, 'google.com/news') !== false) {
        // Look for <a href="..." in the body
        if (preg_match('/<a[^>]+href=["\']([^"\']+)["\'][^>]*>Opening/i', $response, $matches) || 
            preg_match('/<a[^>]+href=["\']([^"\']+)["\'][^>]*>/i', $response, $matches)) {
             // This is risky as it matches any link, but Google redirect pages usually have the target as a main link
             // Better: search for the specific class or structure if known
        }
    }
    
    return ['url' => $finalUrl, 'content_sample' => substr($response, 0, 500)];
}

$result = follow_google_redirect($url);
print_r($result);
