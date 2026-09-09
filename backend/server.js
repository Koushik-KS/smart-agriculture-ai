const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

const PORT = 5000;
const AI_SERVICE_URL = "http://127.0.0.1:8000";

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.json({
    message: "Smart Agriculture Backend is running",
  });
});


app.post("/api/crop-recommendation", async (req, res) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/predict`,
      req.body
    );

    res.json(response.data);

  } catch (error) {
    console.error("AI service error:", error.message);

    res.status(500).json({
      message: "Failed to get crop recommendation",
    });
  }
});


app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});