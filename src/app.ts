import express, { Express, Request } from "express";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import { API_VERSION_URL, FRONT_END_URL } from "@/config";
import router from "@/routes";
import { errorMiddleware } from "@/middleware";

dotenv.config();

const app: Express = express();

// === ALLOWLIST ===
const allowlist = ["http://localhost:3000", "http://127.0.0.1", FRONT_END_URL];

// === DYNAMIC CORS CONFIG ===
const corsOptionsDelegate = (
  req: Request,
  callback: (err: Error | null, options: CorsOptions) => void
) => {
  const origin = req.header("Origin") || "";
  const isAllowed = allowlist.includes(origin);

  const corsOptions: CorsOptions = {
    origin: isAllowed ? origin : false,
    credentials: true, // allow cookies/tokens to be sent
    optionsSuccessStatus: 200, // for legacy browser support
  };

  callback(null, corsOptions);
};

// === MIDDLEWARES ===
app.use(cors(corsOptionsDelegate));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === ROUTES ===
app.get("/", (_req, res) => {
  res.send("Welcome to the Sermon API!");
});

app.use(API_VERSION_URL, router);

// === GLOBAL ERROR HANDLER ===
app.use(errorMiddleware);

export default app;
