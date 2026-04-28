import Payslip from "../models/Payslip.js";
import Employee from "../models/Employee.js";

// Create payslip
// POST /api/payslips
export const createPayslip = async (req, res) => {
    try {
        const { employeeId, month, year, basicSalary, allowances, deductions } = req.body;

        if (!employeeId || !month || !year || !basicSalary) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const parsedMonth = Number(month);
        const parsedYear = Number(year);
        const parsedBasicSalary = Number(basicSalary);
        const parsedAllowances = Number(allowances || 0);
        const parsedDeductions = Number(deductions || 0);

        if (
            !Number.isFinite(parsedMonth) ||
            !Number.isFinite(parsedYear) ||
            !Number.isFinite(parsedBasicSalary) ||
            !Number.isFinite(parsedAllowances) ||
            !Number.isFinite(parsedDeductions) ||
            parsedMonth < 1 || parsedMonth > 12 ||
            parsedYear < 1900 ||
            parsedBasicSalary < 0 || parsedAllowances < 0 || parsedDeductions < 0
        ) {
            return res.status(400).json({ error: "Invalid payroll values" });
        }

        const employee = await Employee.findById(employeeId).lean();
        if (!employee || employee.isDeleted) {
            return res.status(404).json({ error: "Employee not found" });
        }

        const netSalary = parsedBasicSalary + parsedAllowances - parsedDeductions;

        const payslip = await Payslip.create({
            employeeId,
            month: parsedMonth,
            year: parsedYear,
            basicSalary: parsedBasicSalary,
            allowances: parsedAllowances,
            deductions: parsedDeductions,
            netSalary
        });

        return res.status(201).json({ success: true, data: payslip });
    } catch (error) {
        return res.status(500).json({ error: "Failed to create payslip" });
    }
}

// Get payslip
// GET /api/payslips
export const getPayslips = async (req, res) => {
    try {
        const session = req.session;
        const isAdmin = session.role === "ADMIN";

        if (isAdmin) {
            const payslips = await Payslip.find().populate("employeeId").sort({ createdAt: -1 });
            const data = payslips.map((payslip) => {
                const obj = payslip.toObject();
                return {
                    ...obj,
                    id: obj._id.toString(),
                    employee: obj.employeeId,
                    employeeId: obj.employeeId?._id?.toString(),
                }
            })
            return res.json(data);
        } else {
            const employee = await Employee.findOne({ userId: session.userId }).lean();

            if (!employee) {
                return res.status(404).json({ error: "Employee not found" });
            }

            const payslips = await Payslip.find({ employeeId: employee._id }).sort({ createdAt: -1 });

            return res.json({ data: payslips });
        }
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch payslips" });
    }
}

// Get payslip by ID
// GET /api/payslips/:id
export const getPayslipById = async (req, res) => {
    try {
        const session = req.session;
        const isAdmin = session.role === "ADMIN";

        let query = { _id: req.params.id };
        if (!isAdmin) {
            const employee = await Employee.findOne({ userId: session.userId }).lean();
            if (!employee) {
                return res.status(404).json({ error: "Employee not found" });
            }
            query.employeeId = employee._id;
        }

        const payslip = await Payslip.findOne(query).populate("employeeId").lean();

        if (!payslip) {
            return res.status(404).json({ error: "Payslip not found" });
        }

        const result = {
            ...payslip,
            id: payslip._id.toString(),
            employee: payslip.employeeId,

        };

        return res.json(result);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch payslip" });
    }
}

