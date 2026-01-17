# Ticket: Implement Advanced Agricultural Metrics and Insights

## Description
Add advanced agricultural metrics and insights tailored for farmers using existing weather and historical data. These include: Growing Degree Days (GDD), Frost Risk estimate, Rainfall Accumulation over user-selected windows, and Pest/Disease Risk scores for specific crops based on weather trends.

## Acceptance Criteria
- [ ] Compute Growing Degree Days (GDD) for a selected location using historical daily temperature data.
- [ ] Provide a configurable base temperature for GDD calculation (default 10°C) and a selectable time window (e.g., last 7, 14, 30 days).
- [ ] Show frost risk as a probability or flag based on minimum temperatures and forecasted minima.
- [ ] Compute rainfall accumulation over selectable windows and compare to crop-specific thresholds.
- [ ] Add simple Pest/Disease risk scoring guidelines based on temperature and humidity (configurable per crop) and display risk levels in the UI.
- [ ] Add a new section in `WeatherPage` called 'Advanced Metrics' that displays these metrics and explanations.
- [ ] Follow modular code practices: add computations to `src/lib/agroMetrics.js` and UI as `src/components/AdvancedMetrics.jsx`.
- [ ] Add tests for the metrics computation functions (if test framework exists).

## Notes
- Keep calculations transparent and documented with inline comments.
- Use saved historical data via `getDailyWeatherStats` from `src/lib/database.js`.
- Provide sensible defaults and ensure accessibility for the UI elements.
