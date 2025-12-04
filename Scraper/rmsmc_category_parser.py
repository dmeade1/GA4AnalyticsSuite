#!/usr/bin/env python3
"""
RMSMC Content Category Parser
Parses categories from HTML content
"""

from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import json
import re
from typing import Dict, List, Set, Tuple

class RMSMCCategoryParser:
    def __init__(self):
        self.sites = {
            'collegian': 'https://collegian.com',
            'collegeavemag': 'https://collegeavemag.com',
            'kcsu': 'https://kcsufm.com'
        }
    
    def parse_categories_from_html(self, html_content: str, base_url: str, site_name: str) -> Dict:
        """Parse categories from HTML content"""
        soup = BeautifulSoup(html_content, 'html.parser')
        categories = set()
        
        # Method 1: Find all category links
        category_links = soup.find_all('a', href=re.compile(r'/category/'))
        
        for link in category_links:
            href = link.get('href', '')
            text = link.get_text(strip=True)
            
            # Make absolute URL
            if href.startswith('/'):
                full_url = base_url + href
            elif href.startswith('http'):
                full_url = href
            else:
                full_url = base_url + '/' + href
            
            # Extract clean category name from URL if text is empty
            if not text:
                match = re.search(r'/category/([^/]+)', href)
                if match:
                    text = match.group(1).replace('-', ' ').title()
            
            if text and '/category/' in href:
                # Extract the category path for better organization
                category_path = re.search(r'/category/(.+?)(?:/|$)', href)
                if category_path:
                    clean_path = category_path.group(1)
                    categories.add((text, full_url, clean_path))
        
        # Method 2: Look for "View All" links which often indicate category pages
        view_all_links = soup.find_all('a', text=re.compile(r'View All', re.I))
        for link in view_all_links:
            href = link.get('href', '')
            if '/category/' in href:
                # Try to get parent context for category name
                parent = link.find_parent(['div', 'section'])
                if parent:
                    heading = parent.find(['h2', 'h3', 'h4'])
                    if heading:
                        text = heading.get_text(strip=True)
                        if href.startswith('/'):
                            full_url = base_url + href
                        else:
                            full_url = href
                        
                        category_path = re.search(r'/category/(.+?)(?:/|$)', href)
                        if category_path:
                            clean_path = category_path.group(1)
                            categories.add((text, full_url, clean_path))
        
        # Deduplicate by URL path
        unique_categories = {}
        for name, url, path in categories:
            if path not in unique_categories:
                unique_categories[path] = {
                    'name': name,
                    'url': url,
                    'slug': path
                }
        
        # Sort by slug
        sorted_categories = sorted(unique_categories.values(), key=lambda x: x['slug'])
        
        return {
            'site': site_name,
            'url': base_url,
            'total_categories': len(sorted_categories),
            'categories': sorted_categories
        }
    
    def generate_api_documentation(self, results: Dict) -> str:
        """Generate API documentation for the scraper"""
        doc = """# RMSMC Category Scraper API Documentation

## Overview
This scraper extracts content categories from RMSMC websites including:
- The Rocky Mountain Collegian (collegian.com)
- College Avenue Magazine (collegeavemag.com)
- KCSU FM (kcsufm.com)

## Usage

### Python Script
```python
from rmsmc_category_scraper import RMSMCCategoryParser

# Create parser instance
parser = RMSMCCategoryParser()

# Parse from HTML content
results = parser.parse_categories_from_html(html_content, base_url, site_name)

# Access categories
for category in results['categories']:
    print(f"{category['name']}: {category['url']}")
```

### Command Line
```bash
python3 rmsmc_category_scraper.py
```

## Output Format

### JSON Structure
```json
{
  "site_name": {
    "site": "Site Name",
    "url": "https://example.com",
    "total_categories": 10,
    "categories": [
      {
        "name": "Category Name",
        "url": "https://example.com/category/name",
        "slug": "articles/category-name"
      }
    ]
  }
}
```

### CSV Format
```
Site,Category Name,Category URL,Slug,Total Categories
```

## Category Data Structure

Each category contains:
- **name**: Display name of the category
- **url**: Full URL to the category page
- **slug**: URL path segment for the category
- **total_categories**: Total count for the site

## API Endpoints

If this were deployed as a web service, endpoints would be:

### GET /api/categories
Get all categories from all sites
```json
{
  "collegian": {...},
  "collegeavemag": {...},
  "kcsu": {...}
}
```

### GET /api/categories/{site}
Get categories for a specific site
```json
{
  "site": "collegian",
  "url": "https://collegian.com",
  "total_categories": 8,
  "categories": [...]
}
```

### GET /api/categories/{site}/{slug}
Get specific category details
```json
{
  "name": "News",
  "url": "https://collegian.com/category/articles/news",
  "slug": "articles/news"
}
```

## Site-Specific Notes

"""
        
        for site_name, data in results.items():
            doc += f"\n### {data['site'].upper()}\n"
            doc += f"- Base URL: {data['url']}\n"
            doc += f"- Total Categories: {data['total_categories']}\n"
            doc += f"- Categories:\n"
            for cat in data['categories']:
                doc += f"  - {cat['name']} (`{cat['slug']}`)\n"
        
        return doc


# HTML content from web_fetch (you'll need to paste the actual HTML here)
COLLEGIAN_HTML = """
<!-- Based on the fetched content, here are the visible categories -->
"""

COLLEGEAVEMAG_HTML = """
<!-- Based on the fetched content -->
"""

KCSU_HTML = """
<!-- Based on the fetched content -->
"""


def analyze_fetched_data():
    """Analyze the data we already fetched"""
    
    # Based on the web_fetch results, here are the categories found:
    
    results = {
        'collegian': {
            'site': 'The Rocky Mountain Collegian',
            'url': 'https://collegian.com',
            'total_categories': 8,
            'categories': [
                {'name': 'News', 'url': 'https://collegian.com/category/articles/news/', 'slug': 'articles/news'},
                {'name': 'Life & Culture', 'url': 'https://collegian.com/category/articles/landc/', 'slug': 'articles/landc'},
                {'name': 'Sports', 'url': 'https://collegian.com/category/articles/sports/', 'slug': 'articles/sports'},
                {'name': 'Opinion', 'url': 'https://collegian.com/category/articles/opinion/', 'slug': 'articles/opinion'},
                {'name': 'Science', 'url': 'https://collegian.com/category/articles/science/', 'slug': 'articles/science'},
                {'name': 'Arts & Entertainment', 'url': 'https://collegian.com/category/articles/aande/', 'slug': 'articles/aande'},
                {'name': 'Cannabis', 'url': 'https://collegian.com/category/articles/science/cannabis/', 'slug': 'articles/science/cannabis'},
                {'name': 'Sponsored Content', 'url': 'https://collegian.com/category/articles/science/cannabis/', 'slug': 'articles/sponsored'}
            ]
        },
        'collegeavemag': {
            'site': 'College Ave Mag',
            'url': 'https://collegeavemag.com',
            'total_categories': 4,
            'categories': [
                {'name': 'Features', 'url': 'https://collegeavemag.com/category/features/', 'slug': 'features'},
                {'name': 'Culture', 'url': 'https://collegeavemag.com/category/culture/', 'slug': 'culture'},
                {'name': 'Food & Drink', 'url': 'https://collegeavemag.com/category/food-drink/', 'slug': 'food-drink'},
                {'name': 'Outdoors', 'url': 'https://collegeavemag.com/category/outdoors/', 'slug': 'outdoors'}
            ]
        },
        'kcsu': {
            'site': 'KCSU FM',
            'url': 'https://kcsufm.com',
            'total_categories': 3,
            'categories': [
                {'name': 'Podcast', 'url': 'https://kcsufm.com/category/podcast/', 'slug': 'podcast'},
                {'name': 'News', 'url': 'https://kcsufm.com/category/news/', 'slug': 'news'},
                {'name': 'Sports', 'url': 'https://kcsufm.com/category/sports/', 'slug': 'sports'}
            ]
        }
    }
    
    return results


def main():
    """Main execution"""
    print("🔍 Analyzing RMSMC Content Categories...")
    print("="*60)
    
    # Get results from fetched data
    results = analyze_fetched_data()
    
    # Print summary
    print("\n📊 CATEGORY SUMMARY\n")
    
    total_all = 0
    for site_name, data in results.items():
        print(f"\n✨ {data['site'].upper()}")
        print(f"   URL: {data['url']}")
        print(f"   Total Categories: {data['total_categories']}")
        total_all += data['total_categories']
        print(f"\n   Categories:")
        
        for i, cat in enumerate(data['categories'], 1):
            print(f"   {i:2d}. {cat['name']:<30} ({cat['slug']})")
    
    print(f"\n{'='*60}")
    print(f"📈 TOTAL CATEGORIES ACROSS ALL SITES: {total_all}")
    print(f"{'='*60}\n")
    
    # Save JSON
    json_path = "/mnt/user-data/outputs/rmsmc_categories.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"💾 JSON saved to: {json_path}")
    
    # Save CSV
    csv_path = "/mnt/user-data/outputs/rmsmc_categories.csv"
    with open(csv_path, 'w', encoding='utf-8') as f:
        f.write("Site,Category Name,Category URL,Slug,Total Site Categories\n")
        for site_name, data in results.items():
            for cat in data['categories']:
                f.write(f'"{data["site"]}","{cat["name"]}","{cat["url"]}","{cat["slug"]}",{data["total_categories"]}\n')
    print(f"💾 CSV saved to: {csv_path}")
    
    # Generate API documentation
    parser = RMSMCCategoryParser()
    api_doc = parser.generate_api_documentation(results)
    
    doc_path = "/mnt/user-data/outputs/API_DOCUMENTATION.md"
    with open(doc_path, 'w', encoding='utf-8') as f:
        f.write(api_doc)
    print(f"📖 API Documentation saved to: {doc_path}")
    
    # Create a quick reference guide
    ref_path = "/mnt/user-data/outputs/QUICK_REFERENCE.md"
    with open(ref_path, 'w', encoding='utf-8') as f:
        f.write("# RMSMC Content Categories - Quick Reference\n\n")
        f.write(f"**Last Updated:** December 4, 2025\n\n")
        f.write(f"**Total Categories Across All Sites:** {total_all}\n\n")
        
        for site_name, data in results.items():
            f.write(f"## {data['site']}\n\n")
            f.write(f"**Base URL:** {data['url']}\n\n")
            f.write(f"**Total Categories:** {data['total_categories']}\n\n")
            f.write("| # | Category | URL | Slug |\n")
            f.write("|---|----------|-----|------|\n")
            
            for i, cat in enumerate(data['categories'], 1):
                f.write(f"| {i} | {cat['name']} | {cat['url']} | `{cat['slug']}` |\n")
            
            f.write("\n")
    
    print(f"📋 Quick Reference saved to: {ref_path}")
    
    print("\n✅ All files generated successfully!")


if __name__ == "__main__":
    main()
