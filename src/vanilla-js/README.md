# LandMapMagic Vanilla JS

**For non-React applications** - Flask, Django, PHP, Rails, plain HTML, and any web framework.

The easiest way to add interactive land data maps to your web applications without React dependencies.

## Quick Start

### 1. Include the Script

```html
<!DOCTYPE html>
<html>
<head>
    <!-- MapLibre CSS (required) -->
    <link href='https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css' rel='stylesheet' />
</head>
<body>
    <div id="farm-map" style="width: 100%; height: 500px;"></div>
    
    <!-- LandMapMagic Vanilla JS -->
    <script src="https://static.landmapmagic.com/js/landmap-vanilla-latest.min.js"></script>
    
    <script>
        LandMapMagic.createMap('farm-map', {
            apiKey: 'your-api-key-here',
            initialCenter: [-93.5, 42.0], // Iowa
            initialVisibleLayers: ['ssurgo', 'plss']
        });
    </script>
</body>
</html>
```

### 2. Get Your API Key

1. Sign up at [landmapmagic.com](https://landmapmagic.com)
2. Go to your dashboard
3. Copy your API key
4. Use it in the `apiKey` option

## Framework Integration Examples

### Flask

```python
from flask import Flask, render_template_string
import os

app = Flask(__name__)

@app.route('/farm/<farm_id>')
def farm_view(farm_id):
    # Your farm data logic
    farm = get_farm_data(farm_id)
    
    template = '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>{{ farm.name }}</title>
        <link href='https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css' rel='stylesheet' />
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            #map { width: 100%; height: 600px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <h1>{{ farm.name }}</h1>
        <p>{{ farm.acres }} acres in {{ farm.county }}, {{ farm.state }}</p>
        
        <div id="map"></div>
        
        <script src="https://static.landmapmagic.com/js/landmap-vanilla-latest.min.js"></script>
        <script>
            LandMapMagic.createMap('map', {
                apiKey: '{{ api_key }}',
                initialCenter: {{ farm.center | tojson }},
                initialZoom: 14,
                availableLayers: ['ssurgo', 'cdl', 'plss'],
                initialVisibleLayers: ['ssurgo', 'cdl'],
                showLegend: true,
                onMapLoad: function(map) {
                    console.log('Farm map loaded for {{ farm.name }}');
                }
            });
        </script>
    </body>
    </html>
    '''
    
    return render_template_string(template, 
                                farm=farm, 
                                api_key=os.environ.get('LANDMAP_API_KEY'))

def get_farm_data(farm_id):
    # Your database logic here
    return {
        'name': 'Johnson Family Farm',
        'acres': 1200,
        'county': 'Story',
        'state': 'Iowa',
        'center': [-93.5, 42.0]
    }
```

### Django

```python
# views.py
from django.shortcuts import render
from django.conf import settings

def farm_detail(request, farm_id):
    farm = get_farm_data(farm_id)
    return render(request, 'farm_detail.html', {
        'farm': farm,
        'landmap_api_key': settings.LANDMAP_API_KEY
    })

# settings.py
LANDMAP_API_KEY = os.environ.get('LANDMAP_API_KEY')
```

```html
<!-- templates/farm_detail.html -->
<!DOCTYPE html>
<html>
<head>
    <title>{{ farm.name }}</title>
    <link href='https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css' rel='stylesheet' />
</head>
<body>
    <h1>{{ farm.name }}</h1>
    <div id="map" style="width: 100%; height: 500px;"></div>
    
    <script src="https://static.landmapmagic.com/js/landmap-vanilla-latest.min.js"></script>
    <script>
        LandMapMagic.createMap('map', {
            apiKey: '{{ landmap_api_key }}',
            initialCenter: [{{ farm.longitude }}, {{ farm.latitude }}],
            initialVisibleLayers: ['ssurgo']
        });
    </script>
</body>
</html>
```

### PHP

```php
<?php
// farm.php
$apiKey = $_ENV['LANDMAP_API_KEY'];
$farm = getFarmData($_GET['farm_id']);
?>
<!DOCTYPE html>
<html>
<head>
    <title><?php echo htmlspecialchars($farm['name']); ?></title>
    <link href='https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css' rel='stylesheet' />
</head>
<body>
    <h1><?php echo htmlspecialchars($farm['name']); ?></h1>
    <div id="map" style="width: 100%; height: 500px;"></div>
    
    <script src="https://static.landmapmagic.com/js/landmap-vanilla-latest.min.js"></script>
    <script>
        LandMapMagic.createMap('map', {
            apiKey: '<?php echo $apiKey; ?>',
            initialCenter: [<?php echo $farm['lng']; ?>, <?php echo $farm['lat']; ?>],
            initialVisibleLayers: ['ssurgo', 'plss']
        });
    </script>
</body>
</html>
```

### Ruby on Rails

```ruby
# app/controllers/farms_controller.rb
class FarmsController < ApplicationController
  def show
    @farm = Farm.find(params[:id])
    @landmap_api_key = Rails.application.credentials.landmap_api_key
  end
end
```

```erb
<!-- app/views/farms/show.html.erb -->
<h1><%= @farm.name %></h1>
<div id="map" style="width: 100%; height: 500px;"></div>

<%= content_for :javascript do %>
  <script src="https://static.landmapmagic.com/js/landmap-vanilla-latest.min.js"></script>
  <script>
    LandMapMagic.createMap('map', {
      apiKey: '<%= @landmap_api_key %>',
      initialCenter: [<%= @farm.longitude %>, <%= @farm.latitude %>],
      initialVisibleLayers: ['ssurgo']
    });
  </script>
<% end %>
```

## Advanced Usage

### Declarative HTML (Data Attributes)

```html
<div id="farm-map" 
     data-landmap-api-key="your-api-key"
     data-landmap-center="-93.5,42.0"
     data-landmap-zoom="12"
     data-landmap-layers="ssurgo,plss"
     data-landmap-visible="ssurgo"
     style="width: 100%; height: 500px;">
</div>

<script src="https://static.landmapmagic.com/js/landmap-vanilla-latest.min.js"></script>
<script>
    // Auto-initialize all maps with data attributes
    LandMapMagic.autoInit();
</script>
```

### Global Configuration

```html
<script src="https://static.landmapmagic.com/js/landmap-vanilla-latest.min.js"></script>
<script>
    // Set global defaults
    LandMapMagic.configure({
        defaultApiKey: 'your-api-key'
    });
    
    // Now all maps use the default key
    LandMapMagic.createMap('map1');
    LandMapMagic.createMap('map2');
    
    // Or override per map
    LandMapMagic.createMap('map3', {
        apiKey: 'different-key'
    });
</script>
```

### Programmatic Control

```html
<script>
    LandMapMagic.createMap('map', {
        apiKey: 'your-api-key',
        onMapLoad: function(landMap) {
            // Control the map programmatically
            
            // Show/hide layers
            landMap.showLayer('cdl');
            landMap.hideLayer('plss');
            
            // Get visible layers
            console.log('Visible:', landMap.getVisibleLayers());
            
            // Access the underlying MapLibre map
            const map = landMap.getMap();
            map.flyTo({ center: [-95, 40], zoom: 8 });
        },
        onError: function(error) {
            console.error('Map error:', error);
        }
    });
</script>
```

## API Reference

### `LandMapMagic.createMap(containerId, options)`

Creates a new land map instance.

**Parameters:**
- `containerId` (string): ID of the HTML element to contain the map
- `options` (object): Configuration options

**Options:**
- `apiKey` (string): Your LandMapMagic API key
- `initialCenter` (array): `[longitude, latitude]` - default: `[-98.5795, 39.8283]`
- `initialZoom` (number): Initial zoom level - default: `4`
- `style` (string|object): Map style URL or object
- `availableLayers` (array): Which datasets to make available - default: `['ssurgo', 'cdl', 'plss', 'clu']`
- `initialVisibleLayers` (array): Which layers to show on load - default: `[]`
- `showLegend` (boolean): Show the layer toggle legend - default: `true`
- `showClickInfo` (boolean): Show feature info on click - default: `true`
- `onMapLoad` (function): Callback when map is ready
- `onError` (function): Error callback

**Returns:** Promise that resolves to a `VanillaLandMap` instance

### `LandMapMagic.configure(options)`

Set global defaults.

**Options:**
- `defaultApiKey` (string): Default API key for all maps
- `defaultEndpoint` (string): Default API endpoint

### `LandMapMagic.autoInit()`

Auto-initialize maps from HTML data attributes.

**Returns:** Promise that resolves to array of `VanillaLandMap` instances

### VanillaLandMap Instance Methods

- `showLayer(layerKey)`: Show a dataset layer
- `hideLayer(layerKey)`: Hide a dataset layer  
- `getVisibleLayers()`: Get array of visible layer keys
- `getMap()`: Get the underlying MapLibre map instance
- `destroy()`: Clean up and remove the map

## Available Datasets

### SSURGO (Soil Data)
- **ID:** `ssurgo`
- **Content:** Detailed soil information and properties
- **Best for:** Agricultural planning, soil analysis

### CDL (Cropland Data Layer)
- **ID:** `cdl`
- **Content:** Annual crop type classification
- **Best for:** Crop monitoring, agricultural statistics

### PLSS (Public Land Survey System)
- **ID:** `plss`
- **Content:** Township, range, and section boundaries
- **Best for:** Land ownership, legal descriptions

### CLU (Common Land Units)
- **ID:** `clu`
- **Content:** Field boundary data
- **Best for:** Farm management, field mapping

## CDN URLs

### Production (Recommended)
```html
<!-- Latest stable version (minified, no source map) -->
<script src="https://static.landmapmagic.com/js/landmap-vanilla-latest.min.js"></script>

<!-- Specific version (minified, no source map) -->
<script src="https://static.landmapmagic.com/js/landmap-vanilla-v0.1.0.min.js"></script>
```

### Development
```html
<!-- Latest with source map for debugging -->
<script src="https://static.landmapmagic.com/js/landmap-vanilla-latest.js"></script>

<!-- Specific version with source map -->
<script src="https://static.landmapmagic.com/js/landmap-vanilla-v0.1.0.js"></script>
```

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Security Notes

- Never hardcode API keys in client-side code for production
- Use server-side templates to inject API keys securely
- Consider implementing API key rotation
- Use environment variables for API key storage

## Troubleshooting

### Map Not Loading
1. Check that the container element exists
2. Verify the API key is correct
3. Ensure MapLibre CSS is included
4. Check browser console for errors

### Layers Not Showing
1. Verify the layer names are correct (`ssurgo`, `cdl`, `plss`, `clu`)
2. Check that layers are in `availableLayers` array
3. Ensure API key has access to the datasets
4. Try zooming to an area with data

### Performance Issues
1. Use the minified version (`landmap-vanilla-latest.min.js`)
2. Limit `availableLayers` to only what you need
3. Consider lazy loading the script
4. Use appropriate zoom levels for your data

## Support

- Documentation: [landmapmagic.com/docs](https://landmapmagic.com/docs)
- Issues: [GitHub Issues](https://github.com/staviebrock/landmapmagic/issues)
- Email: support@landmapmagic.com
