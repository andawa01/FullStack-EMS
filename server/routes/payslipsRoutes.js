import { Router } from "express";
import { createPayslip, getPayslipById, getPayslips } from "../controllers/payslipController.js";
import { protect, protectAdmin } from "../middleware/auth.js";


const payslipsRouter = Router();

payslipsRouter.post("/", protect, protectAdmin, createPayslip);
payslipsRouter.get("/", protect, getPayslips);
payslipsRouter.get("/:id", protect, getPayslipById);

export default payslipsRouter;