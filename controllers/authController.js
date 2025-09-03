// controllers/authController.js
const { admin, db } = require("../config/firebase");

exports.updatePassword = async (req, res) => {
    const { email, phone, newPassword, logoutEverywhere = false } = req.body;
    console.log("Request received to update password:", logoutEverywhere);

    if (!newPassword || (!email && !phone)) {
        return res.status(400).json({
            success: false,
            message: "Provide either email or phone along with newPassword",
        });
    }

    try {
        let userRecord;

        if (email) {
            // 🔎 Look for user in Firebase Auth by email
            console.log("Looking for user with email:", email);
            userRecord = await admin.auth().getUserByEmail(email);
        } else if (phone) {
            // 🔎 Look for user in Firestore "users" collection
            console.log("Looking for user with phone:", phone);
            const snapshot = await db
                .collection("users")
                .where("phone", "==", phone)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return res.status(404).json({
                    success: false,
                    message: "User not found with this phone",
                });
            }

            const userData = snapshot.docs[0].data();
            const uid = snapshot.docs[0].id;

            // Now fetch corresponding Auth user by UID
            userRecord = await admin.auth().getUser(uid);
        }

        if (!userRecord) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // 🔑 Update password in Firebase Auth
        await admin.auth().updateUser(userRecord.uid, { password: newPassword });
        console.log("✅ Password updated for UID:", userRecord.uid);

        // 🚪 Optionally revoke tokens (force logout everywhere)
        if (logoutEverywhere) {
            await admin.auth().revokeRefreshTokens(userRecord.uid);
        }

        return res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    } catch (error) {
        console.error("Error updating password:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update password",
            error: error.message,
        });
    }
};

// Delete user account (Auth + Firestore "users" + cleanup in friends)
exports.deleteUser = async (req, res) => {
    const { uid } = req.body; // UID from client

    if (!uid) {
        return res.status(400).json({
            success: false,
            message: "UID is required to delete account",
        });
    }

    try {
        // 1. Delete Firestore user document
        const userDocRef = db.collection("users").doc(uid);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
            await userDocRef.delete();
            console.log(`🔥 User document deleted for UID: ${uid}`);
        }

        // 2. Remove UID from all other users' friends arrays
        const usersSnapshot = await db.collection("users").where("friends", "array-contains", uid).get();

        const batch = db.batch();
        usersSnapshot.forEach((doc) => {
            const ref = db.collection("users").doc(doc.id);
            batch.update(ref, {
                friends: admin.firestore.FieldValue.arrayRemove(uid),
            });
        });

        if (!usersSnapshot.empty) {
            await batch.commit();
            console.log(`👥 Removed UID ${uid} from all friends arrays`);
        }

        // 3. Delete user from Firebase Auth
        await admin.auth().deleteUser(uid);
        console.log(`✅ Auth user deleted for UID: ${uid}`);

        return res.status(200).json({
            success: true,
            message: "User account deleted successfully (including cleanup in friends)",
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete user",
            error: error.message,
        });
    }
};

