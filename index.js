const express = require("express");
const { google } = require("googleapis");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;



// Cấu hình middleware
app.use(bodyParser.json());
app.use(cors());
require('dotenv').config({ path: './.env' });

let credentials;
try {
  credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);

  // Xử lý private_key để thay thế \\n thành xuống dòng thực tế
  credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
} catch (error) {
  console.error("Error parsing GOOGLE_SHEETS_CREDENTIALS:", error.message);
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// ID của Google Sheets
const SPREADSHEET_ID = "1UwNCfnMGOo72LBcvAgysbLH3SATBICfPQ5NO0oDYzDg";

// API: Ghi dữ liệu vào Google Sheets
app.get("/", (req, res) => {
  res.send("Welcome to Google Sheets Backend API");
});

app.post("/write", async (req, res) => {
  try {
    const { range, values } = req.body;
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: "RAW",
      resource: {
        values: [values],
      },
    });

    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error("Error writing to sheet:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Đọc dữ liệu từ Google Sheets
app.get("/read", async (req, res) => {
  try {
    const { range } = req.query;
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    res.status(200).json({ success: true, data: response.data.values });
  } catch (error) {
    console.error("Error reading from sheet:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API đọc dữ liệu toàn bộ
app.get("/data", async (req, res) => {
  try {
    const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });
    const range = req.query.range || "Sheet1!A1:AB100";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    const rows = response.data.values;
    if (!rows || !rows.length) {
      return res.status(404).json({ message: "No data found." });
    }

    const headers = rows[0];
    const data = rows.slice(1).map((row) =>
      headers.reduce((obj, header, index) => {
        obj[header] = row[index] || null;
        return obj;
      }, {})
    );

    res.status(200).json(data);
  } catch (error) {
    console.error("Error reading data from Google Sheets:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
