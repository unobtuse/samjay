<?php
declare(strict_types=1);

require_once __DIR__ . '/google.php';

function samjay_youtube_sync(array $options = []): array
{
    $report = [
        'success' => false,
        'message' => null,
        'channel_id' => null,
        'uploads_playlist_id' => null,
        'target_playlist_id' => samjay_env('YOUTUBE_TARGET_PLAYLIST_ID', ''),
        'inserted' => 0,
        'already_present' => 0,
        'considered' => 0,
        'dry_run' => !empty($options['dry_run']),
        'log' => [],
    ];

    if ($report['target_playlist_id'] === '') {
        $report['message'] = 'YOUTUBE_TARGET_PLAYLIST_ID is not configured.';
        return $report;
    }

    $tokens = samjay_google_load_tokens();
    if (empty($tokens['refresh_token'])) {
        $report['message'] = 'Google OAuth refresh token not found. Authorize via /samjay/auth/google/start.php first.';
        return $report;
    }

    $limit = max(1, samjay_env_int('YOUTUBE_SYNC_INSERT_LIMIT', 50));
    $channelId = trim((string) samjay_env('YOUTUBE_CHANNEL_ID', ''));
    $handle = trim((string) samjay_env('YOUTUBE_CHANNEL_HANDLE', ''));

    if ($channelId === '' && $handle === '') {
        $report['message'] = 'Provide either YOUTUBE_CHANNEL_ID or YOUTUBE_CHANNEL_HANDLE.';
        return $report;
    }

    $resolved = samjay_youtube_resolve_channel($channelId, $handle);
    if (!$resolved['success']) {
        $report['message'] = $resolved['message'];
        $report['log'][] = $resolved['message'];
        return $report;
    }

    $channelId = $resolved['channel_id'];
    $uploadsPlaylistId = $resolved['uploads_playlist_id'];
    $report['channel_id'] = $channelId;
    $report['uploads_playlist_id'] = $uploadsPlaylistId;

    $uploads = samjay_youtube_fetch_playlist_video_ids($uploadsPlaylistId);
    if (!$uploads['success']) {
        $report['message'] = 'Unable to fetch upload playlist videos: ' . $uploads['message'];
        $report['log'][] = $report['message'];
        return $report;
    }

    $target = samjay_youtube_fetch_playlist_video_ids($report['target_playlist_id']);
    if (!$target['success']) {
        $report['message'] = 'Unable to fetch target playlist videos: ' . $target['message'];
        $report['log'][] = $report['message'];
        return $report;
    }

    $targetSet = array_fill_keys($target['video_ids'], true);
    $newVideoIds = [];
    foreach ($uploads['video_ids'] as $videoId) {
        if (!isset($targetSet[$videoId])) {
            $newVideoIds[] = $videoId;
        }
    }

    if (empty($newVideoIds)) {
        $report['success'] = true;
        $report['message'] = 'No new videos found.';
        $report['already_present'] = count($target['video_ids']);
        return $report;
    }

    // Ensure chronological insertion (older videos inserted first so newest ends at top when using position 0)
    $newVideoIds = array_reverse($newVideoIds);

    $inserted = 0;
    foreach ($newVideoIds as $videoId) {
        if ($inserted >= $limit) {
            $report['log'][] = 'Insert limit reached (' . $limit . ').';
            break;
        }

        if ($report['dry_run']) {
            $report['log'][] = '[dry-run] Would insert video ' . $videoId;
            $inserted++;
            continue;
        }

        $result = samjay_youtube_insert_video($report['target_playlist_id'], $videoId);
        if ($result['success']) {
            $inserted++;
            $report['log'][] = 'Inserted video ' . $videoId;
        } else {
            $report['log'][] = 'Failed to insert ' . $videoId . ': ' . $result['message'];
        }
    }

    $report['inserted'] = $inserted;
    $report['already_present'] = count($target['video_ids']);
    $report['considered'] = count($newVideoIds);
    $report['success'] = true;
    $report['message'] = $inserted > 0
        ? 'Inserted ' . $inserted . ' videos into playlist.'
        : 'No videos inserted (limit maybe zero or dry run).';

    return $report;
}

function samjay_youtube_resolve_channel(string $channelId, string $handle): array
{
    if ($channelId !== '') {
        return samjay_youtube_fetch_channel_details($channelId);
    }

    $handle = ltrim($handle, '@');
    if ($handle === '') {
        return ['success' => false, 'message' => 'Channel handle not provided.'];
    }

    // Try username lookup first
    $response = samjay_google_api('GET', 'https://www.googleapis.com/youtube/v3/channels', [
        'query' => [
            'part' => 'contentDetails',
            'forUsername' => $handle,
            'maxResults' => 1,
        ],
    ]);

    if ($response['success'] && !empty($response['json']['items'][0])) {
        $item = $response['json']['items'][0];
        return [
            'success' => true,
            'channel_id' => $item['id'],
            'uploads_playlist_id' => $item['contentDetails']['relatedPlaylists']['uploads'] ?? null,
        ];
    }

    // Fallback: search for channel by handle keyword
    $search = samjay_google_api('GET', 'https://www.googleapis.com/youtube/v3/search', [
        'query' => [
            'part' => 'snippet',
            'type' => 'channel',
            'q' => $handle,
            'maxResults' => 1,
        ],
    ]);

    if (!$search['success'] || empty($search['json']['items'][0]['id']['channelId'])) {
        return ['success' => false, 'message' => 'Unable to resolve channel for handle ' . $handle];
    }

    $channelId = $search['json']['items'][0]['id']['channelId'];
    return samjay_youtube_fetch_channel_details($channelId);
}

function samjay_youtube_fetch_channel_details(string $channelId): array
{
    $response = samjay_google_api('GET', 'https://www.googleapis.com/youtube/v3/channels', [
        'query' => [
            'part' => 'contentDetails',
            'id' => $channelId,
            'maxResults' => 1,
        ],
    ]);

    if (!$response['success'] || empty($response['json']['items'][0])) {
        return ['success' => false, 'message' => 'Unable to load channel ' . $channelId];
    }

    $item = $response['json']['items'][0];
    $uploads = $item['contentDetails']['relatedPlaylists']['uploads'] ?? null;

    if ($uploads === null) {
        return ['success' => false, 'message' => 'Uploads playlist not found for channel ' . $channelId];
    }

    return [
        'success' => true,
        'channel_id' => $item['id'],
        'uploads_playlist_id' => $uploads,
    ];
}

function samjay_youtube_fetch_playlist_video_ids(string $playlistId): array
{
    $videoIds = [];
    $pageToken = null;

    do {
        $params = [
            'part' => 'contentDetails',
            'playlistId' => $playlistId,
            'maxResults' => 50,
        ];
        if ($pageToken) {
            $params['pageToken'] = $pageToken;
        }

        $response = samjay_google_api('GET', 'https://www.googleapis.com/youtube/v3/playlistItems', [
            'query' => $params,
        ]);

        if (!$response['success']) {
            return ['success' => false, 'message' => $response['error'] ?: $response['body'], 'video_ids' => []];
        }

        foreach ($response['json']['items'] ?? [] as $item) {
            if (!empty($item['contentDetails']['videoId'])) {
                $videoIds[] = $item['contentDetails']['videoId'];
            }
        }

        $pageToken = $response['json']['nextPageToken'] ?? null;
    } while ($pageToken);

    return ['success' => true, 'video_ids' => $videoIds];
}

function samjay_youtube_insert_video(string $playlistId, string $videoId): array
{
    $response = samjay_google_api('POST', 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', [
        'json' => [
            'snippet' => [
                'playlistId' => $playlistId,
                'resourceId' => [
                    'kind' => 'youtube#video',
                    'videoId' => $videoId,
                ],
            ],
        ],
    ]);

    if ($response['success']) {
        return ['success' => true];
    }

    $message = $response['error'] ?: ($response['json']['error']['message'] ?? $response['body']);
    return ['success' => false, 'message' => $message];
}
