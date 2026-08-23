const crypto = require("crypto");
const db = require("./firebase");

const email = "abdullahi@gmail.com";
const password = "A1234567";

function hashPassword(password) {
    return crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");
}

async function createAdmin() {

    try {

        const adminRef = db.collection("admins").doc(email);

        const existing = await adminRef.get();

        if (existing.exists) {

            console.log("Admin already exists.");

            process.exit(0);
        }

        const passwordHash = hashPassword(password);

        await adminRef.set({

            email: email,

            passwordHash: passwordHash,

            role: "admin",

            active: true,

            createdAt: new Date()

        });

        console.log("Admin created successfully.");
        console.log("Email:", email);
        console.log("Role: admin");

        process.exit(0);

    } catch (error) {

        console.error("ADMIN CREATION ERROR:");
        console.error(error);

        process.exit(1);
    }
}

createAdmin();
