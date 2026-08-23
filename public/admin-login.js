const loginForm = document.getElementById("adminLoginForm");
const loginBtn = document.getElementById("adminLoginBtn");
const message = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email =
        document.getElementById("adminEmail").value.trim();

    const password =
        document.getElementById("adminPassword").value;

    if (!email || !password) {

        showMessage(
            "Please enter email and password",
            "error"
        );

        return;
    }

    loginBtn.disabled = true;

    loginBtn.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Please wait...
    `;

    try {

        const response = await fetch("/admin/login", {

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

        if (!data.success) {

            showMessage(
                data.message || "Login failed",
                "error"
            );

            loginBtn.disabled = false;

            loginBtn.innerHTML = "Login";

            return;
        }


        // =================================
        // SAVE ADMIN SESSION
        // =================================

        sessionStorage.setItem(
            "ge_admin_token",
            data.token
        );

        sessionStorage.setItem(
            "ge_admin",
            JSON.stringify(data.admin)
        );


        showMessage(
            "Login successful",
            "success"
        );


        // =================================
        // OPEN ADMIN PANEL
        // =================================

        setTimeout(() => {

            window.location.href =
                "/admin.html";

        }, 500);


    } catch (error) {

        console.error(
            "ADMIN LOGIN ERROR:",
            error
        );

        showMessage(
            "Cannot connect to server",
            "error"
        );

        loginBtn.disabled = false;

        loginBtn.innerHTML = "Login";

    }

});


// =================================
// MESSAGE
// =================================

function showMessage(text, type) {

    if (!message) return;

    message.textContent = text;

    message.className =
        "loginMessage " + type;

}	
