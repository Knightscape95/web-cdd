import React, { useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MapLayerControl from './MapLayerControl';
import MapOverlaysControl from './MapOverlaysControl';
import WeatherMarker from './WeatherMarker';
import { getCurrentWeather } from '../lib/weatherService';

// Fix for default marker icon issues in Leaflet with Webpack/Vite
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const MapContainer = ({ center = [21.1458, 79.0882], zoom = 10, children, className = "h-[480px] w-full rounded-lg" }) => {
  const [activeLayer, setActiveLayer] = useState('street');
  const [markerPosition, setMarkerPosition] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);

  const OWM_KEY = import.meta.env.VITE_WEATHER_API_KEY || null;
  const overlaysDisabled = !OWM_KEY; // Only OpenWeather overlays require key; RainViewer is available without key

  // Overlay state (precipitation on by default when API key present, rainviewer enabled)
  const [overlays, setOverlays] = useState({ precipitation: !!OWM_KEY, wind: false, temperature: false, clouds: false, rainviewer: true });
  const [opacities, setOpacities] = useState({ precipitation: 0.6, wind: 0.6, temperature: 0.6, clouds: 0.5, rainviewer: 0.7 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load saved overlay preferences on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('map_overlays')
      if (saved) {
        const parsed = JSON.parse(saved)
        setOverlays(prev => ({ ...prev, ...parsed }))
      }
      const savedOp = localStorage.getItem('map_overlay_opacities')
      if (savedOp) {
        setOpacities(prev => ({ ...prev, ...JSON.parse(savedOp) }))
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // Persist overlays to localStorage when changed
  React.useEffect(() => {
    try { localStorage.setItem('map_overlays', JSON.stringify(overlays)) } catch(e) {}
  }, [overlays])

  React.useEffect(() => {
    try { localStorage.setItem('map_overlay_opacities', JSON.stringify(opacities)) } catch(e) {}
  }, [opacities])

  React.useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isFullscreen])

  // map instance and tile error tracking
  const [mapInstance, setMapInstance] = useState(null);
  const [tileErrors, setTileErrors] = useState({});

  // RainViewer tile template (updated from API)
  const [rainviewerTemplate, setRainviewerTemplate] = useState(null);
  const [rainviewerLabel, setRainviewerLabel] = useState('latest');

  const handleTileError = (layerName) => {
    setTileErrors(prev => ({ ...prev, [layerName]: true }))
    // non-blocking UI hint could be added here
  }

  // Fetch RainViewer available frames and set template for latest frame
  React.useEffect(() => {
    let canceled = false
    async function fetchFrames() {
      const endpoints = [
        'https://api.rainviewer.com/public/weather-maps.json',
        'https://api.rainviewer.com/public/maps.json',
        'https://api.rainviewer.com/public/weather-maps.json?_=1'
      ]

      for (const url of endpoints) {
        try {
          const res = await fetch(url)
          if (!res.ok) continue
          const data = await res.json()

          // data.frames or data.radar?.past
          let frames = []
          if (Array.isArray(data.frames)) frames = data.frames
          else if (Array.isArray(data.radar?.past)) frames = data.radar.past

          if (frames.length > 0) {
            const latest = frames[frames.length - 1]
            if (!canceled) {
              // Build template: include size segment (256) for consistency
              setRainviewerTemplate(`https://tilecache.rainviewer.com/v2/radar/${latest}/256/{z}/{x}/{y}.png`)
              setRainviewerLabel(new Date(latest * 1000).toLocaleString())
            }
            return
          }
        } catch (err) {
          // try next endpoint
        }
      }

      // fallback: use generic template that may 404 for missing frames
      if (!canceled) {
        setRainviewerTemplate('https://tilecache.rainviewer.com/v2/radar/256/{z}/{x}/{y}.png')
        setRainviewerLabel('latest')
      }
    }

    fetchFrames()
    return () => { canceled = true }
  }, [])


  const locateUser = () => {
    if (!mapInstance) return
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude]
        mapInstance.flyTo(latlng, 12)
        setMarkerPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })

        try {
          setLoading(true)
          const data = await getCurrentWeather(pos.coords.latitude, pos.coords.longitude)
          setWeatherData(data)
        } catch (err) {
          console.error('Failed to fetch weather for location', err)
        } finally {
          setLoading(false)
        }
      }, (err) => {
        console.warn('Geolocation error', err)
      })
    } else {
      console.warn('Geolocation not available')
    }
  }

  const [mapCenter, setMapCenter] = useState(center)

  const handleMapClick = async (latlng) => {
    setMarkerPosition(latlng);
    setLoading(true);
    setWeatherData(null); // Clear previous data while loading
    try {
      const data = await getCurrentWeather(latlng.lat, latlng.lng);
      setWeatherData(data);
    } catch (error) {
      console.error("Failed to fetch weather", error);
    } finally {
      setLoading(false);
    }
  };

  // Attempt to center map on user's location on mount
  React.useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude]
        setMapCenter(latlng)
        setMarkerPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      }, (err) => {
        // silently ignore
      }, { timeout: 5000 })
    }
  }, [])

  return (
    <div className={`relative ${className} ${isFullscreen ? 'map-fullscreen' : ''}`}>
      <MapLayerControl activeLayer={activeLayer} onLayerChange={setActiveLayer} />
      <MapOverlaysControl
        overlays={overlays}
        onToggle={(key, value) => setOverlays(prev => ({ ...prev, [key]: value }))}
        opacities={opacities}
        onOpacityChange={(key, value) => setOpacities(prev => ({ ...prev, [key]: value }))}
        disabled={overlaysDisabled}
      />
      
      {/* Fullscreen toggle */}
      <div className="absolute top-4 right-4 z-[1004]">
        <button onClick={() => setIsFullscreen(prev => !prev)} className="bg-white rounded-full p-2 shadow hover:bg-gray-100" aria-label="Toggle fullscreen">
          {isFullscreen ? '🗗' : '🗖'}
        </button>
      </div>

      {/* Locate button */}
      <div className="absolute top-4 left-4 z-[1003]">
        <button onClick={locateUser} className="bg-white rounded-full p-2 shadow hover:bg-gray-100" aria-label="Locate me">
          📍
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-black/20 rounded-lg pointer-events-none">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      <LeafletMap 
        whenCreated={(map) => setMapInstance(map)}
        center={mapCenter} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        className="h-full w-full rounded-lg z-0"
      >
        <TileLayer
          attribution={
            activeLayer === 'street'
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              : activeLayer === 'satellite'
                ? 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                : 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under ODbL.'
          }
          url={
            activeLayer === 'street'
              ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              : activeLayer === 'satellite'
                ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                : 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg'
          }
        />

        {/* Weather overlays (OpenWeather tiles) */}
        {overlays.precipitation && OWM_KEY && (
          <TileLayer
            url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`}
            opacity={opacities.precipitation}
            attribution="&copy; OpenWeather"
            eventHandlers={{ tileerror: (e) => handleTileError('precipitation') }}
          />
        )}

        {overlays.wind && OWM_KEY && (
          <TileLayer
            url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`}
            opacity={opacities.wind}
            attribution="&copy; OpenWeather"
            eventHandlers={{ tileerror: (e) => handleTileError('wind') }}
          />
        )}

        {overlays.temperature && OWM_KEY && (
          <TileLayer
            url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`}
            opacity={opacities.temperature}
            attribution="&copy; OpenWeather"
            eventHandlers={{ tileerror: (e) => handleTileError('temperature') }}
          />
        )}

        {overlays.clouds && OWM_KEY && (
          <TileLayer
            url={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`}
            opacity={opacities.clouds}
            attribution="&copy; OpenWeather"
            eventHandlers={{ tileerror: (e) => handleTileError('clouds') }}
          />
        )}

        {overlays.rainviewer && rainviewerTemplate && (
          <TileLayer
            // RainViewer latest radar tiles (no API key required)
            url={rainviewerTemplate}
            opacity={opacities.rainviewer}
            attribution={`&copy; RainViewer (${rainviewerLabel})`}
            eventHandlers={{ tileerror: (e) => handleTileError('rainviewer') }}
          />
        )}

        {overlays.rainviewer && !rainviewerTemplate && (
          <div className="absolute bottom-4 left-4 z-[1003] bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-3 py-2 rounded">
            RainViewer frames not available right now
          </div>
        )}

        <MapClickHandler onMapClick={handleMapClick} />
        {markerPosition && weatherData && (
            <WeatherMarker position={markerPosition} weatherData={weatherData} />
        )}
        {children}
      </LeafletMap>

      {/* Tile errors banner */}
      {Object.keys(tileErrors).length > 0 && (
        <div className="absolute bottom-4 left-4 z-[1002] bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-3 py-2 rounded">
          Tile load errors for: {Object.keys(tileErrors).join(', ')}
        </div>
      )}
    </div>
  );
};

export default MapContainer;
