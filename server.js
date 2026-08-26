
require("dotenv").config();
const express = require("express");
const db = require("./firebase");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const { Resend } = require("resend");

const resend = new Resend(
    process.env.RESEND_API_KEY
);

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/auth.html");
});
// =====================================================
// ADMIN SESSION STORAGE
// =====================================================

const adminSessions = new Map();

const userSessions = new Map();

// =====================================================
// PASSWORD HASH
// =====================================================

function hashPassword(password) {

    return crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");

}

// =====================================================
// USER TOKEN
// =====================================================

function createUserToken() {
    return crypto.randomBytes(32).toString("hex");
}
// =====================================================
// ADMIN AUTH MIDDLEWARE
// =====================================================

async function requireAdmin(req, res, next) {

    try {

        const token = req.headers["x-admin-token"];

        if (!token) {

            return res.status(401).json({
                success: false,
                message: "Admin authentication required"
            });

        }

        
const session = adminSessions.get(token);
       
        if (!session) {

            return res.status(401).json({
                success: false,
                message: "Invalid or expired admin session"
            });

        }

        // Session expires after 12 hours

        if (Date.now() > session.expiresAt) {

            adminSessions.delete(token);

            return res.status(401).json({
                success: false,
                message: "Admin session expired"
            });

        }

        req.admin = session;

        next();

    } catch (error) {

        console.error("ADMIN AUTH ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

}

// =====================================================
// USER AUTH MIDDLEWARE
// =====================================================

async function requireUser(req, res, next) {

    try {

        const authHeader = req.headers.authorization || "";

        const token = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : "";

        if (!token) {

            return res.status(401).json({
                success: false,
                message: "User authentication required"
            });

        }

        const session = userSessions.get(token);

        if (!session) {

            return res.status(401).json({
                success: false,
                message: "Invalid or expired user session"
            });

        }

        if (Date.now() > session.expiresAt) {

            userSessions.delete(token);

            return res.status(401).json({
                success: false,
                message: "User session expired"
            });

        }

        req.user = session;

        next();

    } catch (error) {

        console.error(
            "USER AUTH ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }
}

// =====================================================
// USER TEST API
// =====================================================

app.get("/user", (req, res) => {

    res.json({

        name: "Abdullahi",
        app: "Global Express Data",
        balance: 5000

    });

});


// =====================================================
// ABOUT API
// =====================================================

app.get("/about", (req, res) => {

    res.json({

        company: "Global Express Data",
        version: "1.0",
        developer: "Abdullahi"

    });

});


// =====================================================
// REGISTER
// =====================================================

app.post("/register", async (req, res) => {

    try {

        const {
            name,
            username,
            email,
            phone,
            password
        } = req.body;


        // =========================
        // VALIDATION
        // =========================

        if (
            !name ||
            !username ||
            !email ||
            !phone ||
            !password
        ) {

            return res.json({

                success: false,
                message: "Please fill all required fields"

            });

        }


        if (password.length < 6) {

            return res.json({

                success: false,
                message: "Password must be at least 6 characters"

            });

        }


        const usersRef = db.collection("users");


        // =========================
        // CHECK EMAIL
        // =========================

        const emailCheck = await usersRef
            .where("email", "==", email)
            .limit(1)
            .get();


        if (!emailCheck.empty) {

            return res.json({

                success: false,
                message: "Email already exists"

            });

        }


        // =========================
        // CHECK USERNAME
        // =========================

        const usernameCheck = await usersRef
            .where("username", "==", username)
            .limit(1)
            .get();


        if (!usernameCheck.empty) {

            return res.json({

                success: false,
                message: "Username already exists"

            });

        }


        // =========================
        // CREATE USER
        // =========================
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await usersRef.add({

            name: name,
            username: username,
            email: email,
            phone: phone,

            // NOTE:
            // Wannan password din za mu inganta
            // daga baya zuwa secure authentication.

            password: hashedPassword,

            balance: 0,

            blocked: false,

            createdAt: new Date()

        });


        console.log(
            "New user created:",
            newUser.id
        );


        // =========================
        // SUCCESS
        // =========================

        res.json({

            success: true,

            message: "Registration Successful",

            user: {

                id: newUser.id,
                name: name,
                username: username,
                email: email,
                phone: phone,
                balance: 0,
                blocked: false

            }

        });


    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );

        res.status(500).json({

            success: false,
            message: "Server error"

        });

    }

});

// =====================================================
// FORGOT PASSWORD
// =====================================================

app.post("/forgot-password", async (req, res) => {
    try {
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();

        if (!email) {
            return res.json({
                success: false,
                message: "Please enter your email"
            });
        }

        const snapshot = await db
            .collection("users")
            .where("email", "==", email)
            .limit(1)
            .get();

        // Don't reveal whether an email exists
        if (snapshot.empty) {
            return res.json({
                success: true,
                message: "If this email exists, a reset link has been sent."
            });
        }

        const userDoc = snapshot.docs[0];

        // Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Hash token before storing it
        const resetTokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        const resetExpires = Date.now() + (15 * 60 * 1000);

        await userDoc.ref.update({
            passwordResetToken: resetTokenHash,
            passwordResetExpires: resetExpires
        });

        const resetLink =
            `${process.env.APP_URL || "http://localhost:3000"}/reset-password.html?token=${resetToken}`;

        await resend.emails.send({
    from: "GE DATA <onboarding@resend.dev>",
    to: email,
    subject: "GE DATA Password Reset",
    html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
            <h2>GE DATA Password Reset</h2>

            <p>We received a request to reset your GE DATA password.</p>

            <p>
                Click the button below to create a new password.
            </p>

            <p>
                <a href="${resetLink}"
                   style="
                   display:inline-block;
                   padding:12px 20px;
                   background:#2563eb;
                   color:white;
                   text-decoration:none;
                   border-radius:8px;
                   ">
                    Reset Password
                </a>
            </p>

            <p>This link will expire in 15 minutes.</p>

            <p>
                If you did not request this, you can safely ignore this email.
            </p>
        </div>
    `
});

        res.json({
            success: true,
            message: "If this email exists, a reset link has been sent."
        });

    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to process password reset"
        });
    }
});

// =====================================================
// RESET PASSWORD
// =====================================================

app.post("/reset-password", async (req, res) => {
    try {
        const token = String(req.body.token || "").trim();
        const password = String(req.body.password || "");

        if (!token || !password) {
            return res.json({
                success: false,
                message: "Invalid reset request"
            });
        }

        if (password.length < 6) {
            return res.json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const snapshot = await db
            .collection("users")
            .where("passwordResetToken", "==", tokenHash)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.json({
                success: false,
                message: "Invalid or expired reset link"
            });
        }

        const userDoc = snapshot.docs[0];
        const user = userDoc.data();

        if (
            !user.passwordResetExpires ||
            Date.now() > user.passwordResetExpires
        ) {
            return res.json({
                success: false,
                message: "Reset link has expired"
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 12);

        await userDoc.ref.update({
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null
        });

        res.json({
            success: true,
            message: "Password reset successful"
        });

    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to reset password"
        });
    }
});

// =====================================================
// LOGIN
// =====================================================

app.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.json({

                success: false,
                message: "Please enter email and password"

            });

        }


        const snapshot = await db
            .collection("users")
            .where("email", "==", email)
            .limit(1)
            .get();


        if (snapshot.empty) {

            return res.json({

                success: false,
                message: "Invalid email or password"

            });

        }


        const userDoc = snapshot.docs[0];
        const user = userDoc.data();


        // =========================
        // BLOCK CHECK
        // =========================

        if (user.blocked === true) {

            return res.json({

                success: false,
                message: "Your account has been blocked"

            });

        }


        // =========================
// PASSWORD CHECK
// =========================

let passwordValid = false;

if (user.password && user.password.startsWith("$2")) {
    // New bcrypt password
    passwordValid = await bcrypt.compare(
        password,
        user.password
    );
} else {
    // Old plain-text password
    passwordValid = user.password === password;

    // Migrate old password to bcrypt
    if (passwordValid) {
        const newHashedPassword =
            await bcrypt.hash(password, 12);

        await userDoc.ref.update({
            password: newHashedPassword
        });
    }
}

if (!passwordValid) {
    return res.json({
        success: false,
        message: "Invalid email or password"
    });
}


         // =====================================================
// CREATE USER SESSION
// =====================================================

const token = createUserToken();

userSessions.set(token, {
    uid: userDoc.id,
    userId: userDoc.id,
    email: user.email,

    expiresAt:
        Date.now() +
        (12 * 60 * 60 * 1000)
});
        res.json({

    success: true,

    message: "Login Successful",

    token: token,

    user: {

        id: userDoc.id,

        name: user.name,

        username: user.username,

        email: user.email,

        phone: user.phone,

        balance: Number(user.balance) || 0,

        blocked: user.blocked || false

    }

});


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        res.status(500).json({

            success: false,
            message: "Server error"

        });

    }

});

// =====================================================
// LOGIN WITH TRANSACTION PIN
// =====================================================

app.post("/login-pin", async (req, res) => {
    try {

        const { email, pin } = req.body;

        if (!email || !pin) {
            return res.json({
                success: false,
                message: "Please enter email and PIN"
            });
        }

        if (!/^\d{4}$/.test(String(pin))) {
            return res.json({
                success: false,
                message: "PIN must be exactly 4 digits"
            });
        }

        let snapshot = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

if (snapshot.empty) {
    snapshot = await db
        .collection("users")
        .where("username", "==", email)
        .limit(1)
        .get();
}

if (snapshot.empty) {
    return res.json({
        success: false,
        message: "Invalid email or username or PIN"
    });
}

        const userDoc = snapshot.docs[0];
        const user = userDoc.data();

        // BLOCK CHECK
        if (user.blocked === true) {
            return res.json({
                success: false,
                message: "Your account has been blocked"
            });
        }

        // CHECK TRANSACTION PIN
        if (!user.transactionPin) {
            return res.json({
                success: false,
                message: "Transaction PIN has not been set"
            });
        }

        if (String(user.transactionPin) !== String(pin)) {
            return res.json({
                success: false,
                message: "Incorrect PIN"
            });
        }

        // CREATE SESSION
        const token = createUserToken();

        userSessions.set(token, {
            uid: userDoc.id,
            userId: userDoc.id,
            email: user.email,
            expiresAt:
                Date.now() + (12 * 60 * 60 * 1000)
        });

        res.json({
            success: true,
            message: "Login Successful",
            token: token,
            user: {
                id: userDoc.id,
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                balance: Number(user.balance) || 0,
                blocked: user.blocked || false
            }
        });

    } catch (error) {

        console.error(
            "LOGIN WITH PIN ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Login with PIN failed"
        });
    }
});

// =====================================================
// GET CURRENT USER
// =====================================================

app.get(
    "/api/user",
    requireUser,
    async (req, res) => {

        try {

            const userDoc = await db
                .collection("users")
                .doc(req.user.userId)
                .get();

            if (!userDoc.exists) {

                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });

            }

            const user = userDoc.data();

            if (user.blocked === true) {

                return res.status(403).json({
                    success: false,
                    message: "Your account has been blocked"
                });

            }

            res.json({

                success: true,

                user: {

                    id: userDoc.id,

                    name:
                        user.name || "",

                    username:
                        user.username || "",

                    email:
                        user.email || "",

                    phone:
                        user.phone || "",

                    balance:
                        Number(user.balance) || 0,

                    transactionPin: user.transactionPin ? true : false,

                    blocked:
                        user.blocked === true

                }

            });

        } catch (error) {

            console.error(
                "GET CURRENT USER ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load user"

            });

        }

    }
);

// =====================================================
// SET TRANSACTION PIN
// =====================================================

app.post("/api/user/set-pin", requireUser, async (req, res) => {

    try {

        const { pin } = req.body;

        // Check PIN
        if (!pin || !/^\d{4}$/.test(String(pin))) {

            return res.status(400).json({
                success: false,
                message: "Transaction PIN must be exactly 4 digits"
            });

        }

        const userRef = db
            .collection("users")
            .doc(req.user.userId);

        const userDoc = await userRef.get();

        if (!userDoc.exists) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        // Save PIN
        await userRef.update({
            transactionPin: String(pin)
        });

        res.json({
            success: true,
            message: "Transaction PIN set successfully"
        });

    } catch (error) {

        console.error(
            "SET TRANSACTION PIN ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to set transaction PIN"
        });

    }

});

// =====================================================
// FORGOT / RESET TRANSACTION PIN
// =====================================================

app.post("/api/user/reset-pin", requireUser, async (req, res) => {
    try {

        const { password, pin } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Enter your login password"
            });
        }

        if (!pin || !/^\d{4}$/.test(String(pin))) {
            return res.status(400).json({
                success: false,
                message: "Transaction PIN must be exactly 4 digits"
            });
        }

        const userRef = db
            .collection("users")
            .doc(req.user.userId);

        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = userDoc.data();

        if (String(user.password) !== String(password)) {
            return res.status(401).json({
                success: false,
                message: "Incorrect login password"
            });
        }

        await userRef.update({
            transactionPin: String(pin)
        });

        res.json({
            success: true,
            message: "Transaction PIN reset successfully"
        });

    } catch (error) {

        console.error(
            "RESET TRANSACTION PIN ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to reset transaction PIN"
        });
    }
});

// =====================================================
// VERIFY TRANSACTION PIN
// =====================================================

app.post("/api/user/verify-pin", requireUser, async (req, res) => {

    try {

        const { pin } = req.body;

        if (!pin || !/^\d{4}$/.test(String(pin))) {

            return res.status(400).json({
                success: false,
                message: "Enter your 4-digit PIN"
            });

        }

        const userRef = db
            .collection("users")
            .doc(req.user.userId);

        const userDoc = await userRef.get();

        if (!userDoc.exists) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });

        }

        const user = userDoc.data();

        // Check if PIN exists
        if (!user.transactionPin) {

            return res.status(400).json({
                success: false,
                message: "Transaction PIN has not been set"
            });

        }

        // Verify PIN
        if (String(user.transactionPin) !== String(pin)) {

            return res.status(401).json({
                success: false,
                message: "Incorrect transaction PIN"
            });

        }

        res.json({
            success: true,
            message: "Transaction PIN verified"
        });

    } catch (error) {

        console.error(
            "VERIFY PIN ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to verify transaction PIN"
        });

    }

});

// =====================================================
// USER TRANSACTION HISTORY
// =====================================================

app.get("/api/history", requireUser, async (req, res) => {
    try {

        const snapshot = await db
            .collection("users")
            .doc(req.user.userId)
            .collection("transactions")
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({
            success: true,
            transactions
        });

    } catch (error) {

        console.error("GET HISTORY ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load transaction history"
        });
    }
});

// =====================================================
// BILALSADASUB - DATA PLANS
// =====================================================

// =====================================================
// ADMIN LOGIN
// =====================================================

app.post("/admin/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.json({

                success: false,
                message: "Please enter email and password"

            });

        }


        const adminEmail =
            email.trim().toLowerCase();


        const adminRef = db
            .collection("admins")
            .doc(adminEmail);


        const adminDoc =
            await adminRef.get();


        if (!adminDoc.exists) {

            return res.json({

                success: false,
                message: "Invalid admin credentials"

            });

        }


        const admin = adminDoc.data();


        if (admin.active !== true) {

            return res.json({

                success: false,
                message: "Admin account is disabled"

            });

        }


        const passwordHash =
            hashPassword(password);


        if (
            passwordHash !==
            admin.passwordHash
        ) {

            return res.json({

                success: false,
                message: "Invalid admin credentials"

            });

        }


        // =========================
        // CREATE ADMIN SESSION
        // =========================

        const token =
            crypto.randomBytes(32).toString("hex");


        adminSessions.set(token, {

            email: adminEmail,

            role: admin.role || "admin",

            expiresAt:
                Date.now() +
                (12 * 60 * 60 * 1000)

        });


        console.log(
            "Admin logged in:",
            adminEmail
        );


        res.json({

            success: true,

            message: "Admin login successful",

            token: token,

            admin: {

                email: admin.email,
                role: admin.role || "admin"

            }

        });


    } catch (error) {

        console.error(
            "ADMIN LOGIN ERROR:",
            error
        );

        res.status(500).json({

            success: false,
            message: "Server error"

        });

    }

});


// =====================================================
// ADMIN LOGOUT
// =====================================================

app.post(
    "/admin/logout",
    requireAdmin,
    async (req, res) => {

        const token =
            req.headers["x-admin-token"];

        adminSessions.delete(token);

        res.json({

            success: true,
            message: "Admin logged out"

        });

    }
);


// =====================================================
// ADMIN - GET ALL USERS
// =====================================================

app.get(
    "/admin/users",
    requireAdmin,
    async (req, res) => {

        try {

            const snapshot =
                await db
                    .collection("users")
                    .orderBy(
                        "createdAt",
                        "desc"
                    )
                    .get();


            const users =
                snapshot.docs.map(doc => {

                    const data =
                        doc.data();

                    return {

                        id: doc.id,

                        name:
                            data.name || "",

                        username:
                            data.username || "",

                        email:
                            data.email || "",

                        phone:
                            data.phone || "",

                        balance:
                            Number(data.balance) || 0,

                        blocked:
                            data.blocked === true,

                        createdAt:
                            data.createdAt || null

                    };

                });


            res.json({

                success: true,

                count: users.length,

                users: users

            });


        } catch (error) {

            console.error(
                "GET USERS ERROR:",
                error
            );

            res.status(500).json({

                success: false,
                message: "Failed to load users"

            });

        }

    }
);


// =====================================================
// ADMIN - GET SINGLE USER
// =====================================================

app.get(
    "/admin/users/:id",
    requireAdmin,
    async (req, res) => {

        try {

            const userRef =
                db
                    .collection("users")
                    .doc(req.params.id);


            const userDoc =
                await userRef.get();


            if (!userDoc.exists) {

                return res.status(404).json({

                    success: false,
                    message: "User not found"

                });

            }


            const data =
                userDoc.data();


            res.json({

                success: true,

                user: {

                    id: userDoc.id,

                    name:
                        data.name || "",

                    username:
                        data.username || "",

                    email:
                        data.email || "",

                    phone:
                        data.phone || "",

                    balance:
                        Number(data.balance) || 0,

                    blocked:
                        data.blocked === true,

                    createdAt:
                        data.createdAt || null

                }

            });


        } catch (error) {

            console.error(
                "GET USER ERROR:",
                error
            );

            res.status(500).json({

                success: false,
                message: "Failed to load user"

            });

        }

    }
);


// =====================================================
// ADMIN - ADD BALANCE
// =====================================================

app.post(
    "/admin/users/:id/add-balance",
    requireAdmin,
    async (req, res) => {

        try {

            const amount =
                Number(req.body.amount);


            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {

                return res.status(400).json({

                    success: false,
                    message:
                        "Enter a valid amount"

                });

            }


            const userRef =
                db
                    .collection("users")
                    .doc(req.params.id);


            const userDoc =
                await userRef.get();


            if (!userDoc.exists) {

                return res.status(404).json({

                    success: false,
                    message: "User not found"

                });

            }


            const user =
                userDoc.data();


            const oldBalance =
                Number(user.balance) || 0;


            const newBalance =
                oldBalance + amount;


            await userRef.update({

                balance: newBalance

            });


            // =========================
            // ACTIVITY LOG
            // =========================

            await db
                .collection("adminActivity")
                .add({

                    action: "ADD_BALANCE",

                    admin:
                        req.admin.email,

                    userId:
                        req.params.id,

                    amount:
                        amount,

                    oldBalance:
                        oldBalance,

                    newBalance:
                        newBalance,

                    createdAt:
                        new Date()

                });


            res.json({

                success: true,

                message:
                    "Balance added successfully",

                oldBalance:
                    oldBalance,

                newBalance:
                    newBalance

            });


        } catch (error) {

            console.error(
                "ADD BALANCE ERROR:",
                error
            );

            res.status(500).json({

                success: false,
                message:
                    "Failed to add balance"

            });

        }

    }
);


// =====================================================
// ADMIN - DEDUCT BALANCE
// =====================================================

app.post(
    "/admin/users/:id/deduct-balance",
    requireAdmin,
    async (req, res) => {

        try {

            const amount =
                Number(req.body.amount);


            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {

                return res.status(400).json({

                    success: false,
                    message:
                        "Enter a valid amount"

                });

            }


            const userRef =
                db
                    .collection("users")
                    .doc(req.params.id);


            const userDoc =
                await userRef.get();


            if (!userDoc.exists) {

                return res.status(404).json({

                    success: false,
                    message: "User not found"

                });

            }


            const user =
                userDoc.data();


            const oldBalance =
                Number(user.balance) || 0;


            if (amount > oldBalance) {

                return res.status(400).json({

                    success: false,

                    message:
                        "User does not have enough balance"

                });

            }


            const newBalance =
                oldBalance - amount;


            await userRef.update({

                balance: newBalance

            });


            // =========================
            // ACTIVITY LOG
            // =========================

            await db
                .collection("adminActivity")
                .add({

                    action: "DEDUCT_BALANCE",

                    admin:
                        req.admin.email,

                    userId:
                        req.params.id,

                    amount:
                        amount,

                    oldBalance:
                        oldBalance,

                    newBalance:
                        newBalance,

                    createdAt:
                        new Date()

                });


            res.json({

                success: true,

                message:
                    "Balance deducted successfully",

                oldBalance:
                    oldBalance,

                newBalance:
                    newBalance

            });


        } catch (error) {

            console.error(
                "DEDUCT BALANCE ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to deduct balance"

            });

        }

    }
);


// =====================================================
// ADMIN - BLOCK USER
// =====================================================

app.post(
    "/admin/users/:id/block",
    requireAdmin,
    async (req, res) => {

        try {

            const userRef =
                db
                    .collection("users")
                    .doc(req.params.id);


            const userDoc =
                await userRef.get();


            if (!userDoc.exists) {

                return res.status(404).json({

                    success: false,
                    message: "User not found"

                });

            }


            await userRef.update({

                blocked: true

            });


            await db
                .collection("adminActivity")
                .add({

                    action: "BLOCK_USER",

                    admin:
                        req.admin.email,

                    userId:
                        req.params.id,

          createdAt:
                        new Date()

                });


            res.json({

                success: true,

                message:
                    "User blocked successfully"

            });


        } catch (error) {

            console.error(
                "BLOCK USER ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to block user"

            });

        }

    }
);


// =====================================================
// ADMIN - UNBLOCK USER
// =====================================================

app.post(
    "/admin/users/:id/unblock",
    requireAdmin,
    async (req, res) => {

        try {

            const userRef =
                db
                    .collection("users")
                    .doc(req.params.id);


            const userDoc =
                await userRef.get();


            if (!userDoc.exists) {

                return res.status(404).json({

                    success: false,
                    message: "User not found"

                });

            }


            await userRef.update({

                blocked: false

            });


            await db
                .collection("adminActivity")
                .add({

                    action: "UNBLOCK_USER",

                    admin:
                        req.admin.email,

                    userId:
                        req.params.id,

                    createdAt:
                        new Date()

                });


            res.json({

                success: true,

                message:
                    "User unblocked successfully"

            });


        } catch (error) {

            console.error(
                "UNBLOCK USER ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to unblock user"

            });

        }

    }
);

// =====================================================
// BILALSADASUB - DATA PLANS
// =====================================================

const BILAL_NETWORKS = {
    mtn: 1,
    airtel: 2,
    glo: 3,
    t2: 4
};

// =====================================================
// DATA NETWORK SETTINGS
// =====================================================

const DATA_NETWORKS = {
    mtn: {
        name: "MTN",
        logo: "mtn.png"
    },

    airtel: {
        name: "Airtel",
        logo: "airtel.png"
    },

    glo: {
        name: "Glo",
        logo: "glo.png"
    },

    t2: {
        name: "T2",
        logo: "9mobile.png"
    }
};


// =====================================================
// ADMIN - GET DATA NETWORKS
// =====================================================

app.get("/admin/data/networks", requireAdmin, async (req, res) => {
    try {

        const networks = [];

        for (const code of Object.keys(DATA_NETWORKS)) {

            const ref = db
                .collection("dataNetworks")
                .doc(code);

            const snap = await ref.get();

            if (!snap.exists) {

                await ref.set({
                    name: DATA_NETWORKS[code].name,
                    code: code,
                    logo: DATA_NETWORKS[code].logo,
                    enabled: true,
                    createdAt: new Date()
                });

                networks.push({
                    ...DATA_NETWORKS[code],
                    code: code,
                    enabled: true
                });

            } else {

                networks.push({
                    ...DATA_NETWORKS[code],
                    ...snap.data()
                });
            }
        }

        res.json({
            success: true,
            networks: networks
        });

    } catch (error) {

        console.error(
            "GET DATA NETWORKS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load networks"
        });
    }
});


// =====================================================
// ADMIN - ENABLE NETWORK
// =====================================================

app.post(
    "/admin/data/networks/:network/enable",
    requireAdmin,
    async (req, res) => {

        try {

            const network =
                String(req.params.network).toLowerCase();

            if (!DATA_NETWORKS[network]) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid network"
                });
            }

            await db
                .collection("dataNetworks")
                .doc(network)
                .set({
                    enabled: true,
                    updatedAt: new Date()
                }, {
                    merge: true
                });

            res.json({
                success: true,
                message: `${DATA_NETWORKS[network].name} enabled`
            });

        } catch (error) {

            console.error(
                "ENABLE NETWORK ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Failed to enable network"
            });
        }
    }
);


// =====================================================
// ADMIN - DISABLE NETWORK
// =====================================================

app.post(
    "/admin/data/networks/:network/disable",
    requireAdmin,
    async (req, res) => {

        try {

            const network =
                String(req.params.network).toLowerCase();

            if (!DATA_NETWORKS[network]) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid network"
                });
            }

            await db
                .collection("dataNetworks")
                .doc(network)
                .set({
                    enabled: false,
                    updatedAt: new Date()
                }, {
                    merge: true
                });

            res.json({
                success: true,
                message: `${DATA_NETWORKS[network].name} disabled`
            });

        } catch (error) {

            console.error(
                "DISABLE NETWORK ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Failed to disable network"
            });
        }
    }
);

// =====================================================
// ADMIN - GET DATA PLANS
// =====================================================

app.get("/admin/data/plans", requireAdmin, async (req, res) => {
    try {

        const network =
            String(req.query.network || "").toLowerCase();

        if (!BILAL_NETWORKS[network]) {
            return res.status(400).json({
                success: false,
                message: "Invalid network"
            });
        }

        const networkSettings = await db
            .collection("dataNetworks")
            .doc(network)
            .get();

        if (
            networkSettings.exists &&
            networkSettings.data().enabled === false
        ) {
            return res.status(403).json({
                success: false,
                message: "This network is currently disabled"
            });
        }

        const apiUrl =
            `https://bilalsadasub.com/api/v1/plans/data?network=${encodeURIComponent(network.toUpperCase())}`;

        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Authorization": `Token ${process.env.BILAL_API_TOKEN}`,
                "Accept": "application/json"
            }
        });

        const data = await response.json();

        if (!response.ok || data.status !== "success") {

            console.error(
                "ADMIN BILALSADASUB PLANS ERROR:",
                data
            );

            return res.status(502).json({
                success: false,
                message: "Failed to load data plans"
            });
        }

        return res.json({
            success: true,
            network: network.toUpperCase(),
            networkId: BILAL_NETWORKS[network],
            plans: Array.isArray(data.data)
                ? data.data
                : []
        });

    } catch (error) {

        console.error(
            "ADMIN GET DATA PLANS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error while loading data plans"
        });
    }
});

// =====================================================
// ADMIN - UPDATE DATA PLAN SELLING PRICE
// =====================================================

app.post("/admin/data/plans/price", requireAdmin, async (req, res) => {
    try {

        const network =
            String(req.body.network || "").toLowerCase();

        const planId =
            String(req.body.planId || "").trim();

        const sellingPrice =
            Number(req.body.sellingPrice);

        if (!BILAL_NETWORKS[network]) {
            return res.status(400).json({
                success: false,
                message: "Invalid network"
            });
        }

        if (!planId) {
            return res.status(400).json({
                success: false,
                message: "Plan ID is required"
            });
        }

        if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid selling price"
            });
        }

        await db
            .collection("dataPlanPrices")
            .doc(`${network}_${planId}`)
            .set({
                network,
                planId,
                sellingPrice,
                updatedAt: new Date()
            }, {
                merge: true
            });

        return res.json({
            success: true,
            message: "Data plan price updated successfully",
            network,
            planId,
            sellingPrice
        });

    } catch (error) {

        console.error(
            "ADMIN UPDATE DATA PLAN PRICE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error while updating data plan price"
        });
    }
});

// =====================================================
// USER - GET DATA PLANS WITH SELLING PRICE
// =====================================================

app.get("/api/data/plans", requireUser, async (req, res) => {
    try {

        const network =
            String(req.query.network || "").toLowerCase();

        // CHECK NETWORK
        const networkSettings = await db
            .collection("dataNetworks")
            .doc(network)
            .get();

        if (
            networkSettings.exists &&
            networkSettings.data().enabled === false
        ) {
            return res.status(403).json({
                success: false,
                message: "This network is currently unavailable"
            });
        }

        // CHECK NETWORK CODE
        if (!BILAL_NETWORKS[network]) {
            return res.status(400).json({
                success: false,
                message: "Invalid network"
            });
        }

        // GET PLANS FROM BILALSADASUB
        const apiUrl =
            `https://bilalsadasub.com/api/v1/plans/data?network=${encodeURIComponent(
                network.toUpperCase()
            )}`;

        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Authorization":
                    `Token ${process.env.BILAL_API_TOKEN}`,
                "Accept": "application/json"
            }
        });

        const data = await response.json();

        if (
            !response.ok ||
            data.status !== "success"
        ) {
            console.error(
                "BILALSADASUB PLANS ERROR:",
                data
            );

            return res.status(502).json({
                success: false,
                message: "Failed to load data plans"
            });
        }

        // =================================================
        // ADD ADMIN SELLING PRICE
        // =================================================

        const plans = Array.isArray(data.data)
            ? await Promise.all(
                data.data.map(async (plan) => {

                    const planId =
                        String(plan.plan_id);

                    const apiPrice =
                        Number(plan.amount) || 0;

                    const priceDoc = await db
                        .collection("dataPlanPrices")
                        .doc(`${network}_${planId}`)
                        .get();

                    let sellingPrice =
                        apiPrice;

                    if (priceDoc.exists) {

                        const priceData =
                            priceDoc.data();

                        const adminPrice =
                            Number(
                                priceData.sellingPrice
                            );

                        if (
                            Number.isFinite(adminPrice) &&
                            adminPrice > 0
                        ) {
                            sellingPrice =
                                adminPrice;
                        }
                    }

                    return {
                        ...plan,

                        apiPrice: apiPrice,

                        sellingPrice:
                            sellingPrice
                    };
                })
            )
            : [];

        // RETURN PLANS
        return res.json({
            success: true,
            network:
                network.toUpperCase(),

            networkId:
                BILAL_NETWORKS[network],

            plans: plans
        });

    } catch (error) {

        console.error(
            "BILALSADASUB PLANS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while loading data plans"
        });
    }
});

// =====================================================
// BILALSADASUB - BUY DATA
// =====================================================

app.post("/api/data/purchase", requireUser, async (req, res) => {
    try {
        const {
            network,
            phone,
            data_plan,
            pin
        } = req.body;

        // =========================
        // VALIDATION
        // =========================

        const networkName = String(network || "").toLowerCase();
        const phoneNumber = String(phone || "").trim();
        const planId = Number(data_plan);
        const transactionPin = String(pin || "");
        const networkSettings = await db
    .collection("dataNetworks")
    .doc(networkName)
    .get();

if (
    networkSettings.exists &&
    networkSettings.data().enabled === false
) {
    return res.status(403).json({
        success: false,
        message: "This network is currently unavailable"
    });
}
        if (!BILAL_NETWORKS[networkName]) {
            return res.status(400).json({
                success: false,
                message: "Invalid network"
            });
        }

        if (!/^\d{11}$/.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number"
            });
        }

        if (!Number.isInteger(planId) || planId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid data plan"
            });
        }

        if (!/^\d{4}$/.test(transactionPin)) {
            return res.status(400).json({
                success: false,
                message: "Enter your 4-digit transaction PIN"
            });
        }

        // =========================
        // GET USER
        // =========================

        const userRef = db
            .collection("users")
            .doc(req.user.userId);

        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = userDoc.data();

        if (user.blocked === true) {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked"
            });
        }

        // =========================
        // VERIFY TRANSACTION PIN
        // =========================

        if (!user.transactionPin) {
            return res.status(400).json({
                success: false,
                message: "Transaction PIN has not been set"
            });
        }

        if (String(user.transactionPin) !== transactionPin) {
            return res.status(401).json({
                success: false,
                message: "Incorrect transaction PIN"
            });
        }

        // =========================
        // GET PLAN FROM BILALSADASUB
        // =========================

        const plansResponse = await fetch(
            `https://bilalsadasub.com/api/v1/plans/data?network=${encodeURIComponent(networkName.toUpperCase())}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Token ${process.env.BILAL_API_TOKEN}`,
                    "Accept": "application/json"
                }
            }
        );

        const plansData = await plansResponse.json();

        if (
            !plansResponse.ok ||
            plansData.status !== "success" ||
            !Array.isArray(plansData.data)
        ) {
            console.error(
                "BILALSADASUB PLAN CHECK ERROR:",
                plansData
            );

            return res.status(502).json({
                success: false,
                message: "Unable to verify data plan"
            });
        }

        const selectedPlan = plansData.data.find(
            plan => Number(plan.plan_id) === planId
        );

        if (!selectedPlan) {
            return res.status(400).json({
                success: false,
                message: "Selected data plan is not available"
            });
        }

        // =========================
        // CHECK BALANCE
        // =========================

                // =========================
        // GET ADMIN SELLING PRICE
        // =========================

        const priceRef = db
            .collection("dataPlanPrices")
            .doc(`${networkName}_${planId}`);

        const priceDoc = await priceRef.get();

        const apiCost = Number(selectedPlan.amount);

        let amount = apiCost;

        if (priceDoc.exists) {
            const priceData = priceDoc.data();

            const adminPrice =
                Number(priceData.sellingPrice);

            if (
                Number.isFinite(adminPrice) &&
                adminPrice > 0
            ) {
                amount = adminPrice;
            }
        }

        const oldBalance =
            Number(user.balance) || 0;

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan amount"
            });
        }

        if (oldBalance < amount) {
            return res.status(400).json({
                success: false,
                message: "Insufficient wallet balance"
            });
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan amount"
            });
        }

        if (oldBalance < amount) {
            return res.status(400).json({
                success: false,
                message: "Insufficient wallet balance"
            });
        }

        // =========================
        // UNIQUE REQUEST ID
        // =========================

        const requestId =
            "Data_" +
            Date.now() +
            "_" +
            crypto.randomBytes(4).toString("hex");

        // =========================
        // BUY FROM BILALSADASUB
        // =========================

        const purchaseResponse = await fetch(
            "https://bilalsadasub.com/api/data",
            {
                method: "POST",
                headers: {
                    "Authorization": `Token ${process.env.BILAL_API_TOKEN}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    network: BILAL_NETWORKS[networkName],
                    phone: phoneNumber,
                    data_plan: planId,
                    bypass: false,
                    "request-id": requestId
                })
            }
        );

        const purchaseData = await purchaseResponse.json();

        console.log(
            "BILALSADASUB PURCHASE:",
            purchaseData
        );

        // =========================
        // PURCHASE FAILED
        // =========================

        if (
    !purchaseResponse.ok ||
    String(purchaseData.status).toLowerCase() !== "success"
) {
    return res.status(502).json({
        success: false,
        message: "Network is unavailable now. Please try again later."
    });
}

        // =========================
        // DEDUCT USER BALANCE
        // =========================

        const newBalance = oldBalance - amount;

        await userRef.update({
            balance: newBalance
        });

        // =========================
        // SAVE TRANSACTION HISTORY
        // =========================

        await userRef
            .collection("transactions")
            .add({
                type: "DATA",
                network: networkName.toUpperCase(),
                phone: phoneNumber,
                planId: String(planId),
                planName: selectedPlan.plan_name || "",
                planType: selectedPlan.plan_type || "",
                validity: selectedPlan.plan_day || "",
                amount: amount,
                status: "success",
                requestId: requestId,
                createdAt: new Date()
            });

        // =========================
        // SUCCESS
        // =========================

        res.json({
            success: true,
            message:
                purchaseData.message ||
                "Data purchase successful",

            transaction: {
                requestId: requestId,
                network: networkName.toUpperCase(),
                phone: phoneNumber,
                planName: selectedPlan.plan_name || "",
                amount: amount,
                status: "success"
            },

            oldBalance: oldBalance,
            newBalance: newBalance
        });

    } catch (error) {

        console.error(
            "BILALSADASUB DATA PURCHASE ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error while purchasing data"
        });
    }
});

// =====================================================
// USER - BUY AIRTIME
// =====================================================

app.post("/api/airtime/purchase", requireUser, async (req, res) => {
    try {

        const {
          network,
          phone,
          amount,
          plan_type,
          pin
       } = req.body;

        const networkName =
            String(network || "").toLowerCase().trim();

        const phoneNumber =
            String(phone || "").trim();

        const airtimeAmount =
            Number(amount);

        const airtimeType =
            String(plan_type || "VTU").toUpperCase().trim();
           
        const transactionPin = String(pin || "").trim();

            if (!/^\d{4}$/.test(transactionPin)) {
              return res.status(400).json({
                 success: false,
                  message: "Enter your 4-digit transaction PIN"
            });
         }
        // NETWORK IDs
        const AIRTIME_NETWORKS = {
            mtn: 1,
            airtel: 2,
            glo: 3,
            "9mobile": 4,
            t2: 4
        };

        // CHECK NETWORK
        if (!AIRTIME_NETWORKS[networkName]) {
            return res.status(400).json({
                success: false,
                message: "Invalid network"
            });
        }

        // CHECK PHONE
        if (!/^\d{11}$/.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number"
            });
        }

        // CHECK AMOUNT
        if (
            !Number.isInteger(airtimeAmount) ||
            airtimeAmount < 50 ||
            airtimeAmount > 50000
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Airtime amount must be between ₦50 and ₦50,000"
            });
        }

        // CHECK PLAN TYPE
        if (
            airtimeType !== "VTU" &&
            airtimeType !== "SNS"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid airtime type"
            });
        }

        // GET USER
        const userRef = db
            .collection("users")
            .doc(req.user.userId);

        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = userDoc.data();

        // CHECK BLOCKED USER
        if (user.blocked === true) {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked"
            });
        }
       
       if (!user.transactionPin) {
    return res.status(400).json({
        success: false,
        message: "Transaction PIN is not set"
    });
}

if (String(user.transactionPin) !== transactionPin) {
    return res.status(401).json({
        success: false,
        message: "Incorrect transaction PIN"
    });
}

        // CHECK BALANCE
        const oldBalance =
            Number(user.balance) || 0;

        if (oldBalance < airtimeAmount) {
            return res.status(400).json({
                success: false,
                message: "Insufficient wallet balance"
            });
        }

        // UNIQUE REQUEST ID
        const requestId =
            "AT_" +
            Date.now() +
            "_" +
            crypto.randomBytes(4).toString("hex");

        // SEND AIRTIME TO BILALSADASUB
        const purchaseResponse = await fetch(
            "https://bilalsadasub.com/api/topup",
            {
                method: "POST",

                headers: {
                    "Authorization":
                        `Token ${process.env.BILAL_API_TOKEN}`,

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body: JSON.stringify({
                    network:
                        AIRTIME_NETWORKS[networkName],

                    phone:
                        phoneNumber,

                    amount:
                        airtimeAmount,

                    plan_type:
                        airtimeType,

                    bypass:
                        false,

                    "request-id":
                        requestId
                })
            }
        );

        const purchaseData =
            await purchaseResponse.json();

        console.log(
            "BILALSADASUB AIRTIME PURCHASE:",
            purchaseData
        );

        // PURCHASE FAILED
        if (
    !purchaseResponse.ok ||
    String(purchaseData.status).toLowerCase() !== "success"
) {
    return res.status(502).json({
        success: false,
        message: "Network is unavailable now. Please try again later."
    });
}

        // DEDUCT WALLET
        const newBalance =
            oldBalance - airtimeAmount;

        await userRef.update({
            balance: newBalance
        });

        // SAVE TRANSACTION
        await userRef
            .collection("transactions")
            .add({
                type: "AIRTIME",

                network:
                    networkName.toUpperCase(),

                phone:
                    phoneNumber,

                amount:
                    airtimeAmount,

                planType:
                    airtimeType,

                status:
                    "success",

                requestId:
                    requestId,

                createdAt:
                    new Date()
            });

        // SUCCESS
        return res.json({
            success: true,

            message:
                purchaseData.message ||
                "Airtime purchase successful",

            transaction: {
                requestId:
                    requestId,

                network:
                    networkName.toUpperCase(),

                phone:
                    phoneNumber,

                amount:
                    airtimeAmount,

                planType:
                    airtimeType,

                status:
                    "success"
            },

            oldBalance:
                oldBalance,

            newBalance:
                newBalance
        });

    } catch (error) {

        console.error(
            "BILALSADASUB AIRTIME PURCHASE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while purchasing airtime"
        });
    }
});

app.post("/admin/airtime-pins", requireAdmin, async (req, res) => {
    try {

        const { network, amount, pin } = req.body;

        if (!network || !amount || !pin) {
            return res.status(400).json({
                success: false,
                message: "Network, amount and PIN are required"
            });
        }

        const cleanNetwork = String(network).toUpperCase().trim();
        const cleanPin = String(pin).trim();
        const cleanAmount = Number(amount);

        const allowedNetworks = [
            "MTN",
            "AIRTEL",
            "GLO",
            "9MOBILE"
        ];

        if (!allowedNetworks.includes(cleanNetwork)) {
            return res.status(400).json({
                success: false,
                message: "Invalid network"
            });
        }

        if (!Number.isFinite(cleanAmount) || cleanAmount < 100) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount"
            });
        }

        if (!cleanPin) {
            return res.status(400).json({
                success: false,
                message: "Invalid PIN"
            });
        }

        const existing = await db
            .collection("airtimePins")
            .where("pin", "==", cleanPin)
            .limit(1)
            .get();

        if (!existing.empty) {
            return res.status(409).json({
                success: false,
                message: "This PIN has already been uploaded"
            });
        }

        const docRef = await db.collection("airtimePins").add({
            network: cleanNetwork,
            amount: cleanAmount,
            pin: cleanPin,
            status: "available",
            uploadedAt: new Date(),
            soldAt: null,
            soldTo: null
        });

        res.json({
            success: true,
            message: "Airtime PIN uploaded successfully",
            pinId: docRef.id
        });

    } catch (error) {

        console.error("ADMIN UPLOAD PIN ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to upload Airtime PIN"
        });
    }
});

// ===============================
// ADMIN AIRTIME PIN LIST
// ===============================
app.get("/admin/airtime-pins", requireAdmin, async (req, res) => {
    try {

        const snapshot = await db
            .collection("airtimePins")
            .orderBy("uploadedAt", "desc")
            .get();

        const pins = [];

        snapshot.forEach(doc => {
            const data = doc.data();

            pins.push({
                id: doc.id,
                network: data.network || "",
                amount: data.amount || 0,
                pin: data.pin || "",
                status: data.status || "available",
                uploadedAt: data.uploadedAt || null,
                soldAt: data.soldAt || null,
                soldTo: data.soldTo || null
            });
        });

        const available = pins.filter(
            pin => pin.status === "available"
        ).length;

        const used = pins.filter(
            pin => pin.status === "sold" || pin.status === "used"
        ).length;

        res.json({
            success: true,
            available,
            used,
            pins
        });

    } catch (error) {

        console.error(
            "ADMIN AIRTIME PIN LIST ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load Airtime PINs"
        });
    }
});

// ===============================
// ADMIN DELETE AIRTIME PIN
// ===============================
app.delete("/admin/airtime-pins/:id", requireAdmin, async (req, res) => {
    try {
        const pinId = req.params.id;

        if (!pinId) {
            return res.status(400).json({
                success: false,
                message: "PIN ID is required"
            });
        }

        const pinRef = db.collection("airtimePins").doc(pinId);
        const pinDoc = await pinRef.get();

        if (!pinDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "PIN not found"
            });
        }

        const pinData = pinDoc.data();

        if (pinData.status !== "available") {
            return res.status(400).json({
                success: false,
                message: "Sold PIN cannot be deleted"
            });
        }

        await pinRef.delete();

        res.json({
            success: true,
            message: "PIN deleted successfully"
        });

    } catch (error) {
        console.error("ADMIN DELETE PIN ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete PIN"
        });
    }
});

// ===============================
// USER BUY AIRTIME PIN
// ===============================
app.post("/api/airtime-pin/purchase", requireUser, async (req, res) => {
    try {

        const { network, amount, pin } = req.body;

        const cleanNetwork =
            String(network || "").toUpperCase().trim();

        const cleanAmount =
            Number(amount);

        const cleanPin =
            String(pin || "").trim();

        const allowedNetworks = [
            "MTN",
            "AIRTEL",
            "GLO",
            "9MOBILE"
        ];

        if (!allowedNetworks.includes(cleanNetwork)) {
            return res.status(400).json({
                success: false,
                message: "Invalid network"
            });
        }

        if (!Number.isFinite(cleanAmount) || cleanAmount < 100) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount"
            });
        }

        if (!/^\d{4}$/.test(cleanPin)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction PIN"
            });
        }

        const uid = req.user.uid;

        const userRef =
            db.collection("users").doc(uid);

        const pinsQuery = await db
            .collection("airtimePins")
            .where("network", "==", cleanNetwork)
            .where("amount", "==", cleanAmount)
            .where("status", "==", "available")
            .limit(1)
            .get();

        if (pinsQuery.empty) {
            return res.status(404).json({
                success: false,
                message: "No PIN available for this network and amount"
            });
        }

        const pinDoc = pinsQuery.docs[0];
        const pinRef = pinDoc.ref;

        let purchasedPin = null;

        await db.runTransaction(async transaction => {

            const userDoc =
                await transaction.get(userRef);

            const currentPinDoc =
                await transaction.get(pinRef);

            if (!userDoc.exists) {
                throw new Error("USER_NOT_FOUND");
            }

            if (!currentPinDoc.exists) {
                throw new Error("PIN_NOT_FOUND");
            }

            const userData =
                userDoc.data();

            const currentPin =
                currentPinDoc.data();

            if (currentPin.status !== "available") {
                throw new Error("PIN_ALREADY_SOLD");
            }

            const balance =
                Number(userData.balance || 0);

            if (balance < cleanAmount) {
                throw new Error("INSUFFICIENT_BALANCE");
            }

            purchasedPin = currentPin.pin;

            transaction.update(userRef, {
                balance: balance - cleanAmount
            });

            transaction.update(pinRef, {
                status: "sold",
                soldAt: new Date(),
                soldTo: uid
            });

            const transactionRef =
                userRef.collection("transactions").doc();

            transaction.set(transactionRef, {
                type: "AIRTIME_PIN",
                network: cleanNetwork,
                amount: cleanAmount,
                pin: currentPin.pin,
                status: "success",
                createdAt: new Date()
            });
        });

        res.json({
            success: true,
            message: "Airtime PIN purchased successfully",
            pin: purchasedPin,
            network: cleanNetwork,
            amount: cleanAmount
        });

    } catch (error) {

        console.error(
            "AIRTIME PIN PURCHASE ERROR:",
            error
        );

        if (error.message === "USER_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (error.message === "PIN_ALREADY_SOLD") {
            return res.status(409).json({
                success: false,
                message: "This PIN has already been sold"
            });
        }

        if (error.message === "INSUFFICIENT_BALANCE") {
            return res.status(400).json({
                success: false,
                message: "Insufficient balance"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to purchase Airtime PIN"
        });
    }
});

// ==========================================
// USER TRANSACTION HISTORY
// ==========================================

app.get("/api/user/history", requireUser, async (req, res) => {

    try {

        const uid = req.user.uid;

        if (!uid) {
            return res.status(401).json({
                success: false,
                message: "User ID not found"
            });
        }

        const snapshot = await db
            .collection("users")
            .doc(uid)
            .collection("transactions")
            .orderBy("createdAt", "desc")
            .limit(100)
            .get();

        const transactions = [];

        snapshot.forEach(doc => {

            const data = doc.data();

            transactions.push({
                id: doc.id,
                ...data
            });

        });

        res.json({
            success: true,
            transactions
        });

    } catch (error) {

        console.error(
            "USER HISTORY ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load transaction history"
        });

    }

});

// ===============================
// FUND REQUEST API
// ===============================

app.post("/api/fund-request", requireUser, async (req, res) => {
    try {
        const uid = req.user.uid;
        const amount = Number(req.body.amount);

        if (!uid) {
            return res.status(401).json({
                success: false,
                message: "User ID not found"
            });
        }

        if (!amount || amount < 100) {
            return res.status(400).json({
                success: false,
                message: "Minimum fund amount is ₦100"
            });
        }

        const userRef = db.collection("users").doc(uid);

// CHECK EXISTING PENDING REQUEST
const pendingSnapshot = await userRef
    .collection("fundRequests")
    .where("status", "==", "pending")
    .limit(1)
    .get();

if (!pendingSnapshot.empty) {
    return res.status(400).json({
        success: false,
        message: "Please let admin accept or reject your old request before making another request."
    });
}

const requestRef = userRef
    .collection("fundRequests")
    .doc();

        await requestRef.set({
            amount: amount,
            status: "pending",
            createdAt: new Date(),
            approvedAt: null,
            rejectedAt: null
        });

        res.json({
            success: true,
            message: "Fund request submitted successfully",
            requestId: requestRef.id,
            amount: amount,
            status: "pending"
        });

    } catch (error) {

        console.error("FUND REQUEST ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to submit fund request"
        });
    }
});

// ===============================
// GET FUND REQUEST STATUS
// ===============================

app.get("/api/fund-request", requireUser, async (req, res) => {
    try {
        const uid = req.user.uid;

        const snapshot = await db
            .collection("users")
            .doc(uid)
            .collection("fundRequests")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.json({
                success: true,
                request: null
            });
        }

        const doc = snapshot.docs[0];

        res.json({
            success: true,
            request: {
                id: doc.id,
                ...doc.data()
            }
        });

    } catch (error) {

        console.error("GET FUND REQUEST ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load fund request"
        });
    }
});

// ===============================
// ADMIN FUND REQUESTS
// ===============================

app.get("/admin/fund-requests", requireAdmin, async (req, res) => {
    try {

        const snapshot = await db
            .collectionGroup("fundRequests")
            .limit(100)
            .get();

        const requests = await Promise.all(
            snapshot.docs.map(async (doc) => {

                const data = doc.data();

                const userRef = doc.ref.parent.parent;

                let userData = {};

                if (userRef) {
                    const userSnap = await userRef.get();

                    if (userSnap.exists) {
                        userData = userSnap.data();
                    }
                }

                return {
                    id: doc.id,

                    userId: userRef ? userRef.id : null,

                    // USER DETAILS
                    name: userData.name || "Unknown User",
                    username: userData.username || "",
                    email: userData.email || "",
                    phone: userData.phone || "",

                    // REQUEST DETAILS
                    amount: data.amount || 0,
                    status: data.status || "pending",
                    createdAt: data.createdAt || null,
                    approvedAt: data.approvedAt || null,
                    rejectedAt: data.rejectedAt || null
                };
            })
        );

        // Latest requests first
        requests.sort((a, b) => {

            const dateA = a.createdAt?.toDate
                ? a.createdAt.toDate()
                : new Date(a.createdAt || 0);

            const dateB = b.createdAt?.toDate
                ? b.createdAt.toDate()
                : new Date(b.createdAt || 0);

            return dateB - dateA;
        });

        res.json({
            success: true,
            requests
        });

    } catch (error) {

        console.error(
            "ADMIN FUND REQUESTS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load fund requests"
        });
    }
});

// ===============================
// APPROVE FUND REQUEST
// ===============================

app.post("/admin/fund-requests/:userId/:requestId/approve", requireAdmin, async (req, res) => {
    try {
        const { userId, requestId } = req.params;

        const userRef = db.collection("users").doc(userId);
        
        
        const requestRef = userRef.collection("fundRequests").doc(requestId);

        await db.runTransaction(async (transaction) => {

            const userSnap = await transaction.get(userRef);
            const requestSnap = await transaction.get(requestRef);

            if (!userSnap.exists) {
                throw new Error("USER_NOT_FOUND");
            }

            if (!requestSnap.exists) {
                throw new Error("REQUEST_NOT_FOUND");
            }

            const userData = userSnap.data();
            const requestData = requestSnap.data();

            if (String(requestData.status).toLowerCase() !== "pending") {
                throw new Error("REQUEST_ALREADY_PROCESSED");
            }

            const amount = Number(requestData.amount || 0);

            if (!amount || amount < 100) {
                throw new Error("INVALID_AMOUNT");
            }

            const currentBalance = Number(userData.balance || 0);
            const newBalance = currentBalance + amount;

            transaction.update(userRef, {
                balance: newBalance
            });

            transaction.update(requestRef, {
                status: "approved",
                approvedAt: new Date()
            });

            const transactionRef = userRef
                .collection("transactions")
                .doc();

            transaction.set(transactionRef, {
                type: "FUND",
                amount: amount,
                status: "approved",
                requestId: requestId,
                createdAt: new Date()
            });
        });

        res.json({
            success: true,
            message: "Fund request approved successfully"
        });

    } catch (error) {

        console.error("APPROVE FUND REQUEST ERROR:", error);

        if (error.message === "USER_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (error.message === "REQUEST_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Fund request not found"
            });
        }

        if (error.message === "REQUEST_ALREADY_PROCESSED") {
            return res.status(400).json({
                success: false,
                message: "This fund request has already been processed"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to approve fund request"
        });
    }
});

// ===============================
// REJECT FUND REQUEST
// ===============================

app.post("/admin/fund-requests/:userId/:requestId/reject", requireAdmin, async (req, res) => {
    try {
        const { userId, requestId } = req.params;

        const userRef = db.collection("users").doc(userId);
        const requestRef = userRef
            .collection("fundRequests")
            .doc(requestId);

        await db.runTransaction(async (transaction) => {

            const requestSnap = await transaction.get(requestRef);

            if (!requestSnap.exists) {
                throw new Error("REQUEST_NOT_FOUND");
            }

            const requestData = requestSnap.data();

            if (String(requestData.status).toLowerCase() !== "pending") {
                throw new Error("REQUEST_ALREADY_PROCESSED");
            }

            transaction.update(requestRef, {
    status: "rejected",
    rejectedAt: new Date()
});

const transactionRef = userRef
    .collection("transactions")
    .doc();

transaction.set(transactionRef, {
    type: "FUND",
    amount: Number(requestData.amount || 0),
    status: "rejected",
    requestId: requestId,
    createdAt: new Date()
           });

        });

        res.json({
            success: true,
            message: "Fund request rejected successfully"
        });

    } catch (error) {

        console.error("REJECT FUND REQUEST ERROR:", error);

        if (error.message === "REQUEST_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Fund request not found"
            });
        }

        if (error.message === "REQUEST_ALREADY_PROCESSED") {
            return res.status(400).json({
                success: false,
                message: "This fund request has already been processed"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to reject fund request"
        });
    }
});

// ==========================================
// ADMIN DASHBOARD OVERVIEW
// ==========================================

app.get("/admin/dashboard-stats", requireAdmin, async (req, res) => {

    try {

        // =========================
        // GET ALL USERS
        // =========================

        const usersSnapshot = await db
            .collection("users")
            .get();

        let totalUsers = usersSnapshot.size;
        let totalBalance = 0;

        usersSnapshot.forEach(doc => {

            const user = doc.data();

            totalBalance += Number(
                user.balance || 0
            );

        });


        // =========================
        // GET FUND REQUESTS + TRANSACTIONS
        // =========================

        const userDataPromises =
            usersSnapshot.docs.map(async (userDoc) => {

                const userRef = db
                    .collection("users")
                    .doc(userDoc.id);

                // FUND REQUESTS
                const fundSnapshot =
                    await userRef
                        .collection("fundRequests")
                        .get();

                // TRANSACTIONS
                const transactionSnapshot =
                    await userRef
                        .collection("transactions")
                        .get();

                const userData =
                    userDoc.data();

                return {

                    fundRequests:
                        fundSnapshot.docs.map(doc => ({
                            id: doc.id,
                            userId: userDoc.id,
                            ...doc.data()
                        })),

                    transactions:
                        transactionSnapshot.docs.map(doc => ({
                            id: doc.id,
                            userId: userDoc.id,

                            name:
                                userData.name ||
                                "Unknown User",

                            username:
                                userData.username ||
                                "",

                            email:
                                userData.email ||
                                "",

                            phone:
                                userData.phone ||
                                "",

                            ...doc.data()
                        }))

                };

            });


        const userResults =
            await Promise.all(
                userDataPromises
            );


        // =========================
        // PENDING FUNDING
        // =========================

        let pendingFunding = 0;

        userResults.forEach(user => {

            user.fundRequests.forEach(request => {

                if (
                    String(request.status || "")
                        .toLowerCase() === "pending"
                ) {

                    pendingFunding++;

                }

            });

        });


        // =========================
        // ALL TRANSACTIONS
        // =========================

        const allTransactions =
            userResults.flatMap(
                user => user.transactions
            );


        // =========================
        // TOTAL TRANSACTIONS
        // =========================

        const totalTransactions =
            allTransactions.length;


        // =========================
        // TODAY'S SALES
        // =========================

        const todayNigeria =
            new Intl.DateTimeFormat(
                "en-CA",
                {
                    timeZone: "Africa/Lagos",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                }
            ).format(new Date());


        let todaysSales = 0;


        allTransactions.forEach(transaction => {

            const status =
                String(
                    transaction.status || ""
                ).toLowerCase();


            // Only successful transactions
            if (
                status !== "success" &&
                status !== "approved"
            ) {
                return;
            }


            // FUND is wallet funding,
            // not product sales
            const type =
                String(
                    transaction.type || ""
                ).toUpperCase();


            if (type === "FUND") {
                return;
            }


            if (!transaction.createdAt) {
                return;
            }


            let createdAt;


            if (
                typeof transaction.createdAt.toDate ===
                "function"
            ) {

                createdAt =
                    transaction.createdAt.toDate();

            } else {

                createdAt =
                    new Date(
                        transaction.createdAt
                    );

            }


            if (
                Number.isNaN(
                    createdAt.getTime()
                )
            ) {
                return;
            }


            const transactionNigeriaDate =
                new Intl.DateTimeFormat(
                    "en-CA",
                    {
                        timeZone: "Africa/Lagos",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                    }
                ).format(createdAt);


            if (
                transactionNigeriaDate ===
                todayNigeria
            ) {

                todaysSales +=
                    Number(
                        transaction.amount || 0
                    );

            }

        });


        // =========================
        // RECENT TRANSACTIONS
        // =========================

        allTransactions.sort((a, b) => {

            const dateA =
                a.createdAt?.toDate
                    ? a.createdAt.toDate()
                    : new Date(
                        a.createdAt || 0
                    );


            const dateB =
                b.createdAt?.toDate
                    ? b.createdAt.toDate()
                    : new Date(
                        b.createdAt || 0
                    );


            return dateB - dateA;

        });


        const recentTransactions =
            allTransactions.slice(0, 5);


        // =========================
        // RESPONSE
        // =========================

        res.json({

            success: true,

            stats: {

                totalUsers,
                totalBalance,
                pendingFunding,
                totalTransactions,
                todaysSales

            },

            recentTransactions

        });


    } catch (error) {

        console.error(
            "ADMIN DASHBOARD STATS ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to load dashboard statistics"

        });

    }

});

// ==========================================
// ADMIN - ALL TRANSACTIONS
// ==========================================

app.get("/admin/transactions", requireAdmin, async (req, res) => {
    try {

        const usersSnapshot = await db
            .collection("users")
            .get();

        let allTransactions = [];

        const transactionPromises = usersSnapshot.docs.map(
            async (userDoc) => {

                const userData = userDoc.data();

                const snapshot = await db
                    .collection("users")
                    .doc(userDoc.id)
                    .collection("transactions")
                    .get();

                return snapshot.docs.map(doc => ({
                    id: doc.id,

                    // USER DETAILS
                    userId: userDoc.id,
                    name: userData.name || "Unknown User",
                    username: userData.username || "",
                    email: userData.email || "",
                    phone: userData.phone || "",

                    // TRANSACTION DETAILS
                    ...doc.data()
                }));
            }
        );

        const results =
            await Promise.all(transactionPromises);

        allTransactions = results.flat();

        // Sort newest first
        allTransactions.sort((a, b) => {

            const dateA = a.createdAt?.toDate
                ? a.createdAt.toDate()
                : new Date(a.createdAt || 0);

            const dateB = b.createdAt?.toDate
                ? b.createdAt.toDate()
                : new Date(b.createdAt || 0);

            return dateB - dateA;
        });

        res.json({
            success: true,
            transactions: allTransactions
        });

    } catch (error) {

        console.error(
            "ADMIN TRANSACTIONS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load transactions"
        });
    }
});

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server yana gudana a port ${PORT}`);
});
