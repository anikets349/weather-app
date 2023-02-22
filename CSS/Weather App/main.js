const API_KEY = 'e6a7b9d25322776f6cef20e87dfcba86';
const DAYS_OF_THE_WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const getCurrentWeatherData = async function () {
    const city = 'belagavi';
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
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

const formatTemperature = function (temp) {
    return `<span>${temp?.toFixed(1)}&deg;C</span>`;
};

const createImgUrl = function (icon) {
    return `http://openweathermap.org/img/wn/${icon}@2x.png`;
}

const computeDayWiseForecast = function (hourlyForecast) {
    let dayWiseForecast = new Map();
    for (let forecast of hourlyForecast) {
        const [date] = forecast.dt_txt.split(' ');
        const dayOfTheWeek = DAYS_OF_THE_WEEK[new Date(date).getDay()];
        console.log(dayOfTheWeek);
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
    console.log(dayWiseForecast);
    return dayWiseForecast;
};

const loadCurrentWeatherInfo = function ({ name, main: { temp, temp_max, temp_min }, weather: [{ description }] }) {
    const currentForecastElement = document.getElementById('current-forecast');
    currentForecastElement.querySelector('.city').textContent = name;
    currentForecastElement.querySelector('.temp').innerHTML = formatTemperature(temp);
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
            <p class="temp">${formatTemperature(curTemp)}</p>
        </article>
    `;
    for (let { dt_txt: time, icon, temp } of hourlyData) {
        data += `
            <article>
                    <h3 class="time">${timeFormatter.format(new Date(time))}</h3>
                    <img class="icon" src="${createImgUrl(icon)}" alt="Current Weather icon">
                    <p class="temp">${formatTemperature(temp)}</p>
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
        <span>${humidity}gm<sup>-3</sup></span>
    `;
};

const loadFiveDayForecast = function (hourlyForecast) {
    console.log(hourlyForecast);
    const dayWiseForecast = computeDayWiseForecast(hourlyForecast);
    const container = document.querySelector('.five-day-forecast-container');
    let dayWiseInfo = "";
    Array.from(dayWiseForecast).map(([day, { temp_max, temp_min, icon }], index) => {
        if (index < 5) {
            dayWiseInfo += `
            <article class="day-wise-forecast">
                <h3>${index === 0 ? "Today" : day}</h3>
                <img class="icon" src="${createImgUrl(icon)}" alt="">
                    <p class="min-temp">${formatTemperature(temp_min)}</p>
                    <p class="max-temp">${formatTemperature(temp_max)}</p>
            </article>
            `;
        }
    });
    container.innerHTML = dayWiseInfo;
};

document.addEventListener('DOMContentLoaded', async function () {
    try {
        const currentWeather = await getCurrentWeatherData();
        console.dir(currentWeather);
        loadCurrentWeatherInfo(currentWeather);
        const hourlyForecast = await getHourlyForecast(currentWeather);
        loadHourlyForecast(currentWeather, hourlyForecast);
        loadFiveDayForecast(hourlyForecast);
        loadFeelsLike(currentWeather);
        loadHumidity(currentWeather);
    } catch (err) {
        console.log('Error: ' + err.message);
    }
});