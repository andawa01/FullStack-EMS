import Employee from "../models/Employee.js";

// Get profile
// GET /api/profile
export const getProfile = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const employee = await Employee.findOne({ userId: user.userId });

        if (!employee) {
            return res.json({
                firstName: "Admin",
                lastName: "",
                email: user.email,
                role: user.role,
            });
        }

        return res.json(employee);

    } catch (error) {
        console.log("PROFILE ERROR:", error);
        return res.status(500).json({ error: "Failed to fetch profile" });
    }
};

// Update profile
// PUT /api/profile
export const updateProfile = async (req, res) => {
    try {
        const user = req.user;

        const employee = await Employee.findOne({ userId: user.userId });

        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        if (employee.isDeleted) {
            return res.status(403).json({
                error: "Your account is deactivated. You cannot update your profile."
            });
        }

        await Employee.findByIdAndUpdate(employee._id, {
            bio: req.body.bio
        });

        return res.json({ success: true });

    } catch (error) {
        console.error("UPDATE PROFILE ERROR:", error);
        return res.status(500).json({ error: "Failed to update profile" });
    }
};