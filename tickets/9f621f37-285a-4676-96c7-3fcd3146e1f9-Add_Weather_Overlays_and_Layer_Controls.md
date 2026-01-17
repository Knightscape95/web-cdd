# Ticket: Add Weather Overlays and Layer Controls

## Description
Add weather-specific map overlays (precipitation, wind, temperature) as toggleable layers on the interactive map. Provide a clear, accessible control UI for turning overlays on/off and adjusting overlay opacity. Integrate overlays with the existing map component so markers and user interactions continue to work seamlessly.

## Acceptance Criteria
- [ ] At least three weather overlays are available: precipitation, wind, and temperature.
- [ ] Users can toggle each overlay on/off via a visible control panel (checkboxes or toggles).
- [ ] Users can adjust overlay opacity for better visualization.
- [ ] Overlays use OpenWeatherMap tile endpoints and include the configured `VITE_WEATHER_API_KEY`.
- [ ] If the API key is missing, the overlay controls are disabled and a helpful hint is shown.
- [ ] Overlays are responsive and accessible (keyboard navigable, ARIA attributes where appropriate).
- [ ] Overlays integrate with existing weather/location markers and map interactions.
- [ ] Implementation follows React component best practices and is modular.

## Notes
- Use `react-leaflet` TileLayer with `opacity` for overlays.
- Ensure attribution for tile sources is present.
- Consider adding small UI improvements like opacity sliders per overlay.
