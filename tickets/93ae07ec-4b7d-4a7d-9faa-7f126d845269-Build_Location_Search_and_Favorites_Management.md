# Ticket: Build Location Search and Favorites Management

## Description
Add a location search component and favorites management to the app. The search should support forward geocoding (search by city/place name) and allow users to save frequently used locations as favorites. Favorites should persist across app sessions.

## Acceptance Criteria
- [ ] Users can search for locations (city, town, village) using a search box.
- [ ] Search uses OpenWeather geocoding when `VITE_WEATHER_API_KEY` is present; otherwise falls back to Nominatim.
- [ ] Search results are displayed in an accessible list with a keyboard navigable interface.
- [ ] Users can save a search result as a favorite and remove favorites.
- [ ] Favorites persist in `localStorage` and display in a `Favorites` panel.
- [ ] Users can select a favorite to center the map / show weather for that location.
- [ ] Follow best practices and component modularity.
- [ ] Add tests if testing is available (optional)

## Notes
- Store favorites under `localStorage` key `favorites_locations`.
- Favorite item should contain: id, name, lat, lon, country, state (if available).
