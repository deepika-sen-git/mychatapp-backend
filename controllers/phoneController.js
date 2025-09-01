const { admin, db } = require('../config/firebase');

// Helper: Generate random 5-digit OTP
const generateOTP = () => Math.floor(10000 + Math.random() * 90000).toString();

// --- Send OTP ---
exports.sendPhoneOTP = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: "Phone is required" });
        }

        const otp = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min validity

        // Save OTP in Firestore
        await db.collection("phoneOtps").doc(phone).set({
            code: otp,
            expiresAt,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // TODO: Replace with real SMS API
        console.log(`📲 Mock SMS sent to ${phone}: OTP is ${otp}`);

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            otp, // ⚠️ only return in dev
        });
    } catch (error) {
        console.error("Error sending OTP:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to send OTP",
            error: JSON.stringify(error),
        });
    }
};

// --- Verify OTP ---
exports.verifyPhoneOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: "Phone and OTP are required" });
        }

        const docRef = db.collection("phoneOtps").doc(phone);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(400).json({ success: false, message: "OTP not found or expired" });
        }

        const data = doc.data();

        // Expiration check
        if (Date.now() > data.expiresAt) {
            await docRef.delete();
            return res.status(400).json({ success: false, message: "OTP expired" });
        }

        // OTP match check
        if (data.code !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        // ✅ OTP verified
        await docRef.delete(); // Clean up after success
        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
        });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to verify OTP",
            error: JSON.stringify(error),
        });
    }
};
