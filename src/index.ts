import express from "express";
import { config } from "dotenv";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import { errorMiddleware } from "./middlewares/error.middleware";
import { connectDb } from "./config/dbConnection";
// Routes imports
import authRoute from "./routes/auth.route";
import usersRoute from "./routes/user.route";
import dataEntryRoute from "./routes/dataEntry.route";

config();

const app = express();

// Middlewares
const CORS_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : [];
const corsOptions: CorsOptions = {
  origin: CORS_ORIGINS,
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(express.static("public"));
// For url inputs
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(morgan("dev"));
app.use(cookieParser());
app.disable("x-powered-by");
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// Base Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Cloud Computing CCP - API",
  });
});

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", usersRoute);
app.use("/api/v1/data-entries", dataEntryRoute);

// Middlewares
app.use(errorMiddleware);

// Listen To Server
const PORT = process.env.PORT || 8000;
// Connect To database first then start the server
connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on: http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log(`Database Connection Error: ${error}`);
  });
