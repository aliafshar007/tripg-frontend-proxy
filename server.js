import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const BACKEND_URL = "https://tripg-proxyy.onrender.com/api/filter";
const SECRET_TOKEN = process.env.SECRET_TOKEN;

app.post("/filter", async (req, res) => {
  try {
    const response = await axios.post(BACKEND_URL, req.body, {
      headers: {
        "x-api-key": SECRET_TOKEN
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Proxy failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Frontend proxy server running on port ${PORT}`);
});
