import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const adminRoutes = require("./routes/admin/index.js");
const apiRoutes = require("./routes/api/index.js");
const partnerRoutes = require("./routes/partner/index.js");
const employeeRoutes = require("./routes/employee/index.js");

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// API routes
app.get("/api", (req, res) => {
  res.send("hi");
});

app.get("/api/users", (req, res) => {
  res.json([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);
});

// Admin routes
app.use("/api", apiRoutes);
app.use("/partner", partnerRoutes);
app.use("/employee", employeeRoutes);
app.use("/api/admin", adminRoutes);

// Serve React static files (Vite build)
app.use(express.static(path.join(__dirname, "..", "vianet", "dist")));

// SPA fallback (must be last)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "vianet", "dist", "index.html"));
});

export default app;