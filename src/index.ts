import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import alertRouter from "./routes/alert";
import solutionsRouter from "./routes/solutions";
import { RATE_LIMIT } from "./config/thresholds";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

app.disable("x-powered-by");
app.use(express.json());
app.use(
  rateLimit({
    windowMs: RATE_LIMIT.windowMs,
    max: RATE_LIMIT.max,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use(express.static(path.join(process.cwd(), "public")));

app.use(alertRouter);
app.use(solutionsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (process.env.NODE_ENV !== "production") {
    // Avoid logging coordinates and sensitive request payloads.
    // eslint-disable-next-line no-console
    console.error("Unhandled API error", err);
  }
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`DroughtWatch API listening on port ${port}`);
  }
});
