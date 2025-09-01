// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();


const otpController = require('./controllers/otpController');
const phoneController = require('./controllers/phoneController');
const userCodeController = require('./controllers/userCodeController');
const cleanupController = require('./controllers/cleanupController');

const app = express();
app.use(express.json());
app.use(cors());
const authRoutes = require('./routes/authRoutes');
// app.use('/api/auth', authRoutes);

// Routes
app.post('/send-otp', otpController.sendOTP);
app.post('/verify-otp', otpController.verifyOTP);
app.post('/send-phone-otp', phoneController.sendPhoneOTP);
app.post('/verify-phone-otp', phoneController.verifyPhoneOTP);
app.post('/cleanup-messages', cleanupController.cleanUp);
app.post('/generate-usercode', userCodeController.UserCode);
app.use('/auth', authRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
