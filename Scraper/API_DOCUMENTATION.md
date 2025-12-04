# RMSMC Category Scraper API Documentation

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


### THE ROCKY MOUNTAIN COLLEGIAN
- Base URL: https://collegian.com
- Total Categories: 8
- Categories:
  - News (`articles/news`)
  - Life & Culture (`articles/landc`)
  - Sports (`articles/sports`)
  - Opinion (`articles/opinion`)
  - Science (`articles/science`)
  - Arts & Entertainment (`articles/aande`)
  - Cannabis (`articles/science/cannabis`)
  - Sponsored Content (`articles/sponsored`)

### COLLEGE AVE MAG
- Base URL: https://collegeavemag.com
- Total Categories: 4
- Categories:
  - Features (`features`)
  - Culture (`culture`)
  - Food & Drink (`food-drink`)
  - Outdoors (`outdoors`)

### KCSU FM
- Base URL: https://kcsufm.com
- Total Categories: 3
- Categories:
  - Podcast (`podcast`)
  - News (`news`)
  - Sports (`sports`)
