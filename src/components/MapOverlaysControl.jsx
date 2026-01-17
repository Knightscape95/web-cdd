import React from 'react';

const OverlayToggle = ({ id, label, checked, onChange, disabled }) => (
  <label htmlFor={id} className="flex items-center gap-2 text-sm">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className="w-4 h-4"
      aria-checked={checked}
    />
    <span>{label}</span>
  </label>
);

const OpacitySlider = ({ id, value, onChange, disabled }) => (
  <label htmlFor={id} className="flex items-center gap-2 text-xs">
    <input
      id={id}
      type="range"
      min="0"
      max="1"
      step="0.05"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      disabled={disabled}
      className="w-28"
      aria-label="Overlay opacity"
    />
    <span className="w-8 text-right">{Math.round(value * 100)}%</span>
  </label>
);

const MapOverlaysControl = ({ overlays, onToggle, opacities, onOpacityChange, disabled, className = '' }) => {
  return (
    <div className={`absolute top-20 right-4 z-[1000] bg-white rounded-lg shadow-md p-3 flex flex-col gap-2 ${className}`}> 
      <h4 className="text-xs font-semibold mb-1">मौसम ओव्हरले (Weather overlays)</h4>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <OverlayToggle id="overlay-precip" label="पाऊस (Precipitation)" checked={overlays.precipitation} onChange={(v) => onToggle('precipitation', v)} disabled={disabled} />
          <OpacitySlider id="opacity-precip" value={opacities.precipitation} onChange={(v) => onOpacityChange('precipitation', v)} disabled={disabled || !overlays.precipitation} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <OverlayToggle id="overlay-wind" label="वारा (Wind)" checked={overlays.wind} onChange={(v) => onToggle('wind', v)} disabled={disabled} />
          <OpacitySlider id="opacity-wind" value={opacities.wind} onChange={(v) => onOpacityChange('wind', v)} disabled={disabled || !overlays.wind} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <OverlayToggle id="overlay-temp" label="तापमान (Temperature)" checked={overlays.temperature} onChange={(v) => onToggle('temperature', v)} disabled={disabled} />
          <OpacitySlider id="opacity-temp" value={opacities.temperature} onChange={(v) => onOpacityChange('temperature', v)} disabled={disabled || !overlays.temperature} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <OverlayToggle id="overlay-clouds" label="ढग (Clouds)" checked={overlays.clouds} onChange={(v) => onToggle('clouds', v)} disabled={disabled} />
          <OpacitySlider id="opacity-clouds" value={opacities.clouds} onChange={(v) => onOpacityChange('clouds', v)} disabled={disabled || !overlays.clouds} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <OverlayToggle id="overlay-rainviewer" label="RainViewer (Radar)" checked={overlays.rainviewer} onChange={(v) => onToggle('rainviewer', v)} disabled={false} />
          <OpacitySlider id="opacity-rainviewer" value={opacities.rainviewer} onChange={(v) => onOpacityChange('rainviewer', v)} disabled={!overlays.rainviewer} />
        </div>

        <div className="mt-2 pt-2 border-t text-xs text-gray-600">
          <h5 className="text-xs font-semibold mb-1">Legend</h5>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-400 rounded-sm inline-block" aria-hidden></span><span>पाऊस — Precipitation intensity</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-cyan-400 rounded-sm inline-block" aria-hidden></span><span>वारा — Wind (speed)</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-400 rounded-sm inline-block" aria-hidden></span><span>तापमान — Temperature heatmap</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-gray-400 rounded-sm inline-block" aria-hidden></span><span>ढग — Cloud cover</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-indigo-500 rounded-sm inline-block" aria-hidden></span><span>RainViewer — Radar (near-real-time)</span></div>
          </div>
        </div>

        {disabled && (
          <p className="text-xs text-gray-500 mt-1">OpenWeather API key not configured. Set <code>VITE_WEATHER_API_KEY</code> to enable OpenWeather overlays (precipitation, temperature, wind, clouds).</p>
        )}
      </div>
    </div>
  );
};

export default MapOverlaysControl;
