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

const MapContainer = ({ center = [21.1458, 79.0882], zoom = 10, children, className = "h-[400px] w-full rounded-lg" }) => {
  const [activeLayer, setActiveLayer] = useState('street');
  const [markerPosition, setMarkerPosition] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Overlay state (precipitation, wind, temperature)
  const [overlays, setOverlays] = useState({ precipitation: false, wind: false, temperature: false });
  const [opacities, setOpacities] = useState({ precipitation: 0.6, wind: 0.6, temperature: 0.6 });

  const OWM_KEY = import.meta.env.VITE_WEATHER_API_KEY || null;
  const overlaysDisabled = !OWM_KEY;

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

  return (
    <div className={`relative ${className}`}>
      <MapLayerControl activeLayer={activeLayer} onLayerChange={setActiveLayer} />
      <MapOverlaysControl
        overlays={overlays}
        onToggle={(key, value) => setOverlays(prev => ({ ...prev, [key]: value }))}
        opacities={opacities}
        onOpacityChange={(key, value) => setOpacities(prev => ({ ...prev, [key]: value }))}
        disabled={overlaysDisabled}
      />
      
      {loading && (
        <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-black/20 rounded-lg pointer-events-none">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      <LeafletMap 
        center={center} 
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
          />
        )}

        {overlays.wind && OWM_KEY && (
          <TileLayer
            url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`}
            opacity={opacities.wind}
            attribution="&copy; OpenWeather"
          />
        )}

        {overlays.temperature && OWM_KEY && (
          <TileLayer
            url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`}
            opacity={opacities.temperature}
            attribution="&copy; OpenWeather"
          />
        )}

        <MapClickHandler onMapClick={handleMapClick} />
        {markerPosition && weatherData && (
            <WeatherMarker position={markerPosition} weatherData={weatherData} />
        )}
        {children}
      </LeafletMap>
    </div>
  );
};

export default MapContainer;
