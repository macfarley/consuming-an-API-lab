const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const ejs = require("ejs");
const { JSDOM } = require("jsdom");

const app = express();

//middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


//request paths
//landing page
app.get("/", (req, res) => {
  res.render("index.ejs");
});

//post request by zip code using submit button
//listen for the submit button and run a post request
const document = new JSDOM(`<!DOCTYPE html>`).window.document;
document.body.innerHTML = `
  <input type="text" id="zipCode" placeholder="Enter Zip Code" />
  <button id="submit">Submit</button>
`;  

const submitButton = document.getElementById("submit");
submitButton.addEventListener("click", (event) => {
  const zipCode = document.getElementById("zipCode").value;
  fetch("/weather", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ zipCode }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    });
});
app.post("/weather", async (req, res) => {
  const zipCode = req.body.ZipCode;
  const apiKey = process.env.API_KEY;
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?zip=${zipCode},us&units=imperial&appid=${apiKey}`;
  const fiveDayApiUrl = `https://api.openweathermap.org/data/2.5/forecast?zip=${zipCode},us&appid=${apiKey}`;
  try {
    const response = await fetch(apiUrl);
    const forecastResponse = await fetch(fiveDayApiUrl);
    const forecastData = await forecastResponse.json();
    const weatherData = await response.json();
    
    function convertTimestampToDate(timestampObject) {
      const date = new Date(timestampObject * 1000);
      return date;
      }

    // for each date in the forecast object, i want a Daily high temperature, and if it will rain, be cloudy, or clear
    const timeArray = forecastData.list.map(timestamp => {
      return convertTimestampToDate(timestamp.dt);
    });
    const daysInArray = []
    const weatherDataByDay = []
    for(let i = 0; i< forecastData.list.length; i++){
      //extract month and day from a date to make a key MM-DD
      const date = forecastData.list[i].dt_txt;
      const dateObject = new Date(date);
      const month = (dateObject.getMonth() + 1).toString().padStart(2, "0");
      const day = dateObject.getDate().toString().padStart(2, "0");
      const key = `${month}-${day}`;
      //if that key is not inside daysInArray, push in
      if(!daysInArray.includes(key)){
        daysInArray.push(key);
        }
        // Limit the daysInArray to 5 unique days
        if (daysInArray.length > 5) break;

        // Check if the key already exists in weatherDataByDay
        const existingDay = weatherDataByDay.find(day => day.date === key);
        if (existingDay) {
            // Append the weather description to the existing day's description if it doesn't already exist
            if (!existingDay.weather.includes(forecastData.list[i].weather[0].description)) {
            existingDay.weather += `, ${forecastData.list[i].weather[0].description}`;
            }
          continue;
        }
        //create a new object with forecastData
      const dataObject = {
        date: key,
        weather: forecastData.list[i].weather[0].description,
        high: ((forecastData.list[i].main.temp_max - 273.15) * 9/5 + 32).toFixed(2),
        average: ((forecastData.list[i].main.temp - 273.15) * 9/5 + 32).toFixed(2),
        dayOfWeek: new Date(date).toLocaleDateString("en-US", { weekday: "long" })
      };
      weatherDataByDay.push(dataObject);
    }

    res.render("./weather/show.ejs", { weather: weatherData, weatherDataByDay, daysInArray});
  } catch (error) {
    console.error("Invalid Zip Code", error);
    res.status(500).send("Error retrieving weather data");
  }
});
// five day forecast by city name

//when the server is running
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Server is running on ", port);
});