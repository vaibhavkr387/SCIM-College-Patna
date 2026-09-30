const fs = require("fs");
const http = require("http");
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const { Server } = require("socket.io");

const env = require("./config/env");
const connectDB = require("./config/db");
const { setIO } = require("./services/notifications");
const authRoutes = require("./routes/auth");
const publicRoutes = require("./routes/public");
const studentRoutes = require("./routes/student");
const adminRoutes = require("./routes/admin");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();
const server = http.createServer(app);

const allowedOrigins = new Set(
  [env.frontendUrl, env.frontendUrlAlt, ...env.corsOrigins].filter(Boolean)
);

const io = new Server(server, {
  cors: {
    origin: [...allowedOrigins],
    credentials: true
  }
});

setIO(io);

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "SCIM College Portal API",
    time: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);

const publicDir = fs.existsSync(env.frontendPublicDir)
  ? env.frontendPublicDir
  : path.join(__dirname, "public");

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, {
    index: "index.html",
    extensions: ["html"]
  }));
}

io.on("connection", (socket) => {
  socket.on("join-user-room", (userId) => {
    if (typeof userId === "string" && /^[a-f0-9]{24}$/i.test(userId)) {
      socket.join(`user:${userId}`);
    }
  });

  socket.on("disconnect", () => {});
});

app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(() => {
    server.listen(env.port, () => {
      console.log(`SCIM College backend running on http://localhost:${env.port}`);
      if (fs.existsSync(publicDir)) {
        console.log(`Serving frontend from ${publicDir}`);
      } else {
        console.warn("Frontend public folder not found; API-only mode.");
      }
    });
  })
  .catch((error) => {
    console.error("Startup failed:", error);
    process.exit(1);
  });

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
