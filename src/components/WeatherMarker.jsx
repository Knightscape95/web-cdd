import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { getWeatherIconUrl, getConditionMarathi } from '../lib/weatherService';

const WeatherMarker = ({ position, weatherData }) => {
  if (!position || !weatherData) return null;

  const { temp, condition, humidity, windSpeed, description, icon } = weatherData;
  const iconUrl = getWeatherIconUrl(icon);
  const conditionMr = getConditionMarathi(condition);

  return (
    <Marker position={position}>
      <Popup className="weather-popup">
        <div className="p-2 min-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg">{conditionMr}</h3>
            <img src={iconUrl} alt={description} className="w-10 h-10" />
          </div>
          <div className="text-3xl font-bold mb-2">{temp}°C</div>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="capitalize">{description}</p>
            <div className="flex justify-between">
              <span>आर्द्रता (Humidity):</span>
              <span className="font-medium">{humidity}%</span>
            </div>
            <div className="flex justify-between">
              <span>वारा (Wind):</span>
              <span className="font-medium">{windSpeed} m/s</span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default WeatherMarker;
