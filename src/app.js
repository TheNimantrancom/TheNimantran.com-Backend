import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import allRouter from "./routes/index.js";
import passport from "passport";
import "./middlewares/passport.js"
const app = express();


const {FRONT1,FRONT2} = process.env

const corsOptions = {
  origin: ["http://localhost:3002",FRONT2],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.set("trust proxy", 1);

app.use(cors(corsOptions));
// app.options("*", (req, res) => res.sendStatus(200));


app.use(express.json({ limit: "16mb" }));
app.use(express.urlencoded({ extended: true, limit: "16mb" }));

app.use(express.static("public"));


app.use(cookieParser());
app.use(passport.initialize());
// app.use(passport.session());
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
