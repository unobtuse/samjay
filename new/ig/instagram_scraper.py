#!/usr/bin/env python3
"""
Fetch the latest Instagram posts for a public profile without official API tokens.

Uses Instagram's web profile info endpoint and stores normalized metadata (but not media files)
in storage/samjay/instagram_feed.json. Existing entries are replaced with the latest snapshot so
deleted posts naturally disappear on the next run.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

import requests


DEFAULT_USERNAME = "samjaycomic"
DEFAULT_LIMIT = 10
OUTPUT_PATH = Path("/var/www/html/gabemade/public/samjay/new/json/instagram.json")
INSTAGRAM_APP_ID = "936619743392459"
GRAPHQL_QUERY_HASH = "69cba40317214236af40e7efa697781d"
GRAPHQL_PAGE_SIZE = 50


def fetch_profile(username: str) -> Dict[str, Any]:
    url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={username}"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "x-ig-app-id": INSTAGRAM_APP_ID,
    }
    response = requests.get(url, headers=headers, timeout=20)
    response.raise_for_status()
    payload = response.json()
    if "data" not in payload or "user" not in payload["data"]:
        raise ValueError("Unexpected response structure from Instagram")
    return payload["data"]["user"]


def fetch_graphql_page(user_id: str, cursor: str) -> Dict[str, Any]:
    variables = json.dumps({"id": user_id, "first": GRAPHQL_PAGE_SIZE, "after": cursor})
    url = "https://www.instagram.com/graphql/query/"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "x-ig-app-id": INSTAGRAM_APP_ID,
        "Referer": "https://www.instagram.com/",
    }
    params = {"query_hash": GRAPHQL_QUERY_HASH, "variables": variables}
    response = requests.get(url, headers=headers, params=params, timeout=20)
    response.raise_for_status()
    data = response.json()
    return data.get("data", {}).get("user", {})


def collect_media_edges(user: Dict[str, Any], max_count: int | None) -> List[Dict[str, Any]]:
    media = user.get("edge_owner_to_timeline_media", {})
    edges = list(media.get("edges", []))
    page_info = media.get("page_info", {})
    has_next = page_info.get("has_next_page")
    cursor = page_info.get("end_cursor")
    user_id = user.get("id")

    while has_next and cursor and user_id:
        if max_count is not None and len(edges) >= max_count:
            break
        next_user_data = fetch_graphql_page(user_id, cursor)
        timeline = next_user_data.get("edge_owner_to_timeline_media", {})
        next_edges = timeline.get("edges", [])
        edges.extend(next_edges)
        page_info = timeline.get("page_info", {})
        has_next = page_info.get("has_next_page")
        cursor = page_info.get("end_cursor")

    if max_count is not None:
        return edges[:max_count]
    return edges


def normalize_posts(edges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    posts: List[Dict[str, Any]] = []

    for edge in edges:
        node = edge.get("node", {})
        post_id = node.get("id")
        shortcode = node.get("shortcode")
        if not post_id or not shortcode:
            continue

        timestamp = node.get("taken_at_timestamp")
        caption = ""
        caption_edges = node.get("edge_media_to_caption", {}).get("edges", [])
        if caption_edges:
            caption = caption_edges[0].get("node", {}).get("text", "")

        media_items = extract_media_items(node)
        if not media_items:
            continue

        posts.append(
            {
                "id": post_id,
                "shortcode": shortcode,
                "permalink": f"https://www.instagram.com/p/{shortcode}/",
                "media_type": determine_media_type(node),
                "caption": caption,
                "like_count": node.get("edge_liked_by", {}).get("count"),
                "comment_count": node.get("edge_media_to_comment", {}).get("count"),
                "timestamp": isoformat(timestamp),
                "media": media_items,
            }
        )

    return posts


def extract_media_items(node: Dict[str, Any]) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    sidecar = node.get("edge_sidecar_to_children", {}).get("edges", [])

    if sidecar:
        for child in sidecar:
            child_node = child.get("node", {})
            media_info = build_media_entry(child_node)
            if media_info:
                items.append(media_info)
    else:
        media_info = build_media_entry(node)
        if media_info:
            items.append(media_info)

    return items


def build_media_entry(media_node: Dict[str, Any]) -> Dict[str, Any] | None:
    media_id = media_node.get("id")
    if not media_id:
        return None

    is_video = media_node.get("is_video", False)
    video_url = media_node.get("video_url")
    display_url = media_node.get("display_url")

    url = video_url if (is_video and video_url) else display_url
    if not url:
        return None

    return {
        "id": media_id,
        "type": "video" if is_video else "image",
        "url": url,
        "thumbnail_url": display_url,
        "accessibility_caption": media_node.get("accessibility_caption"),
    }


def determine_media_type(node: Dict[str, Any]) -> str:
    if node.get("edge_sidecar_to_children"):
        return "carousel"
    return "video" if node.get("is_video") else "image"


def isoformat(timestamp: Any) -> str | None:
    if not timestamp:
        return None
    try:
        dt = datetime.fromtimestamp(int(timestamp), tz=timezone.utc)
        return dt.isoformat()
    except Exception:
        return None


def save_payload(posts: List[Dict[str, Any]], username: str, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    
    # Load existing data to preserve posts that might not be in the new fetch
    existing_posts = []
    if output.exists():
        try:
            existing_data = json.loads(output.read_text())
            existing_posts = existing_data.get("posts", [])
        except json.JSONDecodeError:
            pass
    
    # Create a dictionary of existing posts keyed by ID for easy lookup
    existing_posts_map = {post["id"]: post for post in existing_posts}
    
    # Update with new posts (overwriting if ID exists, adding if not)
    for post in posts:
        existing_posts_map[post["id"]] = post
        
    # Convert back to list and sort by timestamp descending
    merged_posts = list(existing_posts_map.values())
    merged_posts.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    payload = {
        "username": username,
        "count": len(merged_posts),
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "posts": merged_posts,
    }
    output.write_text(json.dumps(payload, indent=2, ensure_ascii=False))


def main() -> int:
    parser = argparse.ArgumentParser(description="Scrape public Instagram posts")
    parser.add_argument("--username", default=DEFAULT_USERNAME, help="Instagram username")
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT, help="Number of posts to store")
    parser.add_argument("--all", action="store_true", help="Fetch the entire Instagram history")
    parser.add_argument(
        "--output",
        default=str(OUTPUT_PATH),
        help="Path to write JSON payload",
    )
    args = parser.parse_args()

    try:
        user = fetch_profile(args.username)
        max_count = None if args.all else args.limit
        edges = collect_media_edges(user, max_count)
        posts = normalize_posts(edges)
        save_payload(posts, args.username, Path(args.output))
    except Exception as exc:
        print(f"[error] {exc}", file=sys.stderr)
        return 1

    print(f"Saved {len(posts)} posts to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
