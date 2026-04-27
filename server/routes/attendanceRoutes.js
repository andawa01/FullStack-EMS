import { Router } from "express";
import { getAttendance, clockInOut } from "../controllers/attendanceController.js";
import { protect } from "../middleware/auth.js";

const attendanceRouter = Router();

attendanceRouter.get("/", protect, getAttendance);
attendanceRouter.post("/", protect, clockInOut);

export default attendanceRouter;