import json
import re
import csv
import io

# Input and Output paths
LOG_FILE = 'collegian_log.txt'
JSON_FILE = 'Scraper/rmsmc_categories.json'

def parse_log_file(file_path):
    categories = []
    
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    # Skip lines that don't look like CSV data or header
    data_lines = [line.replace('[Log] ', '').strip() for line in lines if '[Log]' in line]
    
    # Parse CSV
    reader = csv.reader(data_lines)
    header = next(reader, None) # Skip header: Name,Slug,Count
    
    for row in reader:
        if len(row) < 3:
            continue
            
        raw_name = row[0]
        slug = row[1]
        count = row[2]
        
        # Clean name (remove dashes)
        name = raw_name.replace('— ', '').replace('—', '').strip()
        
        # Construct URL
        # Assuming standard WordPress category structure
        url = f"https://collegian.com/category/{slug}/"
        
        categories.append({
            "name": name,
            "slug": slug,
            "url": url
        })
        
    return categories

def update_json(categories):
    try:
        with open(JSON_FILE, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: {JSON_FILE} not found.")
        return

    # Update Collegian data
    if 'collegian' in data:
        data['collegian']['categories'] = categories
        data['collegian']['total_categories'] = len(categories)
        print(f"Updated Collegian with {len(categories)} categories.")
    else:
        print("Error: 'collegian' key not found in JSON.")
        return

    with open(JSON_FILE, 'w') as f:
        json.dump(data, f, indent=2)
    print("JSON file saved.")

if __name__ == "__main__":
    print("Parsing log file...")
    new_categories = parse_log_file(LOG_FILE)
    print(f"Found {len(new_categories)} categories.")
    
    print("Updating JSON...")
    update_json(new_categories)
