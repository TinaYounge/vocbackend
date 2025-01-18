const dotenv = require("dotenv");
dotenv.config();


if (!process.env.GOOGLE_SHEETS_CREDENTIALS) {
    throw new Error("GOOGLE_SHEETS_CREDENTIALS is not set in environment variables");
}

const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);


const spreadsheetId = process.env.SPREADSHEET_ID;

const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});



const sheets = google.sheets({ version: "v4", auth });

const appendRow = async (data) => {
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A1",
      valueInputOption: "RAW",
      resource: {
        values: [data],
      },
    });
    console.log("Data appended:", response.data);
  } catch (error) {
    console.error("Error appending data:", error);
  }
};

module.exports = { appendRow };
