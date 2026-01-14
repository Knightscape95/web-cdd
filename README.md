# 🌱 पीक रोग ओळख - Crop Disease Detection Web App

A Progressive Web App (PWA) for detecting crop diseases in Cotton and Soybean using AI/ML, with weather prediction and farming insights for Maharashtra farmers.

## Features

### 🔍 Disease Detection
- **Cotton Diseases**: Bacterial Blight, Curl Virus, Fusarium Wilt, Healthy
- **Soybean Diseases**: 8 different disease types
- Uses ONNX models for offline-capable AI inference
- Camera capture or image upload support

### 🌦️ Weather Intelligence
- **Dynamic Location**: GPS-based automatic location detection
- **Current Weather**: Real-time weather from OpenWeatherMap API
- **5-Day Forecast**: Official API forecast
- **AI Predictions**: 7-day predictions using historical data
- **Farming Insights**: Crop-specific recommendations based on weather

### 📊 Data Management
- **Scan History**: All scans stored locally in IndexedDB
- **Weather History**: Collected for building predictions
- **Statistics**: Visual stats on scans and diseases detected
- **Offline Storage**: Works without internet

### 🎯 Farming Features
- Crop calendar with stage-specific activities
- Disease risk alerts based on humidity
- Optimal spraying day recommendations
- Irrigation advisories
- All content in Marathi for Maharashtra farmers

## Tech Stack

- **Frontend**: React 18 + Vite 5
- **Styling**: Tailwind CSS 3.4
- **ML Inference**: ONNX Runtime Web
- **Database**: IndexedDB (via idb library)
- **PWA**: Vite PWA Plugin + Workbox
- **Icons**: Lucide React
- **Weather API**: OpenWeatherMap

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file:
```env
VITE_WEATHER_API_KEY=your_openweathermap_api_key
```

Get your free API key from [OpenWeatherMap](https://openweathermap.org/api)

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

### 5. Preview Production Build
```bash
npm run preview
```

## Deployment to Vercel

### Option 1: Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option 2: GitHub Integration
1. Push code to GitHub
2. Import project in Vercel Dashboard
3. Add `VITE_WEATHER_API_KEY` in Environment Variables
4. Deploy

## Project Structure

```
src/
├── components/
│   ├── BottomNav.jsx      # Navigation bar
│   └── InstallPrompt.jsx  # PWA install prompt
├── lib/
│   ├── classifier.js      # ONNX model inference
│   ├── database.js        # IndexedDB operations
│   ├── remedies.js        # Disease treatment data
│   ├── weatherService.js  # Weather API integration
│   └── weatherPredictor.js # ML prediction model
├── pages/
│   ├── HomePage.jsx       # Landing page with weather
│   ├── ScanPage.jsx       # Camera/upload for scanning
│   ├── ResultsPage.jsx    # Disease results + remedies
│   ├── HistoryPage.jsx    # Scan history + stats
│   ├── WeatherPage.jsx    # Full weather dashboard
│   └── SettingsPage.jsx   # App settings
├── App.jsx                # Router setup
├── main.jsx               # Entry point
└── index.css              # Tailwind styles
public/
├── cotton_disease_model.onnx
└── soynet_soybean_model.onnx
```

## Weather Prediction Algorithm

The app uses a combination of:
1. **Linear Regression**: Trend analysis for temperature/humidity
2. **Moving Average**: Smoothing historical data
3. **Seasonal Factors**: Maharashtra-specific adjustments
4. **Confidence Scoring**: Decreases with prediction distance

Data is collected each time the app fetches weather, building a local historical database for predictions.

## PWA Features

- **Offline Mode**: Full functionality without internet
- **Installable**: Add to home screen
- **Model Caching**: ONNX models cached for offline use
- **Background Sync**: Weather data sync when online

## License

MIT License - Free for agricultural use

## Credits

Built for Maharashtra farmers to detect crop diseases and get weather-based farming advice in Marathi.
