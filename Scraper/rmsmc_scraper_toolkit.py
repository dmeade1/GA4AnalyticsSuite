#!/usr/bin/env python3
"""
RMSMC Category Scraper Toolkit
A comprehensive toolkit for scraping and analyzing content categories from RMSMC websites

Usage:
    python3 rmsmc_scraper_toolkit.py --mode [live|cached|manual]
    
Modes:
    live    - Fetch data directly from websites (requires network access)
    cached  - Use pre-analyzed category data
    manual  - Analyze HTML files from a directory
"""

import argparse
import json
import csv
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import sys

try:
    import requests
    from bs4 import BeautifulSoup
    LIVE_MODE_AVAILABLE = True
except ImportError:
    LIVE_MODE_AVAILABLE = False
    print("⚠️  requests/beautifulsoup4 not available - live mode disabled")


class RMSMCScraperToolkit:
    """Main scraper toolkit class"""
    
    SITES = {
        'collegian': {
            'name': 'The Rocky Mountain Collegian',
            'url': 'https://collegian.com',
            'patterns': ['/category/articles/']
        },
        'collegeavemag': {
            'name': 'College Ave Mag',
            'url': 'https://collegeavemag.com',
            'patterns': ['/category/']
        },
        'kcsu': {
            'name': 'KCSU FM',
            'url': 'https://kcsufm.com',
            'patterns': ['/category/']
        }
    }
    
    CACHED_DATA = {
        'collegian': {
            'categories': [
                {'name': 'News', 'slug': 'articles/news'},
                {'name': 'Life & Culture', 'slug': 'articles/landc'},
                {'name': 'Sports', 'slug': 'articles/sports'},
                {'name': 'Opinion', 'slug': 'articles/opinion'},
                {'name': 'Science', 'slug': 'articles/science'},
                {'name': 'Arts & Entertainment', 'slug': 'articles/aande'},
                {'name': 'Cannabis', 'slug': 'articles/science/cannabis'},
                {'name': 'Sponsored Content', 'slug': 'articles/sponsored'}
            ]
        },
        'collegeavemag': {
            'categories': [
                {'name': 'Features', 'slug': 'features'},
                {'name': 'Culture', 'slug': 'culture'},
                {'name': 'Food & Drink', 'slug': 'food-drink'},
                {'name': 'Outdoors', 'slug': 'outdoors'}
            ]
        },
        'kcsu': {
            'categories': [
                {'name': 'Podcast', 'slug': 'podcast'},
                {'name': 'News', 'slug': 'news'},
                {'name': 'Sports', 'slug': 'sports'}
            ]
        }
    }
    
    def __init__(self, output_dir: str = '/mnt/user-data/outputs'):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.results = {}
    
    def get_cached_results(self) -> Dict:
        """Return pre-analyzed category data"""
        results = {}
        
        for site_key, site_info in self.SITES.items():
            cached = self.CACHED_DATA.get(site_key, {})
            categories = cached.get('categories', [])
            
            # Add full URLs to cached data
            full_categories = []
            for cat in categories:
                full_categories.append({
                    'name': cat['name'],
                    'slug': cat['slug'],
                    'url': f"{site_info['url']}/category/{cat['slug']}/"
                })
            
            results[site_key] = {
                'site': site_info['name'],
                'url': site_info['url'],
                'total_categories': len(full_categories),
                'categories': full_categories
            }
        
        return results
    
    def scrape_live(self, timeout: int = 10) -> Dict:
        """Scrape categories live from websites"""
        if not LIVE_MODE_AVAILABLE:
            print("❌ Live mode not available - missing dependencies")
            return {}
        
        results = {}
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        for site_key, site_info in self.SITES.items():
            print(f"\n🔍 Scraping {site_info['name']}...")
            
            try:
                response = requests.get(site_info['url'], headers=headers, timeout=timeout)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                categories = self._extract_categories(soup, site_info)
                
                results[site_key] = {
                    'site': site_info['name'],
                    'url': site_info['url'],
                    'total_categories': len(categories),
                    'categories': categories,
                    'scraped_at': datetime.now().isoformat()
                }
                
                print(f"  ✅ Found {len(categories)} categories")
                
            except Exception as e:
                print(f"  ❌ Error: {e}")
                results[site_key] = {
                    'site': site_info['name'],
                    'url': site_info['url'],
                    'error': str(e)
                }
        
        return results
    
    def _extract_categories(self, soup: BeautifulSoup, site_info: Dict) -> List[Dict]:
        """Extract categories from parsed HTML"""
        import re
        
        categories = {}
        patterns = site_info['patterns']
        
        # Find all links matching category patterns
        for pattern in patterns:
            links = soup.find_all('a', href=re.compile(pattern))
            
            for link in links:
                href = link.get('href', '')
                text = link.get_text(strip=True)
                
                # Extract slug from URL
                match = re.search(r'/category/(.+?)(?:/|$)', href)
                if match:
                    slug = match.group(1)
                    
                    # Use slug as key to avoid duplicates
                    if slug not in categories:
                        full_url = href if href.startswith('http') else site_info['url'] + href
                        
                        categories[slug] = {
                            'name': text or slug.replace('-', ' ').title(),
                            'slug': slug,
                            'url': full_url
                        }
        
        return sorted(categories.values(), key=lambda x: x['slug'])
    
    def analyze_manual_html(self, html_dir: str) -> Dict:
        """Analyze HTML files from a directory"""
        html_path = Path(html_dir)
        
        if not html_path.exists():
            print(f"❌ Directory not found: {html_dir}")
            return {}
        
        results = {}
        
        for site_key, site_info in self.SITES.items():
            html_file = html_path / f"{site_key}.html"
            
            if not html_file.exists():
                print(f"⚠️  No HTML file found for {site_key}")
                continue
            
            print(f"📄 Analyzing {html_file.name}...")
            
            try:
                with open(html_file, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                soup = BeautifulSoup(html_content, 'html.parser')
                categories = self._extract_categories(soup, site_info)
                
                results[site_key] = {
                    'site': site_info['name'],
                    'url': site_info['url'],
                    'total_categories': len(categories),
                    'categories': categories
                }
                
                print(f"  ✅ Found {len(categories)} categories")
                
            except Exception as e:
                print(f"  ❌ Error: {e}")
        
        return results
    
    def save_json(self, data: Dict, filename: str = 'rmsmc_categories.json') -> Path:
        """Save results as JSON"""
        output_path = self.output_dir / filename
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        return output_path
    
    def save_csv(self, data: Dict, filename: str = 'rmsmc_categories.csv') -> Path:
        """Save results as CSV"""
        output_path = self.output_dir / filename
        
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Site', 'Category Name', 'Category URL', 'Slug', 'Total Site Categories'])
            
            for site_key, site_data in data.items():
                if 'error' in site_data:
                    continue
                
                for cat in site_data.get('categories', []):
                    writer.writerow([
                        site_data['site'],
                        cat['name'],
                        cat['url'],
                        cat['slug'],
                        site_data['total_categories']
                    ])
        
        return output_path
    
    def save_markdown(self, data: Dict, filename: str = 'CATEGORY_REPORT.md') -> Path:
        """Save results as formatted Markdown"""
        output_path = self.output_dir / filename
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("# RMSMC Content Categories Report\n\n")
            f.write(f"**Generated:** {datetime.now().strftime('%B %d, %Y at %I:%M %p')}\n\n")
            
            total_categories = sum(
                site_data['total_categories'] 
                for site_data in data.values() 
                if 'total_categories' in site_data
            )
            
            f.write(f"**Total Categories Across All Sites:** {total_categories}\n\n")
            f.write("---\n\n")
            
            for site_key, site_data in data.items():
                if 'error' in site_data:
                    f.write(f"## ❌ {site_data['site']}\n\n")
                    f.write(f"Error: {site_data['error']}\n\n")
                    continue
                
                f.write(f"## {site_data['site']}\n\n")
                f.write(f"**URL:** {site_data['url']}\n\n")
                f.write(f"**Total Categories:** {site_data['total_categories']}\n\n")
                
                f.write("| # | Category | URL | Slug |\n")
                f.write("|---|----------|-----|------|\n")
                
                for i, cat in enumerate(site_data['categories'], 1):
                    f.write(f"| {i} | {cat['name']} | {cat['url']} | `{cat['slug']}` |\n")
                
                f.write("\n")
        
        return output_path
    
    def print_summary(self, data: Dict):
        """Print formatted summary to console"""
        print("\n" + "="*60)
        print("📊 RMSMC CONTENT CATEGORY SUMMARY")
        print("="*60 + "\n")
        
        total_categories = 0
        
        for site_key, site_data in data.items():
            if 'error' in site_data:
                print(f"❌ {site_data['site']}")
                print(f"   Error: {site_data['error']}\n")
                continue
            
            print(f"✨ {site_data['site'].upper()}")
            print(f"   URL: {site_data['url']}")
            print(f"   Total Categories: {site_data['total_categories']}\n")
            print("   Categories:")
            
            for i, cat in enumerate(site_data['categories'], 1):
                print(f"   {i:2d}. {cat['name']:<30} ({cat['slug']})")
            
            print()
            total_categories += site_data['total_categories']
        
        print("="*60)
        print(f"📈 TOTAL CATEGORIES: {total_categories}")
        print("="*60 + "\n")


def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(
        description='RMSMC Content Category Scraper Toolkit',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        '--mode',
        choices=['live', 'cached', 'manual'],
        default='cached',
        help='Scraping mode: live (fetch from web), cached (use pre-analyzed data), manual (analyze local HTML files)'
    )
    
    parser.add_argument(
        '--html-dir',
        default='./html_files',
        help='Directory containing HTML files for manual mode'
    )
    
    parser.add_argument(
        '--output-dir',
        default='/mnt/user-data/outputs',
        help='Directory for output files'
    )
    
    parser.add_argument(
        '--format',
        choices=['json', 'csv', 'markdown', 'all'],
        default='all',
        help='Output format'
    )
    
    args = parser.parse_args()
    
    # Initialize toolkit
    toolkit = RMSMCScraperToolkit(output_dir=args.output_dir)
    
    # Get data based on mode
    print(f"🚀 Running in {args.mode.upper()} mode...\n")
    
    if args.mode == 'live':
        if not LIVE_MODE_AVAILABLE:
            print("❌ Live mode requires 'requests' and 'beautifulsoup4' packages")
            print("   Install with: pip install requests beautifulsoup4")
            sys.exit(1)
        results = toolkit.scrape_live()
    elif args.mode == 'cached':
        results = toolkit.get_cached_results()
    else:  # manual
        results = toolkit.analyze_manual_html(args.html_dir)
    
    if not results:
        print("❌ No results to save")
        sys.exit(1)
    
    # Print summary
    toolkit.print_summary(results)
    
    # Save in requested formats
    saved_files = []
    
    if args.format in ['json', 'all']:
        json_path = toolkit.save_json(results)
        saved_files.append(('JSON', json_path))
    
    if args.format in ['csv', 'all']:
        csv_path = toolkit.save_csv(results)
        saved_files.append(('CSV', csv_path))
    
    if args.format in ['markdown', 'all']:
        md_path = toolkit.save_markdown(results)
        saved_files.append(('Markdown', md_path))
    
    # Print saved files
    print("💾 Saved files:")
    for format_name, file_path in saved_files:
        print(f"   {format_name}: {file_path}")
    
    print("\n✅ Complete!")


if __name__ == '__main__':
    main()
