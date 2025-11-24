<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/youtube_sync.php';

$dryRun = in_array('--dry-run', $argv ?? [], true);

$result = samjay_youtube_sync(['dry_run' => $dryRun]);

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;

if (!$result['success']) {
    exit(1);
}
