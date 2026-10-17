import { Router } from "express";
import { isDatabaseConnected } from "../config/database";
import { sendSuccess } from "../utils/sendResponse";

const router = Router();

router.get("/", (_req, res) =>
  sendSuccess(
    res,
    { status: "ok", database: isDatabaseConnected() ? "connected" : "disconnected", uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() },
    "API is healthy",
  ),
);

export default router;
