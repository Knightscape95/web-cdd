import React from 'react';

const MapLayerControl = ({ activeLayer, onLayerChange }) => {
  return (
    <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-md p-1 flex flex-col sm:flex-row gap-1">
      <button
        onClick={() => onLayerChange('street')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          activeLayer === 'street'
            ? 'bg-green-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-pressed={activeLayer === 'street'}
      >
        रस्ता (Street)
      </button>
      <button
        onClick={() => onLayerChange('satellite')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          activeLayer === 'satellite'
            ? 'bg-green-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-pressed={activeLayer === 'satellite'}
      >
        उपग्रह (Satellite)
      </button>
      <button
        onClick={() => onLayerChange('terrain')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          activeLayer === 'terrain'
            ? 'bg-green-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-pressed={activeLayer === 'terrain'}
      >
        भूभाग (Terrain)
      </button>
    </div>
  );
};

export default MapLayerControl;
