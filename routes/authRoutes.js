// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/update-password", authController.updatePassword);

router.post("/delete-user", authController.deleteUser);

module.exports = router;
