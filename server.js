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

let cachedData = [];

async function loadData() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  const rows = response.data.values || [];
  if (rows.length === 0) {
    console.error("No data found.");
    return;
  }
  const headers = rows[0];
  cachedData = rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || null;
    });
    return obj;
  });

  console.log("Data loaded.");
}

loadData().catch(console.error);

// Fully protected main endpoint (final results)
app.post("/api/filter", (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.SECRET_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { category, title, landuse, day, period } = req.body;

  const filtered = cachedData.filter(
    (row) =>
      (!category || row["Category"] === category) &&
      (!title || row["Title"] === title) &&
      (!landuse || row["Landuse"] === landuse) &&
      (!day || row["Day"] === day) &&
      (!period || row["Period"] === period)
  );

  const responseData = filtered.map((row) => ({
    iteCode: row["ITE code"],
    adjFactor: row["Adj Factor"],
    avgRate: row["Avg Rate"],
    studies: row["Studies"],
    percentEnter: row["% Enter"],
    percentExit: row["% Exit"],
    equation: row["Equation"],
  }));

  res.json({ data: responseData });
});

// New endpoint: Filter Options (for frontend dynamic filters)
app.post("/api/filter/options", (req, res) => {
  const { category, title, landuse, day, period } = req.body;

  const filtered = cachedData.filter(
    (row) =>
      (!category || row["Category"] === category) &&
      (!title || row["Title"] === title) &&
      (!landuse || row["Landuse"] === landuse) &&
      (!day || row["Day"] === day) &&
      (!period || row["Period"] === period)
  );

  const extractUnique = (key) =>
    [...new Set(filtered.map((row) => row[key]).filter(Boolean))].sort();

  res.json({
    categories: extractUnique("Category"),
    titles: extractUnique("Title"),
    landuses: extractUnique("Landuse"),
    days: extractUnique("Day"),
    periods: extractUnique("Period"),
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
