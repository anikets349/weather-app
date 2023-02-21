const API_KEY = 'e6a7b9d25322776f6cef20e87dfcba86';

const getCurrentWeatherData = async function () {
    const city = 'belagavi';
    const response = await fetch(`https://apii.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
    return response.json();
};

const formatTemperature = function (temp) {
    return `<span>${temp.toFixed(1)}&deg;C</span>`;
};

const loadCurrentWeatherInfo = function ({ name, main: { temp, temp_max, temp_min }, weather: [{ description }] }) {
    const currentForecastElement = document.getElementById('current-forecast');
    console.log(currentForecastElement);
    currentForecastElement.querySelector('.city').textContent = name;
    currentForecastElement.querySelector('.temp').innerHTML = formatTemperature(temp);
    currentForecastElement.querySelector('.desc').textContent = description;
    currentForecastElement.querySelector('.min-max-temp').innerHTML = `High: ${formatTemperature(temp_max)}, Low: ${formatTemperature(temp_min)}`;
};

document.addEventListener('DOMContentLoaded', async function () {
    try {
        const currentWeather = await getCurrentWeatherData();
        console.dir(currentWeather);
        loadCurrentWeatherInfo(currentWeather);
    } catch (err) {
        console.log('Error: ' + err.message);
    }
});