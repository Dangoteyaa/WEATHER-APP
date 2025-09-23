const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const unitsDropdown = document.getElementById("units");

async function fetchWeather(city = "London", units = "metric") {
  try {
    // Geocoding
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      alert("City not found!");
      return;
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    // Unit handling
    const tempUnit = units === "metric" ? "celsius" : "fahrenheit";
    const windUnit = units === "metric" ? "kmh" : "mph";

    // Weather API
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&hourly=temperature_2m,weathercode&temperature_unit=${tempUnit}&windspeed_unit=${windUnit}&timezone=auto`;
    const weatherRes = await fetch(url);
    const weatherData = await weatherRes.json();

    renderCurrentWeather(weatherData, name, country);
    renderDailyForecast(weatherData);
    renderHourlyForecast(weatherData, 0);
    renderDaySelector(weatherData);
  } catch (err) {
    console.error(err);
    alert("Failed to fetch weather.");
  }
}

function renderCurrentWeather(data, name, country) {
  const current = data.current_weather;
  document.getElementById("locationName").textContent = `${name}, ${country}`;
  document.getElementById("date").textContent = new Date().toDateString();
  document.getElementById("currentTemp").textContent = `${current.temperature}°`;

  document.getElementById("feelsLike").textContent = `${current.temperature}°`;
  document.getElementById("humidity").textContent = `${data.hourly.relativehumidity_2m ? data.hourly.relativehumidity_2m[0] : 46}%`;
  document.getElementById("wind").textContent = `${current.windspeed} ${data.hourly_units.windspeed_10m}`;
  document.getElementById("precip").textContent = `${data.hourly.precipitation ? data.hourly.precipitation[0] : 0} mm`;
}

function renderDailyForecast(data) {
  const grid = document.getElementById("dailyForecastGrid");
  grid.innerHTML = data.daily.time.map((day, i) => `
    <div class="daily-card">
      <p>${new Date(day).toLocaleDateString("en-US", { weekday: "short" })}</p>
      <p>${data.daily.temperature_2m_max[i]}° / ${data.daily.temperature_2m_min[i]}°</p>
    </div>
  `).join("");
}

function renderHourlyForecast(data, dayIndex) {
  const grid = document.getElementById("hourlyForecastGrid");
  grid.innerHTML = "";
  const start = dayIndex * 24;
  const end = start + 24;
  for (let i = start; i < end; i++) {
    grid.innerHTML += `
      <div class="hourly-card">
        <p>${data.hourly.time[i].split("T")[1]}</p>
        <p>${data.hourly.temperature_2m[i]}°</p>
      </div>
    `;
  }
}

function renderDaySelector(data) {
  const selector = document.getElementById("daySelector");
  selector.innerHTML = data.daily.time.map((day, i) => `
    <button onclick="renderHourlyForecast(window.weatherData, ${i})">${day}</button>
  `).join("");
  window.weatherData = data; // Save globally for reuse
}

// Event listeners
searchBtn.addEventListener("click", () => {
  const city = searchInput.value.trim();
  const units = unitsDropdown.value;
  if (city) fetchWeather(city, units);
});

unitsDropdown.addEventListener("change", () => {
  const city = searchInput.value.trim() || "London";
  fetchWeather(city, unitsDropdown.value);
});

// Default
fetchWeather();
