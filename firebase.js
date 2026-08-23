const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("./global-express-data-firebase-adminsdk-fbsvc-12a5f8adf4.json");

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

module.exports = db;
