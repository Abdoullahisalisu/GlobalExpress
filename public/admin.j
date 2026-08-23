// =========================
// ADMIN SESSION
// =========================

const adminData = sessionStorage.getItem("ge_admin");

if (!adminData) {
    window.location.href = "/admin-login.html";
}


// =========================
// LOGOUT
// =========================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        sessionStorage.removeItem("ge_admin");

        window.location.href = "/admin-login.html";

    });

}


// =========================
// ALL NAVIGATION BUTTONS
// =========================

const navigationItems = document.querySelectorAll(
    ".sideItem, .navItem"
);


// =========================
// ALL ADMIN PAGES
// =========================

const adminPages = document.querySelectorAll(
    ".adminPage"
);


// =========================
// OPEN PAGE FUNCTION
// =========================

function openAdminPage(pageName) {

    // Hide every page
    adminPages.forEach(page => {

        page.classList.remove("active");

    });


    // Show selected page
    const selectedPage =
        document.getElementById(pageName + "Page");

    if (selectedPage) {

        selectedPage.classList.add("active");

    }


    // Update desktop sidebar
    document.querySelectorAll(".sideItem")
        .forEach(item => {

            item.classList.remove("active");

            if (item.dataset.page === pageName) {

                item.classList.add("active");

            }

        });


    // Update mobile navigation
    document.querySelectorAll(".navItem")
        .forEach(item => {

            item.classList.remove("active");

            if (item.dataset.page === pageName) {

                item.classList.add("active");

            }

        });


    // Scroll to top
    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}


// =========================
// NAVIGATION EVENTS
// =========================

navigationItems.forEach(item => {

    item.addEventListener("click", () => {

        const pageName = item.dataset.page;

        if (pageName) {

            openAdminPage(pageName);

        }

    });

});


// =========================
// USER SEARCH
// =========================

const userSearch =
    document.getElementById("userSearch");

if (userSearch) {

    userSearch.addEventListener("input", () => {

        const searchValue =
            userSearch.value.toLowerCase().trim();

        console.log(
            "Searching users:",
            searchValue
        );

        /*
         Firebase user search
         zai zo a mataki na gaba.
        */

    });

}


// =========================
// TRANSACTION FILTER
// =========================

const filterButtons =
    document.querySelectorAll(".filterBtn");

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        filterButtons.forEach(btn => {

            btn.classList.remove("active");

        });

        button.classList.add("active");

        console.log(
            "Transaction filter:",
            button.textContent.trim()
        );

    });

});


// =========================
// NETWORK BUTTONS
// =========================

const networkButtons =
    document.querySelectorAll(".networkCard");

networkButtons.forEach(button => {

    button.addEventListener("click", () => {

        const network =
            button.querySelector("span");

        if (network) {

            console.log(
                "Selected network:",
                network.textContent
            );

        }

    });

});


// =========================
// MAINTENANCE MODE
// =========================

const maintenanceMode =
    document.getElementById("maintenanceMode");

if (maintenanceMode) {

    maintenanceMode.addEventListener(
        "change",
        () => {

            if (maintenanceMode.checked) {

                console.log(
                    "Maintenance mode ON"
                );

            } else {

                console.log(
                    "Maintenance mode OFF"
                );

            }

        }
    );

}


// =========================
// INITIAL PAGE
// =========================

openAdminPage("dashboard");

console.log(
    "GE DATA Admin Panel loaded successfully"
);
