# CLU AOI Query Example - Quick Start

## Overview

The `google-maps-aoi-example.html` file demonstrates how to use the LandMapMagic CLU AOI (Area of Interest) Query API with Google Maps.

## What This Example Does

1. **Displays CLU Field Boundaries**: Shows USDA Common Land Unit field boundaries on Google Maps
2. **Interactive Drawing**: Lets users draw custom polygon AOIs on the map
3. **API Query**: Queries the `/aoi/query` endpoint to find CLU fields within the AOI
4. **Results Display**: Shows matching fields with statistics and visual highlighting

## Prerequisites

You need two API keys:

1. **Google Maps API Key**
   - Get one at: https://console.cloud.google.com/google/maps-apis
   - Enable: Maps JavaScript API, Drawing Library

2. **LandMapMagic API Key**
   - Get one at: https://landmapmagic.com/signup
   - Or use `dev` for local development

## Setup Instructions

### Step 1: Create Environment File

In the **root of the landmap directory** (not in examples/), create a `.env.local` file:

```bash
cd /Users/carllippert/external/steve/landmap
nano .env.local
```

Add your API keys:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
VITE_LAND_MAP_MAGIC_API_KEY=your_landmap_key_here
```

Save and exit (Ctrl+X, Y, Enter in nano).

### Step 2: Install Dependencies

```bash
cd examples
npm install
```

### Step 3: Start Development Server

```bash
npm run dev
```

This will:
1. Build the parent package
2. Start Vite dev server on port 3000
3. Automatically open your browser

### Step 4: Open the Example

Navigate to:
```
http://localhost:3000/google-maps-aoi-example.html
```

Or click the link in your terminal output.

## Using the Example

### Basic Usage

1. **View CLU Fields**: The map loads centered on Iowa with CLU field boundaries visible
2. **Start Drawing**: Click the "📐 Start Drawing AOI" button
3. **Draw Polygon**: Click on the map to create polygon vertices
4. **Complete Polygon**: Click near your starting point to close the polygon
5. **Query**: Click "🔍 Query CLU Fields" to search for fields within your AOI
6. **View Results**: See statistics and highlighted fields in the control panel

### Features

**Toggle Layers:**
- ☑️ Show CLU Field Boundaries
- ☑️ Show Acreage Labels

**Actions:**
- 📐 Start Drawing AOI
- 🗑️ Clear AOI (remove drawn polygon)
- 🔍 Query CLU Fields (search within AOI)

**Results Shown:**
- Total AOI area (acres)
- Number of CLU fields found
- Processing time (milliseconds)
- Per-field details (acreage, coverage percentages)
- Visual highlighting on map

### Example Locations to Try

Good locations with CLU data:

**Iowa (Default)**
- Lat: 41.878, Lng: -93.097
- Zoom: 13

**Illinois**
- Lat: 40.110, Lng: -88.207
- Zoom: 13

**Nebraska**
- Lat: 41.257, Lng: -96.010
- Zoom: 13

## API Details

### Endpoint Used

```
POST https://staging-api.landmapmagic.com/aoi/query?key=YOUR_KEY
```

### Request Format

```json
{
  "aoi": {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [-93.1, 41.88],
        [-93.09, 41.88],
        [-93.09, 41.87],
        [-93.1, 41.87],
        [-93.1, 41.88]
      ]]
    },
    "properties": {}
  },
  "layers": ["clu"],
  "options": {
    "includeGeometry": true,
    "precision": 2
  }
}
```

### Response Format

```json
{
  "aoi_area": {
    "acres": 45.23,
    "hectares": 18.31,
    ...
  },
  "total_features_found": 3,
  "results_by_layer": {
    "clu": {
      "features_count": 3,
      "features": [
        {
          "feature_id": "19153001234567",
          "intersection_area": { "acres": 15.45, ... },
          "percentages": {
            "percent_of_feature_in_aoi": 77.25,
            "percent_of_aoi_in_feature": 34.15
          },
          "properties": { ... },
          "geometry": { ... }
        }
      ]
    }
  },
  "query_info": {
    "processing_time_ms": 245,
    ...
  }
}
```

## Code Structure

### Key Functions

**`initMap()`**
- Initializes Google Maps
- Sets up deck.gl overlay
- Loads CLU layers

**`startDrawing()`**
- Activates Google Maps Drawing Manager
- Lets user draw polygon AOI

**`queryAOI()`**
- Converts drawn polygon to GeoJSON
- Sends POST request to `/aoi/query`
- Displays results

**`displayResults()`**
- Parses API response
- Shows statistics in control panel

**`highlightResults()`**
- Creates deck.gl PolygonLayer
- Highlights matching CLU fields on map

**`updateLayers()`**
- Updates deck.gl layer stack
- Handles layer visibility toggles

## Troubleshooting

### Problem: "Missing VITE_GOOGLE_MAPS_API_KEY"

**Solution**: 
1. Make sure `.env.local` is in the **landmap root directory** (not in examples/)
2. File must be named exactly `.env.local` (note the leading dot)
3. Restart the dev server after creating the file

### Problem: "Failed to load map"

**Solution**:
- Check that your Google Maps API key is valid
- Verify Maps JavaScript API is enabled in Google Cloud Console
- Check browser console for specific error messages

### Problem: "Query Failed: HTTP 401"

**Solution**:
- Check that your LandMapMagic API key is valid
- Verify the API key has access to CLU data
- Check that the key is properly set in `.env.local`

### Problem: "AOI area exceeds maximum allowed"

**Solution**:
- Draw a smaller polygon (< 1000 acres for CLU)
- 1000 acres ≈ 1.5 square miles
- Try zooming in and drawing a more localized AOI

### Problem: No CLU fields found

**Solution**:
- Make sure you're drawing in an area with agricultural land
- CLU data is available for most US agricultural areas
- Try the default Iowa location: 41.878, -93.097
- Ensure zoom level is 13+ so CLU tiles load

### Problem: Tiles not loading

**Solution**:
- Check internet connection
- Verify API key is correct
- CLU tiles available at zoom 11-15 only
- Check browser console for 404 or 403 errors

## Performance Notes

### Expected Query Times

| AOI Size | Typical Response |
|----------|-----------------|
| < 100 acres | 100-300ms |
| 100-500 acres | 300-600ms |
| 500-1000 acres | 600-1200ms |

### Optimization Tips

1. **Smaller AOIs**: Keep AOIs under 500 acres for best performance
2. **Exclude Geometry**: Set `includeGeometry: false` to reduce response size
3. **Cache Results**: Store results locally to avoid repeat queries
4. **Zoom In**: Start at zoom 14+ so CLU tiles are already loaded

## Related Examples

### Other Google Maps Examples

**`google-maps-example.html`**
- Basic CLU display
- Shows field boundaries and labels
- Click fields for acreage

**`google-maps-selectable.html`**
- Interactive field selection
- Multi-select CLU fields
- Visual selection feedback

### MapLibre Examples

The main React examples use MapLibre:
```bash
npm run dev
# Opens: http://localhost:3000/
```

## Documentation

**Full API Documentation**: `/landapi/worker/CLU_AOI_API.md`

**Implementation Details**: `/landapi/CLU_AOI_IMPLEMENTATION_SUMMARY.md`

**Google Maps Quick Start**: `GOOGLE_MAPS_QUICK_START.md`

## Source Code

The example is a single HTML file with inline JavaScript:

- **Location**: `landmap/examples/google-maps-aoi-example.html`
- **Size**: ~500 lines
- **Dependencies**: deck.gl (loaded via CDN)
- **Framework**: Vanilla JavaScript (no build step needed for production)

## Customization

### Change AOI Query Options

```javascript
// In queryAOI() function, modify the fetch body:
body: JSON.stringify({
  aoi: aoiGeoJSON,
  layers: ['clu'],
  options: {
    includeGeometry: false,  // Exclude geometries for faster response
    precision: 1             // Less precision = smaller payload
  }
})
```

### Change Highlight Color

```javascript
// In highlightResults() function:
highlightLayer = new PolygonLayer({
  id: 'clu-highlight',
  data: polygons,
  getPolygon: d => d,
  getFillColor: [255, 0, 0, 100],    // Red instead of green
  getLineColor: [200, 0, 0, 255],
  // ...
});
```

### Change CLU Border Color

```javascript
// In updateLayers() function:
new MVTLayer({
  id: 'clu-polygons',
  // ...
  getLineColor: [255, 0, 0, 230],  // Red instead of yellow
  getLineWidth: 3,                  // Thicker lines
  // ...
})
```

### Add More Layers to Query

```javascript
// Query multiple layers at once:
body: JSON.stringify({
  aoi: aoiGeoJSON,
  layers: ['clu', 'sections', 'townships'],  // Multiple layers
  options: { includeGeometry: true }
})
```

## Support

**Questions?**
- Check the API docs: `/landapi/worker/CLU_AOI_API.md`
- Review implementation summary: `/landapi/CLU_AOI_IMPLEMENTATION_SUMMARY.md`
- Email: support@landmapmagic.com

**Found a bug?**
- Check browser console for errors
- Verify API keys are correct
- Test the same AOI with cURL to isolate frontend vs backend issues

---

**Last Updated**: November 4, 2025  
**Example Version**: 1.0.0  
**Compatible API Version**: >= 1.0.0

