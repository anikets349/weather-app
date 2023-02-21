const API_KEY = 'e6a7b9d25322776f6cef20e87dfcba86';

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

const loadCurrentWeatherInfo = function ({ name, main: { temp, temp_max, temp_min }, weather: [{ description }] }) {
    const currentForecastElement = document.getElementById('current-forecast');
    currentForecastElement.querySelector('.city').textContent = name;
    currentForecastElement.querySelector('.temp').innerHTML = formatTemperature(temp);
    currentForecastElement.querySelector('.desc').textContent = description;
    currentForecastElement.querySelector('.min-max-temp').innerHTML = `High: ${formatTemperature(temp_max)}, Low: ${formatTemperature(temp_min)}`;
};

const loadHourlyForecast = function (hourlyForecast) {
    let hourlyData = hourlyForecast.slice(0, 13);
    const hourlyContainer = document.getElementById('hourly-container');
    let data = ``;
    for (let { dt_txt: time, icon, temp } of hourlyData) {
        data += `
            <article>
                    <h3 class="time">${time.split(' ')[1]}</h3>
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

document.addEventListener('DOMContentLoaded', async function () {
    try {
        const currentWeather = await getCurrentWeatherData();
        console.dir(currentWeather);
        loadCurrentWeatherInfo(currentWeather);
        const hourlyForecast = await getHourlyForecast(currentWeather);
        loadHourlyForecast(hourlyForecast);
        loadFeelsLike(currentWeather);
        loadHumidity(currentWeather);
    } catch (err) {
        console.log('Error: ' + err.message);
    }
});