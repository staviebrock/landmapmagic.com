# LandMapMagic Vanilla JS - Deployment Guide

This document explains how to deploy the vanilla JavaScript version of LandMapMagic to Cloudflare R2 for use in non-React applications (Flask, Django, PHP, Rails, plain HTML, etc.).

## 🎯 What This Provides

The vanilla JS version enables easy integration of LandMapMagic into any web application without React dependencies:

- **Self-hosted CDN** on your existing Cloudflare R2 infrastructure
- **Framework agnostic** - works with Flask, Django, PHP, Rails, etc.
- **Simple script tag integration** - just like Google Maps or Mapbox
- **Full feature parity** with the React version
- **Optimized bundle** - includes all dependencies (951KB minified)

## 📁 File Structure

```
src/vanilla-js/
├── index.ts                 # Main vanilla JS implementation
├── README.md               # Complete documentation
└── examples/
    ├── basic.html          # Basic HTML example
    ├── data-attributes.html # Declarative usage example
    └── flask-example.py    # Flask integration example
```

## 🚀 Deployment Process

### 1. Build the Vanilla JS Bundle

```bash
# Build all versions (including vanilla JS)
npm run build

# Or build only vanilla JS
npm run build:vanilla
```

This creates:
- `dist/landmap-vanilla.js` (951KB minified)
- `dist/landmap-vanilla.js.map` (4.6MB source map)

### 2. Deploy to Cloudflare R2

#### Set Environment Variables

```bash
# Required
export R2_ACCESS_KEY_ID=your-r2-access-key-id
export R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
export R2_BUCKET=landmapmagic
export R2_ACCOUNT_ID=your-cloudflare-account-id
export R2_PUBLIC_BASEURL=https://static.landmapmagic.com

# Optional (auto-detected from account ID if not set)
export R2_ENDPOINT_URL=https://your-account-id.r2.cloudflarestorage.com
```

#### Deploy Script

```bash
# Deploy to R2
npm run deploy:vanilla

# Or run the script directly
./scripts/deploy-vanilla.sh
```

This uploads:
- `landmap-vanilla-{version}.js` (versioned, long cache)
- `landmap-vanilla-latest.js` (latest, short cache)
- `landmap-vanilla-{version}.min.js` (production, no source map)
- `landmap-vanilla-latest.min.js` (latest production)
- `landmap-vanilla-{version}.js.map` (source map)

### 3. GitHub Actions (Automated)

The included workflow (`.github/workflows/deploy-vanilla.yml`) automatically deploys on:
- Git tags (`v*`)
- Manual workflow dispatch

Required secrets:
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_ACCOUNT_ID`
- `R2_PUBLIC_BASEURL`
- `REACT_APP_MAP_STYLE_URL`

## 📖 Usage Examples

### Basic HTML

```html
<!DOCTYPE html>
<html>
<head>
    <link href='https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css' rel='stylesheet' />
</head>
<body>
    <div id="map" style="width: 100%; height: 500px;"></div>
    
    <script src="https://static.landmapmagic.com/js/landmap-vanilla-latest.min.js"></script>
    <script>
        LandMapMagic.createMap('map', {
            apiKey: 'your-api-key',
            initialCenter: [-93.5, 42.0],
            initialVisibleLayers: ['ssurgo']
        });
    </script>
</body>
</html>
```

### Flask Integration

```python
from flask import Flask, render_template_string
import os

app = Flask(__name__)

@app.route('/farm/<farm_id>')
def farm_view(farm_id):
    template = '''
    <div id="map" style="width: 100%; height: 500px;"></div>
    <script src="https://static.landmapmagic.com/js/landmap-vanilla-latest.min.js"></script>
    <script>
        LandMapMagic.createMap('map', {
            apiKey: '{{ api_key }}',
            initialCenter: {{ farm_center | tojson }},
            initialVisibleLayers: ['ssurgo', 'cdl']
        });
    </script>
    '''
    
    return render_template_string(template, 
                                api_key=os.environ['LANDMAP_API_KEY'],
                                farm_center=[-93.5, 42.0])
```

### Data Attributes (Declarative)

```html
<div id="farm-map" 
     data-landmap-api-key="your-api-key"
     data-landmap-center="-93.5,42.0"
     data-landmap-visible="ssurgo"
     style="width: 100%; height: 500px;">
</div>

<script src="https://static.landmapmagic.com/js/landmap-vanilla-latest.min.js"></script>
<script>
    LandMapMagic.autoInit();
</script>
```

## 🌐 CDN URLs

### Production (Recommended)
```
https://static.landmapmagic.com/js/landmap-vanilla-latest.min.js     (Latest, minified)
https://static.landmapmagic.com/js/landmap-vanilla-v0.1.0.min.js     (Versioned, minified)
```

### Development
```
https://static.landmapmagic.com/js/landmap-vanilla-latest.js          (Latest, with source map)
https://static.landmapmagic.com/js/landmap-vanilla-v0.1.0.js         (Versioned, with source map)
```

## 🔧 API Reference

### `LandMapMagic.createMap(containerId, options)`

**Parameters:**
- `containerId` (string): HTML element ID
- `options` (object): Configuration options

**Options:**
- `apiKey` (string): Your LandMapMagic API key
- `initialCenter` (array): `[lng, lat]` coordinates
- `initialZoom` (number): Zoom level (default: 4)
- `availableLayers` (array): Available datasets (default: all)
- `initialVisibleLayers` (array): Initially visible layers
- `showLegend` (boolean): Show layer toggle (default: true)
- `showClickInfo` (boolean): Show feature info on click (default: true)
- `onMapLoad` (function): Callback when ready
- `onError` (function): Error callback

**Returns:** Promise resolving to VanillaLandMap instance

### Instance Methods

- `showLayer(layerKey)`: Show a dataset
- `hideLayer(layerKey)`: Hide a dataset
- `getVisibleLayers()`: Get visible layer keys
- `getMap()`: Get MapLibre map instance
- `destroy()`: Clean up

## 📊 Performance

- **Bundle size:** 951KB minified (includes MapLibre GL JS, PMTiles, Turf.js)
- **Gzip size:** ~300KB (estimated)
- **Load time:** ~1-2 seconds on 3G
- **Memory usage:** ~50-100MB depending on visible layers

## 🔒 Security

- Never hardcode API keys in client-side code
- Use server-side templates to inject keys securely
- Consider API key rotation
- Use environment variables for key storage

## 🐛 Troubleshooting

### Map Not Loading
1. Check container element exists with correct ID
2. Verify API key is valid
3. Ensure MapLibre CSS is included
4. Check browser console for errors

### Layers Not Showing
1. Verify layer names: `ssurgo`, `cdl`, `plss`, `clu`
2. Check layers are in `availableLayers`
3. Ensure API key has dataset access
4. Try zooming to data-rich areas

### Performance Issues
1. Use minified version (`.min.js`)
2. Limit `availableLayers` to needed datasets
3. Consider lazy loading the script
4. Use appropriate zoom levels

## 📞 Support

- Full documentation: `src/vanilla-js/README.md`
- Examples: `src/vanilla-js/examples/`
- Issues: GitHub Issues
- Email: support@landmapmagic.com

## 🎉 Success!

Your vanilla JS version is now ready for deployment to R2 and integration into any web application framework!
