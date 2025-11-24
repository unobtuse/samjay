<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/youtube_sync.php';

header('Content-Type: application/json; charset=utf-8');

$accessKey = trim((string) samjay_env('YOUTUBE_SYNC_ACCESS_KEY', ''));
$providedKey = $_GET['key'] ?? '';

if ($accessKey === '') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'YOUTUBE_SYNC_ACCESS_KEY is not configured. Use the CLI script instead.',
    ]);
    exit;
}

if (!hash_equals($accessKey, (string) $providedKey)) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid access key.',
    ]);
    exit;
}

$dryRun = isset($_GET['dry_run']);
$result = samjay_youtube_sync(['dry_run' => $dryRun]);

http_response_code($result['success'] ? 200 : 500);
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
