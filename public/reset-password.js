const resetForm = document.getElementById("resetForm");
const resetBtn = document.getElementById("resetBtn");
const message = document.getElementById("message");

// Get reset token from URL
const params = new URLSearchParams(window.location.search);
const token = params.get("token");

if (!token) {
    message.textContent = "Invalid or missing reset link.";
    message.style.color = "red";
    resetBtn.disabled = true;
}

resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newPassword =
        document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (newPassword.length < 6) {
        message.textContent =
            "Password must be at least 6 characters.";

        message.style.color = "red";
        return;
    }

    if (newPassword !== confirmPassword) {
        message.textContent =
            "Passwords do not match.";

        message.style.color = "red";
        return;
    }

    resetBtn.disabled = true;
    resetBtn.textContent = "Resetting...";

    try {
        const response = await fetch("/reset-password", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                token: token,
                password: newPassword
            })
        });

        const data = await response.json();

        if (data.success) {
            message.textContent =
                "Password reset successful. You can now login.";

            message.style.color = "green";

            resetForm.reset();

            setTimeout(() => {
                window.location.href = "/auth.html";
            }, 2000);

        } else {
            message.textContent =
                data.message || "Password reset failed.";

            message.style.color = "red";
        }

    } catch (error) {
        console.error(error);

        message.textContent =
            "Unable to connect to server.";

        message.style.color = "red";

    } finally {
        resetBtn.disabled = false;
        resetBtn.textContent = "Reset Password";
    }
});
