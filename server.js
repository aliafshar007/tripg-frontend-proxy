const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const fs = require("fs");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Load service account credentials
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "1g9BA_jTMjSHJei1ODaIrt6u5WAU_v7eVajqhsGzE9QA"; // Your real spreadsheet ID
const RANGE = "Sheet1!A1:Z1000"; // Adjust range as needed

app.get("/api/trip-data", async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values || [];
    res.json({ data: rows });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data from Google Sheets");
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running securely on port ${PORT}`);
});