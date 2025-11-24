<?php
declare(strict_types=1);

require_once __DIR__ . '/env.php';

function samjay_store_oauth_state(string $state): void
{
    $dir = samjay_storage_path('oauth_states');
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }

    $file = $dir . '/state-' . $state . '.json';
    file_put_contents($file, (string) time());
}

function samjay_consume_oauth_state(string $state, ?string &$sessionState = null): bool
{
    if ($state === '') {
        return false;
    }

    if ($sessionState !== null && hash_equals($sessionState, $state)) {
        $sessionState = null;
        samjay_delete_oauth_state_file($state);
        return true;
    }

    if (!preg_match('/^[A-Fa-f0-9]{10,}$/', $state)) {
        return false;
    }

    $file = samjay_storage_path('oauth_states/state-' . $state . '.json');
    if (!file_exists($file)) {
        return false;
    }

    $createdAt = (int) file_get_contents($file);
    if ($createdAt < time() - 600) {
        @unlink($file);
        return false;
    }

    @unlink($file);
    return true;
}

function samjay_delete_oauth_state_file(string $state): void
{
    $file = samjay_storage_path('oauth_states/state-' . $state . '.json');
    if (file_exists($file)) {
        @unlink($file);
    }
}
