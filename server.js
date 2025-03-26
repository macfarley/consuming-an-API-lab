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
      const date = convertTimestampToDate(forecastData.list[i].dt);

      //if that key is not inside daysInArray, push in
          //create a new object with forecastData
          {
            "date":"YYYY-MM-DD",
            "weather":"cloudy",
            "high":283,
            "average":270,
            "dayOfWeek":"Monday"
            }
          //push the key into daysInArray
          //push data object into weatherDataByDay
    }
  // {day of the week: Thursday,
  //   date: mm/dd/yyyy,
  //   high temperature: 001 F,
  //   weather: description,
  // }

    res.render("./weather/show.ejs", { weather: weatherData, times: timeArray });
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