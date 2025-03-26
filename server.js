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
  const zipCode = req.body.zipCode;
  const apiKey = process.env.API_KEY;
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?zip=${zipCode},us&units=imperial&appid=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    const weatherData = await response.json();
    res.render("./weather/show.ejs", { weather: weatherData });
    // console.log(weather);
  } catch (error) {
    console.error("Invalid Zip Code", error);
    res.status(500).send("Error retrieving weather data");
  }
});


//when the server is running
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Server is running on ", port);
});