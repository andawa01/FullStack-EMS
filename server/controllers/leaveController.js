import { inngest } from "../inngest/index.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";

// create leave
// POST /api/leaves
export const createLeave = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({ userId: session.userId });

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        if (employee.isDeleted) {
            return res.status(403).json({ error: "Your account is deactivated. You cannot apply for a leave." });
        }

        const { type, startDate, endDate, reason } = req.body;

        if (!type || !startDate || !endDate || !reason) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);
        if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsedStartDate <= today || parsedEndDate <= today) {
            return res.status(400).json({ error: "Start date and end date must be in the future" });
        }

        if (parsedEndDate < parsedStartDate) {
            return res.status(400).json({ error: "End date must be after start date" });
        }

        const leave = await LeaveApplication.create({
            employeeId: employee._id,
            type,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            reason,
            status: "PENDING",
        })

        inngest.send({
            name: "leave/pending",
            data: {
                leaveApplicationId: leave._id
            }
        }).catch((error) => {
            console.error("Failed to enqueue leave/pending", error);
        })

        return res.status(201).json({ success: true, data: leave })
    } catch (error) {
        return res.status(500).json({ error: "Failed to create leave" });
    }
}

// get leaves
// GET /api/leaves
export const getLeaves = async (req, res) => {
    try {
        const session = req.session;
        const isAdmin = session.role === "ADMIN";
        if (isAdmin) {
            const status = req.query.status;
            const where = status ? { status } : {};
            const leaves = await LeaveApplication.find(where)
                .populate("employeeId")
                .sort({ createdAt: -1 });
            const data = leaves.map((leave) => {
                const obj = leave.toObject();
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

            const leaves = await LeaveApplication.find({ employeeId: employee._id }).sort({ createdAt: -1 });

            return res.json({
                data: leaves,
                employee: { ...employee, id: employee._id.toString() }
            })
        }
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch leaves" });
    }
}

// Update leave
// PATCH /api/leaves/:id
export const updateLeaveStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const leave = await LeaveApplication.findByIdAndUpdate(req.params.id, { status }, { returnDocument: "after" });

        if (!leave) {
            return res.status(404).json({ error: "Leave application not found" });
        }

        return res.json({ success: true, data: leave })
    } catch (error) {
        return res.status(500).json({ error: "Failed to update leave status" });
    }
}