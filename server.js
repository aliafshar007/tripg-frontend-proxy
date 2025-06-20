import express from "express";
import cors from "cors";
import { google } from "googleapis";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Load service account credentials from base64 env variable
const credentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "1g9BA_jTMjSHJei1ODaIrt6u5WAU_v7eVajqhsGzE9QA";
const RANGE = "part1!A1:Z1000";

let cachedData = null;

async function loadFullData() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  const rows = response.data.values || [];
  if (rows.length === 0) {
    console.error("No data found.");
    return [];
  }
  const headers = rows[0];
  cachedData = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || null;
    });
    return obj;
  });

  console.log("Data loaded.");
}

loadFullData().catch(console.error);

// API for filtering data
app.post("/api/filter", (req, res) => {
  const { category, title, landuse, day, period } = req.body;

  if (!cachedData) {
    return res.status(500).json({ error: "Data not loaded." });
  }

  const filtered = cachedData.filter(row =>
    (!category || row["Category"] === category) &&
    (!title || row["Title"] === title) &&
    (!landuse || row["Landuse"] === landuse) &&
    (!day || row["Day"] === day) &&
    (!period || row["Period"] === period)
  );

  res.json({ data: filtered });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
