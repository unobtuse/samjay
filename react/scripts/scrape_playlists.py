import json
import re
import subprocess
import sys

PLAYLISTS = [
    {
        "playlist-name": "Stand-Up",
        "playlist-url": "https://www.youtube.com/playlist?list=PLFCocoJjIxr-r0awY7WFMKMWrFOrDyl2o"
    }, {
        "playlist-name": "Pause with Sam Jay",
        "playlist-url": "https://www.youtube.com/playlist?list=PLFCocoJjIxr_m-h_jov5RTu8r8lcTWFo6"
    }, {
        "playlist-name": "Conversations",
        "playlist-url": "https://www.youtube.com/playlist?list=PLFCocoJjIxr_1ub7jhw4k291L1Y8_yDEf"
    }, {
        "playlist-name": "Onsight",
        "playlist-url": "https://www.youtube.com/playlist?list=PLFCocoJjIxr-toLvOXduuO0YPEU8uMnCh"
    }, {
        "playlist-name": "Shorts",
        "playlist-url": "https://www.youtube.com/playlist?list=PLFCocoJjIxr_J9Uj-O3tafeRsqPQBWJKY"
    }
]

# Main channel videos page
CHANNEL_VIDEOS_URL = "https://www.youtube.com/@samjaycomic/videos"

OUTPUT_FILE = "/var/www/html/gabemade/public/samjay/react/public/data/videos.json"

def fetch_url(url):
    try:
        # Use curl to get the HTML
        result = subprocess.run(
            ['curl', '-s', '-L', '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', url],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error fetching {url}: {e}")
        return None

def extract_initial_data(html):
    pattern = r'var ytInitialData = ({.*?});'
    match = re.search(pattern, html)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            print("Error decoding JSON data")
    return None

def parse_videos(data, playlist_name):
    videos = []
    try:
        # Navigate down to the playlist video list
        # Note: The path can vary, but typically:
        # contents -> twoColumnBrowseResultsRenderer -> tabs -> [0] -> tabRenderer -> content -> sectionListRenderer -> contents -> [0] -> itemSectionRenderer -> contents -> [0] -> playlistVideoListRenderer -> contents
        
        tabs = data['contents']['twoColumnBrowseResultsRenderer']['tabs']
        tab = tabs[0]['tabRenderer']
        content = tab['content']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][0]['playlistVideoListRenderer']['contents']
        
        for item in content:
            if 'playlistVideoRenderer' in item:
                video_data = item['playlistVideoRenderer']
                video_id = video_data.get('videoId')
                title = video_data.get('title', {}).get('runs', [{}])[0].get('text', 'Unknown Title')
                
                # Construct video object
                if video_id:
                    videos.append({
                        "title": title,
                        "img": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                        "link": f"https://www.youtube.com/watch?v={video_id}",
                        "category": playlist_name
                    })
    except Exception as e:
        print(f"Error parsing structure for {playlist_name}: {e}")
        # Debug: Dump structure keys if possible or just fail gracefully
    
    return videos

def parse_channel_videos(data):
    videos = []
    try:
        # Navigate down to the channel videos list
        # Path: contents -> twoColumnBrowseResultsRenderer -> tabs -> [1] -> tabRenderer -> content -> richGridRenderer -> contents
        
        tabs = data['contents']['twoColumnBrowseResultsRenderer']['tabs']
        # Videos tab is usually the second tab (index 1)
        for tab_data in tabs:
            if 'tabRenderer' in tab_data:
                tab = tab_data['tabRenderer']
                if 'content' in tab and 'richGridRenderer' in tab['content']:
                    content = tab['content']['richGridRenderer']['contents']
                    
                    for item in content:
                        if 'richItemRenderer' in item:
                            video_renderer = item['richItemRenderer']['content'].get('videoRenderer', {})
                            video_id = video_renderer.get('videoId')
                            title = video_renderer.get('title', {}).get('runs', [{}])[0].get('text', 'Unknown Title')
                            
                            if video_id:
                                videos.append({
                                    "title": title,
                                    "img": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                                    "link": f"https://www.youtube.com/watch?v={video_id}",
                                    "category": "Recent"
                                })
                    break
    except Exception as e:
        print(f"Error parsing channel videos: {e}")
    
    return videos

def main():
    all_videos = []
    
    # First, fetch from main channel videos page
    print("Processing main channel videos...")
    html = fetch_url(CHANNEL_VIDEOS_URL)
    if html:
        data = extract_initial_data(html)
        if data:
            videos = parse_channel_videos(data)
            print(f"Found {len(videos)} videos from main channel.")
            all_videos.extend(videos)
        else:
            print("Could not find ytInitialData for main channel")
    else:
        print("Could not fetch main channel videos")
    
    # Then fetch from playlists
    for playlist in PLAYLISTS:
        name = playlist['playlist-name']
        url = playlist['playlist-url']
        print(f"Processing {name}...")
        
        html = fetch_url(url)
        if not html:
            continue
            
        data = extract_initial_data(html)
        if not data:
            print(f"Could not find ytInitialData for {name}")
            continue
            
        videos = parse_videos(data, name)
        print(f"Found {len(videos)} videos.")
        all_videos.extend(videos)

    # Write to file
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(all_videos, f, indent=2)
    
    print(f"Successfully wrote {len(all_videos)} videos to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
