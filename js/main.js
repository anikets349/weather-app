import API_KEY from './apiKey.js';
import {
    TEMP_UNITS,
    DAYS_OF_THE_WEEK,
    COMPASS_SECTOR,
    IMG_URL
} from "../utils/constants.js";

let displayTempInUnit = TEMP_UNITS.METRIC;

const convertTemperature = function (temp, toUnit) {
    let convertedTemp;
    if (toUnit === TEMP_UNITS.METRIC) {
        // convert temp in F to C
        convertedTemp = 5 / 9 * (temp - 32);
    } else if (toUnit === TEMP_UNITS.IMPERIAL) {
        // convert temp in C to F
        convertedTemp = 9 / 5 * temp + 32;
    }
    return formatTemperature(convertedTemp, toUnit);
}

const changeTempInDOM = function () {
    const tempContainer = document.querySelectorAll('[data-about]');
    for (let parent of tempContainer) {
        const tempFields = parent.querySelectorAll('span');
        for (let child of tempFields) {
            let result;
            const temp = child.innerText;
            // parseFloat(tempStr.slice(0, tempStr.indexOf('°F'))
            if (temp?.includes(TEMP_UNITS.METRIC)) {
                // temp is in C, convert to F
                const tempMagnitude = temp.slice(0, temp.indexOf(TEMP_UNITS.METRIC));
                result = convertTemperature(tempMagnitude, TEMP_UNITS.IMPERIAL);
            } else if (temp?.includes(TEMP_UNITS.IMPERIAL)) {
                // temp is in F, convert to C
                const tempMagnitude = temp.slice(0, temp.indexOf(TEMP_UNITS.IMPERIAL));
                result = convertTemperature(tempMagnitude, TEMP_UNITS.METRIC);
            }
            if (result) {
                child.innerHTML = result;
            }
        }
    }
}

const changeTempUnitBtn = document.querySelector('.change-temp-unit-btn');
changeTempUnitBtn.addEventListener('click', () => {
    if (displayTempInUnit === TEMP_UNITS.METRIC) {
        displayTempInUnit = TEMP_UNITS.IMPERIAL;
        changeTempUnitBtn.innerText = 'Change to metric units';
    } else if (displayTempInUnit === TEMP_UNITS.IMPERIAL) {
        displayTempInUnit = TEMP_UNITS.METRIC;
        changeTempUnitBtn.innerText = 'Change to imperial units';
    }
    changeTempInDOM();
});

let selectedCityText;
// object to store the city lat, lon, name
let selectedCity;

const getCitiesUsingGeolocation = async function (searchText) {
    const response = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${searchText}&limit=5&appid=${API_KEY}`);
    return response.json();
};

const getCurrentWeatherData = async function ({ lat, lon, name }) {
    const url = (lat && lon) ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric` : `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);
    return response.json();
};

const getHourlyForecast = async function ({ name: city }) {
    const response = await fetch(`http://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
    const data = await response.json();
    return data.list.map(obj => {
        const { dt, dt_txt, main: { temp, temp_max, temp_min }, weather: [{ description, icon }] } = obj;
        return { dt, dt_txt, temp, temp_max, temp_min, description, icon };
    });
};

const formatTemperature = function (temp, unit = TEMP_UNITS.METRIC) {
    return `<span>${temp?.toFixed(1)}${unit}</span>`;
};

const createImgUrl = function (icon) {
    return `${IMG_URL}/${icon}@2x.png`;
}

const computeDayWiseForecast = function (hourlyForecast) {
    let dayWiseForecast = new Map();
    for (let forecast of hourlyForecast) {
        const [date] = forecast.dt_txt.split(' ');
        const dayOfTheWeek = DAYS_OF_THE_WEEK[new Date(date).getDay()];
        if (dayWiseForecast.has(dayOfTheWeek)) {
            let forecastForTheDay = dayWiseForecast.get(dayOfTheWeek);
            forecastForTheDay.push(forecast);
            dayWiseForecast.set(dayOfTheWeek, forecastForTheDay);
        } else {
            dayWiseForecast.set(dayOfTheWeek, [forecast]);
        }
    }
    for (let [key, value] of dayWiseForecast) {
        let minTemp = Math.min(...Array.from(value, val => val.temp_min));
        let maxTemp = Math.min(...Array.from(value, val => val.temp_max));
        dayWiseForecast.set(key, { temp_min: minTemp, temp_max: maxTemp, icon: value.find(v => v.icon).icon });
    }
    return dayWiseForecast;
};

const computeWindDirection = function (windDirInDeg) {
    return COMPASS_SECTOR[(windDirInDeg / 22.5).toFixed(0)];
}

const getWindSpeedAndDir = function (windSpeed, windDirInDeg) {
    const windDir = computeWindDirection(windDirInDeg);
    return `Wind speed: ${windSpeed}m/s, Direction: ${windDir}`;
}

const loadCurrentWeatherInfo = function ({ name, main: { temp, temp_max, temp_min }, weather: [{ description }], wind: { speed, deg } }) {
    const currentForecastElement = document.getElementById('current-forecast');
    currentForecastElement.querySelector('.city').textContent = name;
    currentForecastElement.querySelector('.temp').innerHTML = formatTemperature(temp);
    currentForecastElement.querySelector('.wind-speed-dir').innerHTML = getWindSpeedAndDir(speed, deg);
    currentForecastElement.querySelector('.desc').textContent = description;
    currentForecastElement.querySelector('.min-max-temp').innerHTML = `High: ${formatTemperature(temp_max)}, Low: ${formatTemperature(temp_min)}`;
};

const loadHourlyForecast = function ({ main: { temp: curTemp }, weather: [{ icon: curIcon }] }, hourlyForecast) {
    const timeFormatter = Intl.DateTimeFormat('en', {
        hour12: true,
        hour: "numeric"
    });
    let hourlyData = hourlyForecast.slice(5, 14);
    const hourlyContainer = document.getElementById('hourly-container');
    let data = `
        <article>
            <h3 class="time">Now</h3>
            <img class="icon" src="${createImgUrl(curIcon)}" alt="Current Weather icon">
            <p class="temp" data-about="temperature">${formatTemperature(curTemp)}</p>
        </article>
    `;
    for (let { dt_txt: time, icon, temp } of hourlyData) {
        data += `
            <article>
                    <h3 class="time">${timeFormatter.format(new Date(time))}</h3>
                    <img class="icon" src="${createImgUrl(icon)}" alt="Current Weather icon">
                    <p class="temp" data-about="temperature">${formatTemperature(temp)}</p>
                </article>
        `;
        hourlyContainer.innerHTML = data;
    }
};

const loadFeelsLike = function ({ main: { feels_like } }) {
    const container = document.getElementById('feels-like');
    container.querySelector('.temp').innerHTML = formatTemperature(feels_like);
};

const loadHumidity = function ({ main: { humidity } }) {
    const container = document.getElementById('humidity');
    container.querySelector('.humidity-value').innerHTML = `
        <span>${humidity}%</span>
    `;
};

const loadFiveDayForecast = function (hourlyForecast) {
    const dayWiseForecast = computeDayWiseForecast(hourlyForecast);
    const container = document.querySelector('.five-day-forecast-container');
    let dayWiseInfo = "";
    Array.from(dayWiseForecast).map(([day, { temp_max, temp_min, icon }], index) => {
        if (index < 5) {
            dayWiseInfo += `
            <article class="day-wise-forecast">
                <h3>${index === 0 ? "Today" : day}</h3>
                <img class="icon" src="${createImgUrl(icon)}" alt="">
                    <p class="min-temp" data-about="temperature">${formatTemperature(temp_min)}</p>
                    <p class="max-temp" data-about="temperature">${formatTemperature(temp_max)}</p>
            </article>
            `;
        }
    });
    container.innerHTML = dayWiseInfo;
};

const debounce = function (func) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            console.log('debounce');
            func.apply(this, args);
        }, 500);
    };
};

const onSearchChange = async function ({ target: { value } }) {
    console.log(value);
    if (!value) {
        selectedCity = null;
        selectedCityText = '';
    }
    if (value && (value !== selectedCityText)) {
        const listOfCities = await getCitiesUsingGeolocation(value);
        let options = "";
        for (let { lat, lon, name, state, country } of listOfCities) {
            options += `<option data-city-details='${JSON.stringify({ lat, lon, name })}' value="${name}, ${state}, ${country}"></option>`;
        }
        document.querySelector('#cities').innerHTML = options;

    }
};

const debounceSearch = debounce((event) => {
    onSearchChange(event);
});

const handleCitySelection = function (event) {
    selectedCityText = event.target.value;
    let options = document.querySelectorAll('#cities > option');
    if (options?.length) {
        let selectedOption = Array.from(options).find(option => option.value === selectedCityText);
        selectedCity = JSON.parse(selectedOption.getAttribute('data-city-details'));
        loadData();
    }
};

const loadData = async function () {
    const currentWeather = await getCurrentWeatherData(selectedCity);
    loadCurrentWeatherInfo(currentWeather);
    const hourlyForecast = await getHourlyForecast(currentWeather);
    loadHourlyForecast(currentWeather, hourlyForecast);
    loadFiveDayForecast(hourlyForecast);
    loadFeelsLike(currentWeather);
    loadHumidity(currentWeather);
};

const successCallback = function ({ coords }) {
    const { latitude: lat, longitude: lon } = coords;
    selectedCity = { lat, lon };
    loadData()
        .catch((err) => {
            alert('Error: ' + err.message);
        });
}

const errorCallback = function (error) {
    alert('You denied the location permission!\nSearch for the city in the search bar to fetch weather information!');
}

const loadForecastUsingClientGeolocation = function () {
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
};

document.addEventListener('DOMContentLoaded', async function () {
    try {
        loadForecastUsingClientGeolocation();
        const searchInput = document.querySelector('#search');
        // populate datalist with suggestions based on the search query
        searchInput.addEventListener('input', debounceSearch);
        // load city specific weather data after city selection
        searchInput.addEventListener('change', handleCitySelection);

    } catch (err) {
        alert('Error: ' + err.message);
    }
});