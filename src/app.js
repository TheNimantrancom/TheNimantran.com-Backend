import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import allRouter from "./routes/index.js";

const app = express();


const {URL1,URL2} = process.env

const corsOptions = {
  origin: [URL1,URL2],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json({ limit: "16mb" }));
app.use(express.urlencoded({ extended: true, limit: "16mb" }));

app.use(express.static("public"));


app.use(cookieParser());

app.use("/api", allRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});




export default app;
