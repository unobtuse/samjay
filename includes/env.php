<?php
declare(strict_types=1);

if (!defined('SAMJAY_BASE_PATH')) {
    define('SAMJAY_BASE_PATH', realpath(__DIR__ . '/..'));
}

if (!defined('SAMJAY_ENV_PATH')) {
    define('SAMJAY_ENV_PATH', SAMJAY_BASE_PATH . '/.env');
}

if (!defined('SAMJAY_STORAGE_PATH')) {
    define('SAMJAY_STORAGE_PATH', dirname(__DIR__, 2) . '/storage/samjay');
}

if (!is_dir(SAMJAY_STORAGE_PATH)) {
    @mkdir(SAMJAY_STORAGE_PATH, 0775, true);
}

if (!function_exists('str_starts_with')) {
    function str_starts_with(string $haystack, string $needle): bool
    {
        return $needle === '' || strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}

if (!function_exists('str_ends_with')) {
    function str_ends_with(string $haystack, string $needle): bool
    {
        if ($needle === '') {
            return true;
        }
        return substr($haystack, -strlen($needle)) === $needle;
    }
}

/**
 * Fetch a value from the .env file with optional default.
 */
function samjay_env(string $key, ?string $default = null): ?string
{
    static $envCache = null;

    if ($envCache === null) {
        $envCache = samjay_load_env();
    }

    return array_key_exists($key, $envCache) ? $envCache[$key] : $default;
}

function samjay_env_bool(string $key, bool $default = false): bool
{
    $value = samjay_env($key);
    if ($value === null) {
        return $default;
    }

    return in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true);
}

function samjay_env_int(string $key, int $default = 0): int
{
    $value = samjay_env($key);
    return $value === null ? $default : (int) $value;
}

function samjay_load_env(): array
{
    if (!file_exists(SAMJAY_ENV_PATH)) {
        return [];
    }

    $vars = [];
    $lines = file(SAMJAY_ENV_PATH, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || str_starts_with($line, ';')) {
            continue;
        }

        [$key, $value] = array_pad(explode('=', $line, 2), 2, null);
        if ($key === null) {
            continue;
        }

        $key = trim($key);
        $value = $value === null ? '' : trim($value);

        if (str_starts_with($value, '"') && str_ends_with($value, '"')) {
            $value = substr($value, 1, -1);
        } elseif (str_starts_with($value, "'") && str_ends_with($value, "'")) {
            $value = substr($value, 1, -1);
        }

        $vars[$key] = $value;
    }

    // Perform simple variable substitution (${VAR})
    foreach ($vars as $key => $value) {
        $vars[$key] = preg_replace_callback('/\$\{([^}]+)\}/', static function ($matches) use (&$vars) {
            $ref = $matches[1];
            return $vars[$ref] ?? '';
        }, $value);
    }

    return $vars;
}

function samjay_storage_path(string $file = ''): string
{
    $path = SAMJAY_STORAGE_PATH;
    if (!is_dir($path)) {
        @mkdir($path, 0775, true);
    }

    return $file !== '' ? rtrim($path, '/').'/'.ltrim($file, '/') : $path;
}
