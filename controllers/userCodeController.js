const { admin, db } = require('../config/firebase');
const generateUserCode = require('../utils/generateUserCode');

exports.UserCode = async (req, res) => {
    try {
        let userCode;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 5;

        while (!isUnique && attempts < maxAttempts) {
            attempts++;
            userCode = generateUserCode();
            const snapshot = await admin.firestore().collection('users')
                .where('userCode', '==', userCode)
                .get();

            if (snapshot.empty) {
                isUnique = true;
            }
        }

        if (!isUnique) {
            return res.status(500).json({ success: false, message: 'Could not generate unique userCode' });
        }

        return res.json({ success: true, userCode });
    } catch (error) {
        console.error('Error generating userCode:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
