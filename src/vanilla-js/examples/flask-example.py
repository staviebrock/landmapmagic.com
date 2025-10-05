"""
LandMapMagic Vanilla JS - Flask Integration Example

This example shows how to integrate LandMapMagic into a Flask application
for displaying farm and field data with interactive maps.

Requirements:
    pip install flask python-dotenv

Usage:
    1. Set your LANDMAP_API_KEY in environment or .env file
    2. Run: python flask-example.py
    3. Visit: http://localhost:5000
"""

from flask import Flask, render_template_string, jsonify, request
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Sample farm data (in real app, this would come from a database)
FARMS = {
    '1': {
        'id': '1',
        'name': 'Johnson Family Farm',
        'owner': 'Robert Johnson',
        'acres': 1200,
        'county': 'Story',
        'state': 'Iowa',
        'center': [-93.5, 42.0],
        'fields': [
            {'id': 'f1', 'name': 'North Field', 'acres': 400, 'crop': 'Corn'},
            {'id': 'f2', 'name': 'South Field', 'acres': 350, 'crop': 'Soybeans'},
            {'id': 'f3', 'name': 'East Field', 'acres': 450, 'crop': 'Corn'}
        ]
    },
    '2': {
        'id': '2',
        'name': 'Prairie View Farms',
        'owner': 'Sarah Miller',
        'acres': 800,
        'county': 'Hamilton',
        'state': 'Nebraska',
        'center': [-98.1, 41.2],
        'fields': [
            {'id': 'f4', 'name': 'West Section', 'acres': 400, 'crop': 'Wheat'},
            {'id': 'f5', 'name': 'East Section', 'acres': 400, 'crop': 'Corn'}
        ]
    }
}

@app.route('/')
def index():
    """Farm listing page"""
    template = '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Farm Management Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #2E8B57, #4A90E2); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .farm-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .farm-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .farm-card h3 { margin: 0 0 10px 0; color: #333; }
            .farm-card p { margin: 5px 0; color: #666; }
            .farm-card a { display: inline-block; margin-top: 15px; padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
            .farm-card a:hover { background: #0056b3; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌾 Farm Management Dashboard</h1>
                <p>Manage your farms with interactive land data maps</p>
            </div>
            
            <div class="farm-grid">
                {% for farm in farms %}
                <div class="farm-card">
                    <h3>{{ farm.name }}</h3>
                    <p><strong>Owner:</strong> {{ farm.owner }}</p>
                    <p><strong>Location:</strong> {{ farm.county }} County, {{ farm.state }}</p>
                    <p><strong>Total Acres:</strong> {{ farm.acres }}</p>
                    <p><strong>Fields:</strong> {{ farm.fields|length }}</p>
                    <a href="/farm/{{ farm.id }}">View Farm Details</a>
                </div>
                {% endfor %}
            </div>
        </div>
    </body>
    </html>
    '''
    
    return render_template_string(template, farms=FARMS.values())

@app.route('/farm/<farm_id>')
def farm_detail(farm_id):
    """Individual farm detail page with map"""
    farm = FARMS.get(farm_id)
    if not farm:
        return "Farm not found", 404
    
    api_key = os.environ.get('LANDMAP_API_KEY', 'dev')
    
    template = '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>{{ farm.name }} - Farm Details</title>
        <!-- MapLibre CSS -->
        <link href='https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css' rel='stylesheet' />
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #2E8B57, #4A90E2); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .back-link { color: white; text-decoration: none; opacity: 0.9; }
            .back-link:hover { opacity: 1; }
            .content { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
            .sidebar { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); height: fit-content; }
            .map-container { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
            #map { width: 100%; height: 600px; }
            .field-list { margin-top: 20px; }
            .field-item { padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #007bff; }
            .controls { margin-top: 20px; }
            .controls button { margin: 5px 5px 5px 0; padding: 8px 12px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
            .controls button:hover { background: #5a6268; }
            .controls button.active { background: #28a745; }
            @media (max-width: 768px) {
                .content { grid-template-columns: 1fr; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <a href="/" class="back-link">← Back to Dashboard</a>
                <h1>{{ farm.name }}</h1>
                <p>{{ farm.county }} County, {{ farm.state }} • {{ farm.acres }} acres</p>
            </div>
            
            <div class="content">
                <div class="sidebar">
                    <h3>Farm Information</h3>
                    <p><strong>Owner:</strong> {{ farm.owner }}</p>
                    <p><strong>Total Acres:</strong> {{ farm.acres }}</p>
                    <p><strong>Location:</strong> {{ farm.county }} County, {{ farm.state }}</p>
                    
                    <div class="field-list">
                        <h4>Fields ({{ farm.fields|length }})</h4>
                        {% for field in farm.fields %}
                        <div class="field-item">
                            <strong>{{ field.name }}</strong><br>
                            {{ field.acres }} acres • {{ field.crop }}
                        </div>
                        {% endfor %}
                    </div>
                    
                    <div class="controls">
                        <h4>Map Controls</h4>
                        <button onclick="showSoilData()" id="soil-btn">Soil Data</button>
                        <button onclick="showCropData()" id="crop-btn">Crop Data</button>
                        <button onclick="showSurveyData()" id="survey-btn">Survey Lines</button>
                        <button onclick="showFieldBoundaries()" id="field-btn">Field Boundaries</button>
                        <br>
                        <button onclick="resetView()" style="background: #dc3545;">Reset View</button>
                    </div>
                </div>
                
                <div class="map-container">
                    <div id="map"></div>
                </div>
            </div>
        </div>

        <!-- LandMapMagic Vanilla JS -->
        <script src="https://static.landmapmagic.com/js/landmap-vanilla-latest.js"></script>
        
        <script>
            let landMap;
            
            // Initialize the map
            LandMapMagic.createMap('map', {
                apiKey: '{{ api_key }}',
                initialCenter: {{ farm.center | tojson }},
                initialZoom: 12,
                availableLayers: ['ssurgo', 'cdl', 'plss', 'clu'],
                initialVisibleLayers: ['ssurgo'],
                showLegend: true,
                showClickInfo: true,
                onMapLoad: function(map) {
                    landMap = map;
                    console.log('🎉 Farm map loaded for {{ farm.name }}');
                    updateButtonStates();
                },
                onError: function(error) {
                    console.error('❌ Map error:', error);
                    alert('Failed to load map: ' + error.message);
                }
            });
            
            // Control functions
            function showSoilData() {
                if (landMap) {
                    landMap.showLayer('ssurgo');
                    updateButtonStates();
                }
            }
            
            function showCropData() {
                if (landMap) {
                    landMap.showLayer('cdl');
                    updateButtonStates();
                }
            }
            
            function showSurveyData() {
                if (landMap) {
                    landMap.showLayer('plss');
                    updateButtonStates();
                }
            }
            
            function showFieldBoundaries() {
                if (landMap) {
                    landMap.showLayer('clu');
                    updateButtonStates();
                }
            }
            
            function resetView() {
                if (landMap) {
                    const map = landMap.getMap();
                    map.flyTo({
                        center: {{ farm.center | tojson }},
                        zoom: 12,
                        duration: 1500
                    });
                }
            }
            
            function updateButtonStates() {
                if (!landMap) return;
                
                const visible = landMap.getVisibleLayers();
                const buttons = {
                    'ssurgo': document.getElementById('soil-btn'),
                    'cdl': document.getElementById('crop-btn'),
                    'plss': document.getElementById('survey-btn'),
                    'clu': document.getElementById('field-btn')
                };
                
                Object.keys(buttons).forEach(layer => {
                    const button = buttons[layer];
                    if (button) {
                        if (visible.includes(layer)) {
                            button.classList.add('active');
                        } else {
                            button.classList.remove('active');
                        }
                    }
                });
            }
        </script>
    </body>
    </html>
    '''
    
    return render_template_string(template, farm=farm, api_key=api_key)

@app.route('/api/farms')
def api_farms():
    """API endpoint for farm data"""
    return jsonify(list(FARMS.values()))

@app.route('/api/farm/<farm_id>')
def api_farm(farm_id):
    """API endpoint for individual farm data"""
    farm = FARMS.get(farm_id)
    if not farm:
        return jsonify({'error': 'Farm not found'}), 404
    return jsonify(farm)

if __name__ == '__main__':
    # Check for API key
    api_key = os.environ.get('LANDMAP_API_KEY')
    if not api_key:
        print("⚠️  Warning: LANDMAP_API_KEY not set. Using 'dev' key for demo.")
        print("   Set your API key: export LANDMAP_API_KEY=your-key-here")
        print("   Or create a .env file with: LANDMAP_API_KEY=your-key-here")
    else:
        print(f"✅ Using API key: {api_key[:8]}...")
    
    print("\n🚀 Starting Flask app...")
    print("   Visit: http://localhost:5000")
    print("   Press Ctrl+C to stop")
    
    app.run(debug=True, port=5000)
