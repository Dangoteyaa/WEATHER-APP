/* Simple dark-themed weather app adapted to the provided mockup.
   Uses open-meteo geocoding + forecast APIs.
*/

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const unitsSelect = document.getElementById('unitsSelect');

const locationNameEl = document.getElementById('locationName');
const dateTextEl = document.getElementById('dateText');
const currentTempEl = document.getElementById('currentTemp');
const currentIconEl = document.getElementById('currentIcon');
const feelsLikeEl = document.getElementById('feelsLike');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const precipEl = document.getElementById('precip');

const dailyGrid = document.getElementById('dailyForecastGrid');
const hourlyGrid = document.getElementById('hourlyForecastGrid');
const daySelector = document.getElementById('daySelector');

let latestWeather = null; // keep data for interactivity
let latestLocation = { name: 'London', country: '' };

/* Map Open-Meteo weathercode to emoji icon (simple, replace with SVG if you prefer) */
function weatherCodeToEmoji(code) {
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '🌤️';
  if (code === 3) return '⛅';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌦️';
  if (code >= 80 && code <= 82) return '🌧️';
  if (code >= 71 && code <= 77) return '🌨️';
  if (code >= 95) return '⛈️';
  return '☁️';
}

/* Find indices of hourly array for a given date string (YYYY-MM-DD) */
function hourlyIndicesForDate(weatherData, dayDate) {
  const times = weatherData.hourly.time;
  const indices = [];
  for (let i = 0; i < times.length; i++) {
    if (times[i].startsWith(dayDate)) indices.push(i);
  }
  return indices;
}

/* Render current weather card + metrics */
function renderCurrentWeather(data, name, country) {
  latestWeather = data;
  latestLocation = { name, country };

  const current = data.current_weather;
  locationNameEl.textContent = `${name}${country ? ', ' + country : ''}`;
  dateTextEl.textContent = new Date(current.time).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  currentTempEl.textContent = `${Math.round(current.temperature)}°`;
  currentIconEl.textContent = weatherCodeToEmoji(current.weathercode);

  // Feels like - Open-Meteo doesn't provide "feels like" in current_weather; approximate with current temp
  feelsLikeEl.textContent = `${Math.round(current.temperature)}°`;

  // For humidity/precip/wind we use hourly arrays: find current hour index
  const nowIso = current.time; // e.g., "2025-08-05T14:00"
  const hrIndex = data.hourly.time.indexOf(nowIso);
  const humidity = hrIndex >= 0 && data.hourly.relativehumidity_2m ? data.hourly.relativehumidity_2m[hrIndex] : null;
  const precip = hrIndex >= 0 && data.hourly.precipitation ? data.hourly.precipitation[hrIndex] : null;
  const wind = current.windspeed;

  humidityEl.textContent = humidity !== null ? `${Math.round(humidity)}%` : '—';
  precipEl.textContent = precip !== null ? `${precip} mm` : '—';
  windEl.textContent = wind !== undefined ? `${Math.round(wind)} ${data.hourly_units ? data.hourly_units.windspeed_10m : ''}` : '—';
}

/* Render daily forecast (small horizontal cards) */
function renderDailyForecast(data) {
  const days = data.daily.time;
  dailyGrid.innerHTML = days.map((d, i) => {
    const max = Math.round(data.daily.temperature_2m_max[i]);
    const min = Math.round(data.daily.temperature_2m_min[i]);
    const wc = data.daily.weathercode ? data.daily.weathercode[i] : 0;
    const short = new Date(d).toLocaleDateString(undefined, { weekday: 'short' });
    return `
      <div class="daily-item">
        <div class="day">${short}</div>
        <d
