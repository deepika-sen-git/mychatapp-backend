const admin = require('firebase-admin');

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    // Fix line breaks in private key
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    // serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
} else {
    serviceAccount = require("./serviceAccountKey.json"); // fallback for local dev
}
// console.log(serviceAccount.private_key);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = { admin, db };
