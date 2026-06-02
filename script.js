// Dom Elements
const elCity = document.getElementById("weather-city");
const elDateTime = document.getElementById("weather-date-time");
const elForecast = document.getElementById("weather-forecast");
const elDescription = document.getElementById("weather-description");
const elIconDiv = document.getElementById("weather-icon-div");
const elTemp = document.getElementById("weather-temp");
const elMinTemp = document.querySelector(".weather_min");
const elMaxTemp = document.querySelector(".weather_max");

// Detail metrics elements
const elFeelsLike = document.querySelector(".weather_feelsLike");
const elHumidity = document.querySelector(".weather_humidity");
const elHumidityBar = document.getElementById("humidity-bar");
const elWind = document.querySelector(".weather_wind");
const elWindGust = document.getElementById("weather-wind-gust");
const elWindDeg = document.querySelector(".weather_winddeg");
const elCompassNeedle = document.getElementById("compass-needle");
const elPressure = document.querySelector(".weather_pressure");
const elPressureLevels = document.getElementById("pressure-levels");
const elCloudsVal = document.getElementById("weather-clouds-val");
const elCloudsBar = document.getElementById("clouds-bar");
const elVisibilityVal = document.getElementById("weather-visibility-val");
const elVisibilityDesc = document.getElementById("visibility-status-desc");
const elSunrise = document.querySelector(".weather_sunrise");
const elSunset = document.querySelector(".weather_sunset");
const elDaylightDesc = document.getElementById("daylight-duration-desc");
const elLat = document.querySelector(".weather_lat");
const elLong = document.querySelector(".weather_long");
const elMapLink = document.getElementById("view-map-link");

// Containers & Layout
const elSearchForm = document.getElementById("search-form");
const elCityInput = document.getElementById("city-input");
const elQuickCities = document.getElementById("quick-cities-container");
const elUnitCheckbox = document.getElementById("unit-checkbox");
const elUnitC = document.getElementById("unit-c");
const elUnitF = document.getElementById("unit-f");
const elLoading = document.getElementById("loading-overlay");
const elErrorCard = document.getElementById("error-card");
const elDashboardContent = document.getElementById("dashboard-content");
const elRetryBtn = document.getElementById("retry-btn");

let cachedWeatherData = null;
let currentUnit = "C";
let searchHistory = ["London", "New York", "Tokyo", "Paris", "Mumbai", "Sydney"];
const API_KEY = "41e27946beea978b29abf01e65e8d655";

const initSearchHistory = () => {
    const saved = localStorage.getItem("skysync_history");
    if (saved) searchHistory = JSON.parse(saved);
    renderQuickCities();
};

const saveSearchHistory = (city) => {
    if (!city) return;
    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    searchHistory = searchHistory.filter(c => c.toLowerCase() !== formattedCity.toLowerCase());
    searchHistory.unshift(formattedCity);
    if (searchHistory.length > 6)
        searchHistory.pop();
    localStorage.setItem("skysync_history", JSON.stringify(searchHistory));
    renderQuickCities();
};

const renderQuickCities = () => {
    elQuickCities.innerHTML = "";
    searchHistory.forEach(city => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "city-chip";
        btn.textContent = city;
        btn.setAttribute("data-city", city);
        elQuickCities.appendChild(btn);
    });
};

const getCountryName = (code) => {
    try {
        return new Intl.DisplayNames(["en"], { type: "region" }).of(code);
    } catch (e) {
        return code;
    }
};

const getDateTime = (dt, timezoneOffset) => {
    const utcTimeMs = (dt + timezoneOffset) * 1000;
    const utcDate = new Date(utcTimeMs);
    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        timeZone: "UTC"
    };
    return new Intl.DateTimeFormat("en-US", options).format(utcDate);
};

const formatTime = (timeSecs, timezoneOffset) => {
    const utcTimeMs = (timeSecs + timezoneOffset) * 1000;
    const utcDate = new Date(utcTimeMs);
    const options = {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "UTC"
    };
    return new Intl.DateTimeFormat("en-US", options).format(utcDate);
};

const getDaylightDuration = (sunrise, sunset) => {
    const diff = sunset - sunrise;
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return `${hours} hours and ${minutes} minutes`;
};

const getWeatherIcon = (id, iconCode) => {
    const isNight = iconCode.endsWith('n');
    if (id >= 200 && id < 300)
        return `<i class="fa-solid fa-cloud-bolt weather-main-icon" style="color: #f59e0b;"></i>`;
    if (id >= 300 && id < 400)
        return `<i class="fa-solid fa-cloud-drizzle weather-main-icon" style="color: #60a5fa;"></i>`;
    if (id >= 500 && id < 600)
        return `<i class="fa-solid fa-cloud-showers-heavy weather-main-icon" style="color: #3b82f6;"></i>`;
    if (id >= 600 && id < 700)
        return `<i class="fa-solid fa-snowflake weather-main-icon" style="color: #a5f3fc; animation: spin 8s linear infinite;"></i>`;
    if (id >= 700 && id < 800)
        return `<i class="fa-solid fa-smog weather-main-icon" style="color: #cbd5e1;"></i>`;
    if (id === 800)
        return isNight
            ? `<i class="fa-solid fa-moon weather-main-icon" style="color: #e2e8f0;"></i>`
            : `<i class="fa-solid fa-sun weather-main-icon" style="color: #f59e0b; animation: spin 20s linear infinite;"></i>`;
    if (id >= 801 && id < 805)
        return isNight
            ? `<i class="fa-solid fa-cloud-moon weather-main-icon" style="color: #94a3b8;"></i>`
            : `<i class="fa-solid fa-cloud-sun weather-main-icon" style="color: #fbbf24;"></i>`;
    return `<i class="fa-solid fa-cloud weather-main-icon"></i>`;
};

const getThemeClass = (id, iconCode) => {
    const isNight = iconCode.endsWith('n');
    if (isNight) return 'weather-night';
    if (id >= 200 && id < 300) return 'weather-thunderstorm';
    if (id >= 300 && id < 600) return 'weather-rain';
    if (id >= 600 && id < 700) return 'weather-snow';
    if (id >= 700 && id < 800) return 'weather-mist';
    if (id === 800) return 'weather-clear';
    if (id >= 801 && id < 805) return 'weather-clouds';
    return '';
};

const formatTemp = (celsiusVal) => {
    if (currentUnit === "F") {
        const fahr = (celsiusVal * 9 / 5) + 32;
        return `${fahr.toFixed(0)}°F`;
    }
    return `${celsiusVal.toFixed(0)}°C`;
};

const formatWindSpeed = (speedMs) => {
    if (currentUnit === "F") {
        const speedMph = speedMs * 2.23694;
        return `${speedMph.toFixed(1)} mph`;
    }
    return `${speedMs.toFixed(1)} m/s`;
};

const formatVisibility = (meters) => {
    const km = meters / 1000;
    if (currentUnit === "F") {
        const miles = km * 0.621371;
        return `${miles.toFixed(1)} miles`;
    }
    return `${km.toFixed(1)} km`;
};

const getVisibilityStatus = (meters) => {
    if (meters >= 9000) return "Excellent view";
    if (meters >= 6000) return "Good clear view";
    if (meters >= 3000) return "Moderate haze";
    return "Low visibility / Fog";
};

// Render Weather Data UI
const displayWeatherData = () => {
    if (!cachedWeatherData) return;
    const d = cachedWeatherData;
    const timezone = d.timezone;
    elCity.textContent = `${d.name}, ${getCountryName(d.sys.country)}`;
    elDateTime.textContent = getDateTime(d.dt, timezone);
    elForecast.textContent = d.weather[0].main;
    elDescription.textContent = d.weather[0].description;
    elIconDiv.innerHTML = getWeatherIcon(d.weather[0].id, d.weather[0].icon);
    elTemp.innerHTML = formatTemp(d.main.temp);
    elMinTemp.innerHTML = `Min: ${formatTemp(d.main.temp_min)}`;
    elMaxTemp.innerHTML = `Max: ${formatTemp(d.main.temp_max)}`;
    elFeelsLike.innerHTML = formatTemp(d.main.feels_like);
    elHumidity.innerHTML = `${d.main.humidity}%`;
    elHumidityBar.style.width = `${d.main.humidity}%`;

    // Wind Info & compass arrow
    elWind.innerHTML = formatWindSpeed(d.wind.speed);
    if (d.wind.gust !== undefined) {
        elWindGust.textContent = `Gust: ${formatWindSpeed(d.wind.gust)}`;
        elWindGust.classList.remove("hidden");
    } else {
        elWindGust.classList.add("hidden");
    }
    elWindDeg.innerHTML = `${d.wind.deg}°`;
    elCompassNeedle.style.transform = `rotate(${d.wind.deg - 45}deg)`;
    elPressure.innerHTML = `${d.main.pressure} hPa`;

    let levelsHtml = "";
    if (d.main.sea_level)
        levelsHtml += `<span>Sea Level: <strong>${d.main.sea_level} hPa</strong></span>`;
    if (d.main.grnd_level)
        levelsHtml += `<span>Ground Level: <strong>${d.main.grnd_level} hPa</strong></span>`;
    elPressureLevels.innerHTML = levelsHtml;

    elCloudsVal.innerHTML = `${d.clouds.all}%`;
    elCloudsBar.style.width = `${d.clouds.all}%`;

    elVisibilityVal.innerHTML = formatVisibility(d.visibility);
    elVisibilityDesc.innerHTML = getVisibilityStatus(d.visibility);

    elSunrise.innerHTML = formatTime(d.sys.sunrise, timezone);
    elSunset.innerHTML = formatTime(d.sys.sunset, timezone);
    elDaylightDesc.innerHTML = `Daylight duration: <strong>${getDaylightDuration(d.sys.sunrise, d.sys.sunset)}</strong>`;

    elLat.innerHTML = d.coord.lat.toFixed(4);
    elLong.innerHTML = d.coord.lon.toFixed(4);
    elMapLink.href = `https://www.google.com/maps/search/?api=1&query=${d.coord.lat},${d.coord.lon}`;

    const bodyClass = getThemeClass(d.weather[0].id, d.weather[0].icon);
    document.body.className = "";
    if (bodyClass) document.body.classList.add(bodyClass);

};

// Fetchers
const getWeatherDataByCity = async (city) => {
    showLoading(true);
    hideError();
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Location not found (${res.status})`);
        const data = await res.json();
        cachedWeatherData = data;
        saveSearchHistory(data.name);
        displayWeatherData();
    } catch (error) {
        console.error(error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
};

const getWeatherDataByCoords = async (lat, lon) => {
    showLoading(true);
    hideError();
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Location not found (${res.status})`);
        const data = await res.json();
        cachedWeatherData = data;
        displayWeatherData();
    } catch (error) {
        console.error(error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
};

// Loading / Error UI States
const showLoading = (isLoading) => {
    if (isLoading) {
        elLoading.classList.remove("hidden");
        elDashboardContent.style.opacity = "0.3";
    } else {
        elLoading.classList.add("hidden");
        elDashboardContent.style.opacity = "1";
    }
};

const showError = (msg) => {
    elErrorCard.classList.remove("hidden");
    elDashboardContent.classList.add("hidden");
    if (msg) document.getElementById("error-message").textContent = msg;

};

const hideError = () => {
    elErrorCard.classList.add("hidden");
    elDashboardContent.classList.remove("hidden");
};

// Geolocation Trigger
const triggerGeolocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                getWeatherDataByCoords(pos.coords.latitude, pos.coords.longitude);
            },
            (err) => {
                console.warn(`Geolocation failed: ${err.message}. Loading default city.`);
                getWeatherDataByCity("jaipur");
            },
            { timeout: 8000 }
        );
    } else {
        getWeatherDataByCity("jaipur");
    }
};

// Event Listeners
elSearchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = elCityInput.value.trim();
    if (q) {
        getWeatherDataByCity(q);
        elCityInput.value = "";
    }
});

elQuickCities.addEventListener("click", (e) => {
    const chip = e.target.closest(".city-chip");
    if (chip) {
        const city = chip.getAttribute("data-city");
        getWeatherDataByCity(city);
    }
});

elUnitCheckbox.addEventListener("change", (e) => {
    currentUnit = e.target.checked ? "F" : "C";
    if (currentUnit === "C") {
        elUnitC.classList.add("active");
        elUnitF.classList.remove("active");
    } else {
        elUnitC.classList.remove("active");
        elUnitF.classList.add("active");
    }
    displayWeatherData();
});

elRetryBtn.addEventListener("click", () => {
    hideError();
    triggerGeolocation();
});

// Initialization
const initFooterYear = () => {
    const yearEl = document.getElementById("current-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

};

document.addEventListener("DOMContentLoaded", () => {
    initFooterYear();
    initSearchHistory();
    triggerGeolocation();
});