const { admin, db } = require('../config/firebase');
const sendEmail = require('../utils/sendEmail'); // import helper

// Generate random 5-digit OTP
const generateOTP = () => Math.floor(10000 + Math.random() * 90000).toString();

// Send OTP to email
exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        console.log(email);
        if (!email || typeof email !== 'string' || email.trim() === '') {
            return res.status(400).send({ success: false, message: 'Valid email is required' });
        }

        const otp = generateOTP();

        // Save to Firestore
        await db.collection('otps').doc(email).set({
            code: otp,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Send email using helper
        await sendEmail(email, 'Your OTP Code', `Your OTP is: ${otp}`);
        console.log(`📧 Mock Email sent to ${email}: OTP is ${otp}`);
        

        res.send({ success: true, otp });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: error.message });
    }
};

// Verify OTP from email
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const doc = await db.collection('otps').doc(email).get();

        if (!doc.exists) return res.status(400).send({ success: false, message: 'OTP not found' });
        const data = doc.data();

        if (data.code === otp) {
            res.send({ success: true });
            await db.collection('otps').doc(email).delete();
        } else {
            res.status(400).send({ success: false, message: 'Invalid OTP' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: error.message });
    }
};
