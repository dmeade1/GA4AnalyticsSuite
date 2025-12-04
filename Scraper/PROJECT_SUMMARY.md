# RMSMC Content Category Scraper/API Kit - Project Summary

## 📦 Deliverables

A complete scraper/API toolkit for extracting and managing content categories from RMSMC websites.

### What Was Created

✅ **3 Python Scraper Tools**
- `rmsmc_scraper_toolkit.py` - Full-featured scraper with multiple modes
- `rmsmc_category_parser.py` - Lightweight parser for quick analysis
- `rmsmc_category_scraper.py` - Original network-based scraper

✅ **Data Output Files**
- JSON format (structured API data)
- CSV format (spreadsheet-compatible)
- Markdown reports (human-readable)
- HTML tables (web-viewable)

✅ **Complete Documentation**
- README with usage instructions
- API documentation
- Quick reference guide
- Example usage scripts

---

## 🎯 Category Data Extracted

### Summary Statistics
- **Total Sites**: 3
- **Total Categories**: 15
- **Last Updated**: December 4, 2025

### By Site

#### The Rocky Mountain Collegian (8 categories)
1. News
2. Life & Culture
3. Sports
4. Opinion
5. Science
6. Arts & Entertainment
7. Cannabis
8. Sponsored Content

#### College Ave Mag (4 categories)
1. Features
2. Culture
3. Food & Drink
4. Outdoors

#### KCSU FM (3 categories)
1. Podcast
2. News
3. Sports

---

## 🚀 Quick Start Guide

### Option 1: Use Cached Data (Fastest)
```bash
python3 rmsmc_scraper_toolkit.py --mode cached
```

### Option 2: Live Scraping
```bash
pip install requests beautifulsoup4 --break-system-packages
python3 rmsmc_scraper_toolkit.py --mode live
```

### Option 3: Python Module
```python
from rmsmc_scraper_toolkit import RMSMCScraperToolkit

toolkit = RMSMCScraperToolkit()
results = toolkit.get_cached_results()

# Access data
for site, data in results.items():
    print(f"{data['site']}: {data['total_categories']} categories")
```

---

## 📂 File Organization

### Core Tools (Use These)
```
rmsmc_scraper_toolkit.py    ← Main tool (recommended)
rmsmc_category_parser.py    ← Lightweight alternative
example_usage.py            ← See examples here
```

### Data Files
```
rmsmc_categories.json       ← For APIs/programming
rmsmc_categories.csv        ← For Excel/Sheets
category_urls.txt           ← Simple URL list
categories_table.html       ← View in browser
```

### Documentation
```
README.md                   ← Start here
API_DOCUMENTATION.md        ← API reference
QUICK_REFERENCE.md          ← Quick lookup
CATEGORY_REPORT.md          ← Human-readable report
```

---

## 💡 Common Use Cases

### 1. Get All Category URLs
```bash
cat category_urls.txt
```

### 2. Find Categories in Excel
Open `rmsmc_categories.csv` in Excel or Google Sheets

### 3. Use as API Data Source
```python
import json
with open('rmsmc_categories.json') as f:
    data = json.load(f)
```

### 4. View in Browser
Open `categories_table.html` in any web browser

### 5. Search for Specific Category
```bash
grep "Sports" rmsmc_categories.csv
```

---

## 🔄 Updating the Data

### When Categories Change

**Method 1: Live Scrape** (requires network)
```bash
python3 rmsmc_scraper_toolkit.py --mode live
```

**Method 2: Manual Update** (edit cached data)
1. Open `rmsmc_scraper_toolkit.py`
2. Update the `CACHED_DATA` dictionary
3. Run in cached mode

**Method 3: Analyze HTML** (save HTML files first)
```bash
python3 rmsmc_scraper_toolkit.py --mode manual --html-dir ./html_files
```

---

## 🛠️ Technical Details

### Supported Output Formats
- JSON (structured data)
- CSV (spreadsheet)
- Markdown (documentation)
- HTML (web tables)
- Plain text (URL lists)

### Operation Modes
1. **Cached** - Uses pre-analyzed data, no network needed
2. **Live** - Fetches fresh data from websites
3. **Manual** - Analyzes saved HTML files

### Python Dependencies
- `requests` - For live scraping (optional)
- `beautifulsoup4` - For HTML parsing (optional)
- Standard library only for cached mode

---

## 📊 Data Structure

Each category includes:
- **name** - Display name (e.g., "Life & Culture")
- **slug** - URL identifier (e.g., "articles/landc")
- **url** - Full URL to category page

Example:
```json
{
  "name": "Sports",
  "slug": "articles/sports",
  "url": "https://collegian.com/category/articles/sports/"
}
```

---

## ✨ Key Features

✅ Multiple operation modes (live, cached, manual)
✅ Flexible output formats (JSON, CSV, MD, HTML)
✅ Command-line interface
✅ Python module for integration
✅ Complete documentation
✅ Example usage scripts
✅ No dependencies for cached mode
✅ Easy to update and maintain

---

## 📝 Next Steps

1. **Try the examples**: Run `example_usage.py` to see various use cases
2. **Read the docs**: Check `README.md` for detailed instructions
3. **Explore the data**: Open files in your preferred format
4. **Integrate**: Use as a Python module in your projects
5. **Update regularly**: Re-scrape when categories change

---

## 🤝 Maintenance

### Regular Tasks
- Run scraper monthly to catch new categories
- Update cached data when sites reorganize
- Regenerate output files after updates

### When to Re-scrape
- New categories are added
- Category names change
- URLs are restructured
- Quarterly data review

---

## 📞 Support

For questions or issues:
1. Check `README.md` for usage instructions
2. Review `example_usage.py` for code examples
3. See `API_DOCUMENTATION.md` for API details
4. Refer to `QUICK_REFERENCE.md` for quick lookups

---

## 📈 Project Stats

- **Lines of Code**: ~800
- **Files Created**: 14
- **Output Formats**: 5
- **Operation Modes**: 3
- **Total Categories Tracked**: 15
- **Sites Covered**: 3

---

**Created for Rocky Mountain Student Media Corporation**
**Last Updated: December 4, 2025**
