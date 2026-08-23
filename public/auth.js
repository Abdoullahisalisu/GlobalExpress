// ================================
// GE DATA AUTHENTICATION
// ================================

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const loginForm = document.getElementById("loginForm");

const showPinLogin = document.getElementById("showPinLogin");
const backToPasswordLogin = document.getElementById("backToPasswordLogin");
const pinLoginBox = document.getElementById("pinLoginBox");

if (showPinLogin) {
    showPinLogin.onclick = () => {
        loginForm.style.display = "none";
        pinLoginBox.style.display = "block";
    };
}

if (backToPasswordLogin) {
    backToPasswordLogin.onclick = () => {
        pinLoginBox.style.display = "none";
        loginForm.style.display = "block";
    };
}

// ==========================================
// LOGIN WITH PIN PREFERENCE
// ==========================================

const savedLoginPin =
    localStorage.getItem("geLoginWithPin");

if (
    savedLoginPin === "true" &&
    loginForm &&
    pinLoginBox
) {
    loginForm.style.display = "none";
    pinLoginBox.style.display = "block";
}

const signupForm = document.getElementById("signupForm");

// ================================
// OPEN LOGIN
// ================================

loginTab.onclick = () => {

    loginTab.classList.add("active");
    signupTab.classList.remove("active");

    signupForm.style.display = "none";
    loginForm.style.display = "block";

    loginForm.animate(
        [
            { opacity: 0, transform: "translateX(-20px)" },
            { opacity: 1, transform: "translateX(0)" }
        ],
        {
            duration: 300
        }
    );
};

// ================================
// OPEN SIGNUP
// ================================

signupTab.onclick = () => {

    signupTab.classList.add("active");
    loginTab.classList.remove("active");

    loginForm.style.display = "none";
    signupForm.style.display = "block";

    signupForm.animate(
        [
            { opacity: 0, transform: "translateX(20px)" },
            { opacity: 1, transform: "translateX(0)" }
        ],
        {
            duration: 300
        }
    );
};

// ================================
// LOGIN PASSWORD EYE
// ================================

const loginEye = document.getElementById("loginEye");
const loginPassword = document.getElementById("loginPassword");

if (loginEye) {

    loginEye.onclick = () => {

        if (loginPassword.type === "password") {

            loginPassword.type = "text";

            loginEye.className =
                "fa-solid fa-eye-slash eye";

        } else {

            loginPassword.type = "password";

            loginEye.className =
                "fa-solid fa-eye eye";
        }
    };
}

// ================================
// SIGNUP PASSWORD EYES
// ================================

document
.querySelectorAll("#signupForm input[type=password]")
.forEach(input => {

    const eye = document.createElement("i");

    eye.className = "fa-solid fa-eye eye";

    input.parentElement.appendChild(eye);

    eye.onclick = () => {

        if (input.type === "password") {

            input.type = "text";

            eye.className =
                "fa-solid fa-eye-slash eye";

        } else {

            input.type = "password";

            eye.className =
                "fa-solid fa-eye eye";
        }
    };
});

// ================================
// LOGIN
// ================================

const loginBtn = document.getElementById("loginBtn");

loginBtn.onclick = async () => {

    const email = document
        .getElementById("loginEmail")
        .value
        .trim();

    const password = document
        .getElementById("loginPassword")
        .value;

    if (!email || !password) {

        alert("Please enter email and password.");

        return;
    }

    loginBtn.disabled = true;

    loginBtn.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Please wait...
    `;

    try {

        const response = await fetch("/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password
            })

        });

        const data = await response.json();

        if (data.success) {

    localStorage.setItem(
        "ge_token",
        data.token
    );

    localStorage.setItem(
        "ge_user",
        JSON.stringify(data.user)
    );

    alert("Login Successful!");

    window.location.href = "/dash2.html";

} else {

    alert(data.message || "Login failed.");

}

    } catch (error) {

        console.error(error);

        alert(
        "Network failed. Please try again later."
    );

    } finally {

        loginBtn.disabled = false;

        loginBtn.innerHTML = "Login";
    }
};

// ================================
// SIGNUP
// ================================

const signupBtn = document.getElementById("signupBtn");

signupBtn.onclick = async () => {

    const name = document
        .getElementById("fullname")
        .value
        .trim();

    const username = document
        .getElementById("username")
        .value
        .trim();

    const email = document
        .getElementById("email")
        .value
        .trim();

    const phone = document
        .getElementById("phone")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value;

    const confirmPassword = document
        .getElementById("confirmPassword")
        .value;

    const referral = document
        .getElementById("referral")
        .value
        .trim();

    // ================================
    // VALIDATION
    // ================================

    if (!name || !username || !email || !phone || !password) {

        alert("Please fill all required fields.");

        return;
    }

    if (password !== confirmPassword) {

        alert("Passwords do not match.");

        return;
    }

    if (password.length < 6) {

        alert("Password must be at least 6 characters.");

        return;
    }

    signupBtn.disabled = true;

    signupBtn.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Creating...
    `;

    try {

        const response = await fetch("/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                name: name,
                username: username,
                email: email,
                phone: phone,
                password: password,
                referral: referral

            })

        });

        const data = await response.json();

        if (data.success) {

            alert("Registration Successful!");

            signupForm.reset();

            loginTab.click();

        } else {

            alert(data.message || "Registration failed.");

        }

    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to server. Please try again."
        );

    } finally {

        signupBtn.disabled = false;

        signupBtn.innerHTML = "Create Account";
    }
};

// ================================
// FORGOT PASSWORD
// ================================

const forgotLink = document.querySelector(".forgot");

if (forgotLink) {
    forgotLink.addEventListener("click", async (e) => {
        e.preventDefault();

        const email = prompt(
            "Enter your GE DATA account email:"
        );

        if (!email) {
            return;
        }

        try {
            forgotLink.textContent = "Sending...";

            const response = await fetch("/forgot-password", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email.trim()
                })
            });

            const data = await response.json();

            alert(
                data.message ||
                "If this email exists, a reset link has been sent."
            );

        } catch (error) {
            console.error(error);

            alert(
                "Unable to connect to server. Please try again."
            );

        } finally {
            forgotLink.textContent = "Forgot Password?";
        }
    });
}


// ================================
// CUSTOM UI ALERT SYSTEM
// ================================

const customAlert = document.getElementById("customAlert");
const customAlertTitle = document.getElementById("customAlertTitle");
const customAlertMessage = document.getElementById("customAlertMessage");
const customAlertIcon = document.getElementById("customAlertIcon");
const customAlertClose = document.getElementById("customAlertClose");

let customAlertTimer;

function showCustomAlert(message, type = "success") {

    if (!customAlert) {
        console.warn("Custom alert element not found.");
        return;
    }

    clearTimeout(customAlertTimer);

    // Message
    customAlertMessage.textContent = message;

    // Default
    let title = "Success";
    let icon = "fa-circle-check";

    // SUCCESS
    if (type === "success") {
        title = "Success";
        icon = "fa-circle-check";

        customAlertIcon.style.background = "#dcfce7";
        customAlertIcon.style.color = "#16a34a";
    }

    // ERROR
    if (type === "error") {
        title = "Error";
        icon = "fa-circle-xmark";

        customAlertIcon.style.background = "#fee2e2";
        customAlertIcon.style.color = "#dc2626";
    }

    // INFO
    if (type === "info") {
        title = "Information";
        icon = "fa-circle-info";

        customAlertIcon.style.background = "#dbeafe";
        customAlertIcon.style.color = "#2563eb";
    }

    customAlertTitle.textContent = title;

    customAlertIcon.innerHTML = `
        <i class="fa-solid ${icon}"></i>
    `;

    customAlert.classList.add("show");

    // Auto close
    customAlertTimer = setTimeout(() => {
        customAlert.classList.remove("show");
    }, 4000);
}


// CLOSE BUTTON

if (customAlertClose) {

    customAlertClose.addEventListener("click", () => {

        clearTimeout(customAlertTimer);

        customAlert.classList.remove("show");

    });

}


// REPLACE NORMAL BROWSER ALERT

window.alert = function(message) {

    showCustomAlert(
        message,
        "error"
    );

};

// ==========================================
// LOGIN WITH PIN
// ==========================================

// ==========================================
// LOGIN WITH PIN
// ==========================================

const pinLoginBtn = document.getElementById("pinLoginBtn");

if (pinLoginBtn) {

    pinLoginBtn.onclick = async () => {

        const email = document
            .getElementById("pinLoginEmail")
            .value
            .trim();

        const pin = document
            .getElementById("loginPin")
            .value
            .trim();

        if (!email || !pin) {
            alert("Please enter email/username and PIN.");
            return;
        }

        if (!/^\d{4}$/.test(pin)) {
            alert("PIN must be exactly 4 digits.");
            return;
        }

        pinLoginBtn.disabled = true;
        pinLoginBtn.innerHTML = "Please wait...";

        try {

            const response = await fetch("/login-pin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    pin: pin
                })
            });

            const data = await response.json();

            if (data.success) {

                localStorage.setItem(
                    "ge_token",
                    data.token
                );

                localStorage.setItem(
                    "ge_user",
                    JSON.stringify(data.user)
                );

                alert("Login Successful!");

                window.location.href = "/dash2.html";

            } else {

                alert(data.message || "PIN login failed.");

            }

        } catch (error) {

            console.error(error);

            alert("Network failed. Please try again.");

        } finally {

            pinLoginBtn.disabled = false;
            pinLoginBtn.innerHTML = "Login with PIN";

        }

    };

}


// ==========================================
// SHOW / HIDE PIN LOGIN
// ==========================================


// ==========================================
// GE DATA SPLASH SCREEN
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const splashScreen =
        document.getElementById("splashScreen");

    if (!splashScreen) return;

    setTimeout(() => {

        splashScreen.classList.add("hide");

        // Remove splash completely after animation
        setTimeout(() => {

            splashScreen.style.display = "none";

        }, 650);

    }, 2000);

});	
