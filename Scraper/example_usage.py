#!/usr/bin/env python3
"""
Example Usage of RMSMC Category Scraper
Shows different ways to use the scraper toolkit
"""

from rmsmc_scraper_toolkit import RMSMCScraperToolkit
import json

def example_1_get_all_categories():
    """Example 1: Get all categories from all sites"""
    print("=" * 60)
    print("EXAMPLE 1: Get All Categories")
    print("=" * 60 + "\n")
    
    toolkit = RMSMCScraperToolkit()
    results = toolkit.get_cached_results()
    
    for site_key, site_data in results.items():
        print(f"\n{site_data['site']}:")
        for cat in site_data['categories']:
            print(f"  • {cat['name']}")


def example_2_find_specific_category():
    """Example 2: Find a specific category across sites"""
    print("\n" + "=" * 60)
    print("EXAMPLE 2: Find 'Sports' Category Across Sites")
    print("=" * 60 + "\n")
    
    toolkit = RMSMCScraperToolkit()
    results = toolkit.get_cached_results()
    
    search_term = "Sports"
    
    for site_key, site_data in results.items():
        for cat in site_data['categories']:
            if search_term.lower() in cat['name'].lower():
                print(f"{site_data['site']}:")
                print(f"  Name: {cat['name']}")
                print(f"  URL: {cat['url']}")
                print(f"  Slug: {cat['slug']}\n")


def example_3_count_categories():
    """Example 3: Count categories per site"""
    print("\n" + "=" * 60)
    print("EXAMPLE 3: Category Counts")
    print("=" * 60 + "\n")
    
    toolkit = RMSMCScraperToolkit()
    results = toolkit.get_cached_results()
    
    total = 0
    for site_key, site_data in results.items():
        count = site_data['total_categories']
        total += count
        print(f"{site_data['site']}: {count} categories")
    
    print(f"\nTotal across all sites: {total} categories")


def example_4_export_specific_site():
    """Example 4: Export data for a specific site"""
    print("\n" + "=" * 60)
    print("EXAMPLE 4: Export Collegian Categories")
    print("=" * 60 + "\n")
    
    toolkit = RMSMCScraperToolkit()
    results = toolkit.get_cached_results()
    
    # Get just Collegian data
    collegian_data = results['collegian']
    
    # Save to separate file
    output_file = '/mnt/user-data/outputs/collegian_only.json'
    with open(output_file, 'w') as f:
        json.dump(collegian_data, f, indent=2)
    
    print(f"Exported {collegian_data['total_categories']} Collegian categories to:")
    print(f"  {output_file}")


def example_5_generate_url_list():
    """Example 5: Generate a list of all category URLs"""
    print("\n" + "=" * 60)
    print("EXAMPLE 5: All Category URLs")
    print("=" * 60 + "\n")
    
    toolkit = RMSMCScraperToolkit()
    results = toolkit.get_cached_results()
    
    all_urls = []
    
    for site_key, site_data in results.items():
        for cat in site_data['categories']:
            all_urls.append(cat['url'])
    
    # Save to text file
    output_file = '/mnt/user-data/outputs/category_urls.txt'
    with open(output_file, 'w') as f:
        for url in all_urls:
            f.write(url + '\n')
    
    print(f"Saved {len(all_urls)} category URLs to:")
    print(f"  {output_file}")
    
    print("\nFirst 5 URLs:")
    for url in all_urls[:5]:
        print(f"  {url}")


def example_6_custom_format():
    """Example 6: Create custom formatted output"""
    print("\n" + "=" * 60)
    print("EXAMPLE 6: Custom HTML Table Output")
    print("=" * 60 + "\n")
    
    toolkit = RMSMCScraperToolkit()
    results = toolkit.get_cached_results()
    
    html = """<!DOCTYPE html>
<html>
<head>
    <title>RMSMC Categories</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #1E4D2B; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        h1 { color: #1E4D2B; }
    </style>
</head>
<body>
    <h1>RMSMC Content Categories</h1>
"""
    
    for site_key, site_data in results.items():
        html += f"""
    <h2>{site_data['site']}</h2>
    <p><strong>URL:</strong> <a href="{site_data['url']}">{site_data['url']}</a></p>
    <p><strong>Total Categories:</strong> {site_data['total_categories']}</p>
    
    <table>
        <tr>
            <th>#</th>
            <th>Category</th>
            <th>URL</th>
            <th>Slug</th>
        </tr>
"""
        
        for i, cat in enumerate(site_data['categories'], 1):
            html += f"""
        <tr>
            <td>{i}</td>
            <td>{cat['name']}</td>
            <td><a href="{cat['url']}">{cat['url']}</a></td>
            <td><code>{cat['slug']}</code></td>
        </tr>
"""
        
        html += """
    </table>
    <br>
"""
    
    html += """
</body>
</html>
"""
    
    output_file = '/mnt/user-data/outputs/categories_table.html'
    with open(output_file, 'w') as f:
        f.write(html)
    
    print(f"Generated HTML table:")
    print(f"  {output_file}")


def main():
    """Run all examples"""
    example_1_get_all_categories()
    example_2_find_specific_category()
    example_3_count_categories()
    example_4_export_specific_site()
    example_5_generate_url_list()
    example_6_custom_format()
    
    print("\n" + "=" * 60)
    print("✅ All examples completed!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
