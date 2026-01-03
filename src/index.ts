import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import { errorMiddleware } from "./middlewares/error.middleware";
import { connectDb } from "./config/dbConnection";

// Routes imports
import authRoute from "./routes/auth.route";
import usersRoute from "./routes/user.route";
import dataEntryRoute from "./routes/dataEntry.route";
import adminRoute from "./routes/admin.route";
import ticketRoute from "./routes/ticket.route";

config();

const app = express();

/* ============================
   GLOBAL MIDDLEWARES (ORDER MATTERS)
=============================== */

// ✅ Allow ALL origins with credentials support
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      // Allow all origins in development
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Handle preflight requests
app.options("*", cors());

// Security
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// Parsers
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// Utilities
app.use(morgan("dev"));
app.use(cookieParser());
app.disable("x-powered-by");

/* ============================
   ROUTES
=============================== */

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Cloud Computing CCP - API",
  });
});

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", usersRoute);
app.use("/api/v1/data-entries", dataEntryRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/tickets", ticketRoute);

/* ============================
   ERROR HANDLER
=============================== */
app.use(errorMiddleware);

/* ============================
   SERVER START
=============================== */
const PORT = process.env.PORT || 8000;

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Database Connection Error:", error);
  });
