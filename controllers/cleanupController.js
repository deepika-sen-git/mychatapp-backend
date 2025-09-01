exports.cleanUp = async (req, res) => {
    try {
        const snapshot = await db.collection("messages").get();
        const now = Date.now();
        const batch = db.batch();

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.deleteAt && data.deleteAt.toMillis() < now) {
                batch.delete(doc.ref);
            }
        });

        await batch.commit();
        return res.status(200).json({ status: "cleanup done" });
    } catch (err) {
        console.error("Cleanup failed:", err);
        return res.status(500).json({ error: "Cleanup failed", details: err.message });
    }
};
const { db } = require('../config/firebase');