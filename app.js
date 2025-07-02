const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

// Serve uploads as static files for invoice download
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Static folder for image access
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Proper CORS setup
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://192.168.1.5:5173",
    "http://192.168.1.5:5173"
  ],
  credentials: true,
}));

// ✅ Allow preflight requests (OPTIONS)
// Remove the problematic app.options("*", cors())

// ✅ Parsing middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// ✅ Simple health check route
app.get("/", (req, res) => {
  res.send("Salon Admin API is running");
});

module.exports = app;
