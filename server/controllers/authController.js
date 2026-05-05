import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Login for employee and admin
// POST /api/auth/login
export const login = async (req, res) => {
    try {
        let { email, password, role_type } = req.body;

        if (!email || !password || !role_type) {
            return res.status(400).json({ error: "All fields are required" });
        }

        email = email.trim().toLowerCase();
        role_type = role_type.toUpperCase();

        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found");
            return res.status(401).json({ error: "Invalid credentials" });
        }

        if (user.role !== role_type) {
            console.log("Role mismatch:", user.role, role_type);
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            console.log("Password mismatch");
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const payload = {
            userId: user._id.toString(),
            role: user.role,
            email: user.email,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

        return res.json({ user: payload, token });

    } catch (error) {
        console.log("Login error:", error);
        return res.status(500).json({ error: "Failed to login" });
    }
};

// Get session for employee and admin
// Get /api/auth/session
export const getSession = (req, res) => {
    return res.json({
        user: req.user,
    });
};

//Change password for employee and admin
// POST /api/auth/change-password
export const changePassword = async (req, res) => {
    try {
        const userData = req.user;

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Both passwords are required" });
        }

        const user = await User.findById(userData.userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);

        if (!isValid) {
            return res.status(401).json({ error: "Invalid current password" });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        await User.findByIdAndUpdate(userData.userId, { password: hashed });

        return res.json({ success: true });

    } catch (error) {
        console.error("CHANGE PASSWORD ERROR:", error);
        return res.status(500).json({ error: "Failed to change password" });
    }
};