# RMSMC Content Category Scraper/API Kit

A comprehensive toolkit for extracting and analyzing content categories from Rocky Mountain Student Media Corporation (RMSMC) websites.

## 🎯 Overview

This scraper/API kit extracts content category information from:
- **The Rocky Mountain Collegian** (collegian.com) - 8 categories
- **College Ave Mag** (collegeavemag.com) - 4 categories  
- **KCSU FM** (kcsufm.com) - 3 categories

**Total Categories Tracked:** 15

## 📦 What's Included

### Core Files

1. **rmsmc_scraper_toolkit.py** - Main comprehensive scraper
   - Multiple operation modes (live, cached, manual)
   - Command-line interface
   - Flexible output formats

2. **rmsmc_category_parser.py** - Lightweight parser
   - Quick category analysis
   - Pre-populated with current data

### Output Files

- **rmsmc_categories.json** - Structured JSON data
- **rmsmc_categories.csv** - Spreadsheet-friendly format
- **CATEGORY_REPORT.md** - Human-readable report
- **API_DOCUMENTATION.md** - API usage guide
- **QUICK_REFERENCE.md** - Quick lookup table

## 🚀 Quick Start

### Basic Usage (Cached Mode)

```bash
python3 rmsmc_scraper_toolkit.py --mode cached
```

This uses pre-analyzed data and doesn't require network access.

### Live Scraping

```bash
# Install dependencies first
pip install requests beautifulsoup4 --break-system-packages

# Run live scraper
python3 rmsmc_scraper_toolkit.py --mode live
```

### Manual HTML Analysis

```bash
# Save HTML files to a directory first
mkdir html_files
# ... save collegian.html, collegeavemag.html, kcsu.html ...

# Analyze local files
python3 rmsmc_scraper_toolkit.py --mode manual --html-dir ./html_files
```

## 📊 Current Category Data

### The Rocky Mountain Collegian (8 categories)

| Category | Slug | URL |
|----------|------|-----|
| News | articles/news | https://collegian.com/category/articles/news/ |
| Life & Culture | articles/landc | https://collegian.com/category/articles/landc/ |
| Sports | articles/sports | https://collegian.com/category/articles/sports/ |
| Opinion | articles/opinion | https://collegian.com/category/articles/opinion/ |
| Science | articles/science | https://collegian.com/category/articles/science/ |
| Arts & Entertainment | articles/aande | https://collegian.com/category/articles/aande/ |
| Cannabis | articles/science/cannabis | https://collegian.com/category/articles/science/cannabis/ |
| Sponsored Content | articles/sponsored | https://collegian.com/category/articles/sponsored/ |

### College Ave Mag (4 categories)

| Category | Slug | URL |
|----------|------|-----|
| Features | features | https://collegeavemag.com/category/features/ |
| Culture | culture | https://collegeavemag.com/category/culture/ |
| Food & Drink | food-drink | https://collegeavemag.com/category/food-drink/ |
| Outdoors | outdoors | https://collegeavemag.com/category/outdoors/ |

### KCSU FM (3 categories)

| Category | Slug | URL |
|----------|------|-----|
| Podcast | podcast | https://kcsufm.com/category/podcast/ |
| News | news | https://kcsufm.com/category/news/ |
| Sports | sports | https://kcsufm.com/category/sports/ |

## 🛠️ Advanced Usage

### Command-Line Options

```bash
python3 rmsmc_scraper_toolkit.py [OPTIONS]

Options:
  --mode {live,cached,manual}   Scraping mode (default: cached)
  --html-dir PATH               Directory with HTML files for manual mode
  --output-dir PATH             Output directory (default: /mnt/user-data/outputs)
  --format {json,csv,markdown,all}  Output format (default: all)
```

### Examples

```bash
# Get only JSON output
python3 rmsmc_scraper_toolkit.py --mode cached --format json

# Save to custom directory
python3 rmsmc_scraper_toolkit.py --output-dir ./my_outputs

# Live scrape with CSV output
python3 rmsmc_scraper_toolkit.py --mode live --format csv
```

## 🔌 API Integration

### Using as a Python Module

```python
from rmsmc_scraper_toolkit import RMSMCScraperToolkit

# Initialize
toolkit = RMSMCScraperToolkit(output_dir='./outputs')

# Get cached data
results = toolkit.get_cached_results()

# Access categories
for site_key, site_data in results.items():
    print(f"{site_data['site']}: {site_data['total_categories']} categories")
    for cat in site_data['categories']:
        print(f"  - {cat['name']} ({cat['url']})")

# Save in different formats
toolkit.save_json(results, 'categories.json')
toolkit.save_csv(results, 'categories.csv')
toolkit.save_markdown(results, 'report.md')
```

### Data Structure

```json
{
  "site_key": {
    "site": "Site Display Name",
    "url": "https://example.com",
    "total_categories": 5,
    "categories": [
      {
        "name": "Category Name",
        "slug": "category-slug",
        "url": "https://example.com/category/slug/"
      }
    ]
  }
}
```

## 📁 Output Formats

### JSON
Structured data perfect for APIs and programmatic access.

### CSV
Import into Excel, Google Sheets, or databases.

Columns: Site, Category Name, Category URL, Slug, Total Site Categories

### Markdown
Human-readable report with formatted tables.

## 🔄 Updating Category Data

When categories change on the websites:

1. **Live Mode**: Automatically fetches current categories
2. **Manual Mode**: Analyze updated HTML files
3. **Cached Mode**: Update the `CACHED_DATA` dict in the toolkit

## 📝 Notes

- **Cached mode** is fastest and requires no network access
- **Live mode** requires network access to RMSMC sites
- **Manual mode** useful for testing or when network is restricted
- All output files include timestamp information
- Category slugs are normalized (lowercase, hyphens)

## 🐛 Troubleshooting

### "Live mode not available"
Install dependencies: `pip install requests beautifulsoup4 --break-system-packages`

### Network errors
Use cached mode or manual mode with saved HTML files

### No categories found
Check that the website structure hasn't changed significantly

## 📊 Statistics

- **Total sites monitored**: 3
- **Total categories**: 15
- **Last updated**: December 4, 2025
- **Average categories per site**: 5

## 🤝 Contributing

To add support for additional RMSMC sites:

1. Add site info to `SITES` dict in toolkit
2. Add cached data to `CACHED_DATA` dict
3. Update this README with new category counts

## 📄 License

Created for RMSMC internal use.

## 👨‍💻 Author

Drew @ Rocky Mountain Student Media Corporation

---

**Generated by RMSMC Category Scraper Toolkit v1.0**
