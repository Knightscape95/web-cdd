# Ticket: Enhance Forecast Display with Hourly Timeline and Visual Improvements

## Description
Improve the forecast UI by adding an hourly timeline (next 24 hours or 3-hourly entries as available) and enhancing daily forecast cards with clearer visuals: precipitation probability badges, temperature sparkline, and clearer icons. Ensure accessibility and responsive layout.

## Acceptance Criteria
- [ ] Display an hourly timeline for upcoming hours (use forecast.hourly data; if only 3-hourly points exist, show those for the next 24 hours).
- [ ] Hourly timeline is horizontally scrollable, keyboard navigable, and shows hour, icon, temperature, and precipitation probability.
- [ ] Add a small sparkline representing temperature trend in the hourly timeline.
- [ ] Enhance daily forecast cards to show POP badges and mini temp bars for quick glance.
- [ ] Keep mobile-first responsive layout and ARIA attributes for accessibility.
- [ ] Integrate changes in `WeatherPage` forecast tab and add component `src/components/HourlyTimeline.jsx`.
- [ ] Follow React best practices and keep components modular.
