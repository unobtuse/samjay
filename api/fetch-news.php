<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$dataFile = __DIR__ . '/../data/news.json';

if (file_exists($dataFile)) {
    readfile($dataFile);
} else {
    // Fallback: empty array if cron hasn't run yet
    echo json_encode([]);
}


