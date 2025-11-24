import re
import json
import os
import html

def scrape_shows(input_file, output_file):
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: File {input_file} not found.")
        return

    # Regex to find the show blocks
    # We look for the pattern of h4 (Date), h6 (City), then two p tags (Time, Venue), then the ticket link
    
    # This regex tries to capture the logical grouping of a show card
    # Note: using non-greedy match .*? and re.DOTALL to match across newlines
    
    shows = []
    
    # Strategy: Find all chunks that look like a show card
    # The outer container usually has specific classes, but matching the inner content sequence is more robust
    
    # Pattern components
    date_pattern = r'<h4[^>]*class="[^"]*text-xl[^"]*"[^>]*>\s*(.*?)\s*</h4>'
    city_pattern = r'<h6[^>]*class="[^"]*text-xl[^"]*"[^>]*>\s*(.*?)\s*</h6>'
    
    # Time and Venue are inside a specific div structure, but usually appear as two consecutive <p> tags
    # We look for the specific container div to be safe, or just the proximity
    # The container class has "text-[#606060]" which seems unique to this metadata block
    info_block_start = r'text-\[#606060\][^>]*>'
    time_venue_pattern = r'<p>(.*?)</p>\s*<p>(.*?)</p>'
    
    # Ticket link
    link_pattern = r'<a target="_blank"[^>]*href="([^"]+)"'

    # Let's try to split the content into "cards" first to avoid mixing up shows
    # The card container class: "w-full px-4 py-4"
    # We can use a simplified split or just iterate finding the patterns
    
    # Using finditer might be risky if the structure varies slightly between matches
    # Let's try to find all matches for the sequence
    
    # We will search for the sequence: Date -> City -> Time -> Venue -> Link
    # This assumes they appear in this order for every show card
    
    combined_pattern = (
        date_pattern + 
        r'.*?' + 
        city_pattern + 
        r'.*?' + 
        info_block_start + 
        r'\s*' + 
        time_venue_pattern + 
        r'.*?' + 
        link_pattern
    )
    
    matches = re.finditer(combined_pattern, content, re.DOTALL | re.IGNORECASE)
    
    for match in matches:
        date = match.group(1).strip()
        city = match.group(2).strip()
        time = match.group(3).strip()
        venue = match.group(4).strip()
        link = match.group(5).strip()
        
        # Clean up HTML entities
        date = html.unescape(date).replace('\n', '').strip()
        city = html.unescape(city).replace('\n', '').strip()
        venue = html.unescape(venue).strip()
        link = html.unescape(link).strip()
        
        show = {
            "date": date,
            "city": city,
            "time": time,
            "venue": venue,
            "ticket_link": link
        }
        shows.append(show)

    print(f"Found {len(shows)} shows.")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(shows, f, indent=4)
    
    print(f"Successfully saved data to {output_file}")

if __name__ == "__main__":
    input_path = "/var/www/html/gabemade/public/samjay/shows.php"
    output_path = "shows.json"
    scrape_shows(input_path, output_path)
