// ============================================
// GE DATA ADMIN PANEL
// ============================================

const adminToken = sessionStorage.getItem("ge_admin_token");
const adminData = sessionStorage.getItem("ge_admin");

if (!adminToken || !adminData) {
    window.location.href = "/admin-login.html";
}

// ============================================
// ELEMENTS
// ============================================

const sideItems = document.querySelectorAll(".sideItem");
const navItems = document.querySelectorAll(".navItem");
const pages = document.querySelectorAll(".adminPage");

const userList = document.getElementById("userList");
const userSearch = document.getElementById("userSearch");

// ============================================
// API HELPER
// ============================================

async function api(url, options = {}) {

    options.headers = {
        ...(options.headers || {}),
        "Content-Type": "application/json",
        "x-admin-token": adminToken
    };

    const response = await fetch(url, options);
    const data = await response.json();

    if (response.status === 401) {

        sessionStorage.removeItem("ge_admin_token");
        sessionStorage.removeItem("ge_admin");

        window.location.href = "/admin-login.html";

        return null;
    }

    return data;
}

// ============================================
// OPEN PAGE
// ============================================

function openPage(pageName) {

    pages.forEach(page => {
        page.classList.remove("active");
    });

    const page = document.getElementById(pageName + "Page");

    if (page) {
        page.classList.add("active");
    }

    sideItems.forEach(item => {

        item.classList.remove("active");

        if (item.dataset.page === pageName) {
            item.classList.add("active");
        }

    });

    navItems.forEach(item => {

        item.classList.remove("active");

        if (item.dataset.page === pageName) {
            item.classList.add("active");
        }

    });

    window.scrollTo(0, 0);

    if (pageName === "users") {
        loadUsers();
    }

   if (pageName === "data") {
    loadDataNetworks();

   }

}

// ============================================
// SIDEBAR
// ============================================

sideItems.forEach(item => {

    item.addEventListener("click", async () => {

        const page = item.dataset.page;

        openPage(page);

        if (page === "funding") {
            await loadFundingRequests();
        }
        
        if (page === "transactions") {
            await loadAdminTransactions();
        }
       
    });

});

// ============================================
// MOBILE NAV
// ============================================

navItems.forEach(item => {

    item.addEventListener("click", () => {

        openPage(item.dataset.page);

    });

});

// ============================================
// USERS
// ============================================

let allUsers = [];

async function loadUsers() {

    if (!userList) return;

    userList.innerHTML = `
        <div class="empty">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading users...
        </div>
    `;

    try {

        const data = await api("/admin/users");

        if (!data || !data.success) {

            userList.innerHTML = `
                <div class="empty">
                    Failed to load users
                </div>
            `;

            return;
        }

        allUsers = data.users || [];

        renderUsers(allUsers);

        updateDashboard();

    } catch (error) {

        console.error("LOAD USERS ERROR:", error);

        userList.innerHTML = `
            <div class="empty">
                Error loading users
            </div>
        `;
    }
}

// ============================================
// DASHBOARD
// ============================================

function updateDashboard() {

    const totalUsers =
        document.getElementById("totalUsers");

    const totalBalance =
        document.getElementById("totalBalance");

    if (totalUsers) {
        totalUsers.textContent = allUsers.length;
    }

    const balance =
        allUsers.reduce(
            (total, user) =>
                total + Number(user.balance || 0),
            0
        );

    if (totalBalance) {
        totalBalance.textContent =
            "₦" + balance.toLocaleString();
    }
}

// ============================================
// RENDER USERS
// ============================================

function renderUsers(users) {

    if (!users.length) {

        userList.innerHTML = `
            <div class="empty">
                No users found
            </div>
        `;

        return;
    }

    userList.innerHTML = "";

    users.forEach(user => {

        const card =
            document.createElement("div");

        card.className = "adminUserCard";

        card.innerHTML = `

            <div class="userInfo">

                <div class="userAvatar">
                    ${(user.name || "U")
                        .charAt(0)
                        .toUpperCase()}
                </div>

                <div class="userDetails">

                    <h3>
                        ${escapeHTML(user.name || "No Name")}
                    </h3>

                    <p>
                        @${escapeHTML(user.username || "")}
                    </p>

                    <small>
                        ${escapeHTML(user.email || "")}
                    </small>

                    <small>
                        ${escapeHTML(user.phone || "")}
                    </small>

                </div>

            </div>

            <div class="userBalance">

                <span>Balance</span>

                <strong>
                    ₦${Number(user.balance || 0)
                        .toLocaleString()}
                </strong>

            </div>

            <div class="userStatus">

                ${
                    user.blocked

                    ?

                    `<span class="status blocked">
                        Blocked
                    </span>`

                    :

                    `<span class="status activeStatus">
                        Active
                    </span>`
                }

            </div>

            <div class="userActions">

                <button
                    class="viewBtn"
                    onclick="viewUser('${user.id}')">

                    <i class="fa-solid fa-eye"></i>
                    View

                </button>

                <button
                    class="addBtn"
                    onclick="addBalance('${user.id}')">

                    <i class="fa-solid fa-plus"></i>
                    Add

                </button>

                <button
                    class="deductBtn"
                    onclick="deductBalance('${user.id}')">

                    <i class="fa-solid fa-minus"></i>
                    Deduct

                </button>

                ${
                    user.blocked

                    ?

                    `<button
                        class="unblockBtn"
                        onclick="unblockUser('${user.id}')">

                        <i class="fa-solid fa-unlock"></i>
                        Unblock

                    </button>`

                    :

                    `<button
                        class="blockBtn"
                        onclick="blockUser('${user.id}')">

                        <i class="fa-solid fa-ban"></i>
                        Block

                    </button>`
                }

            </div>
        `;

        userList.appendChild(card);

    });
}

// ============================================
// VIEW USER
// ============================================

async function viewUser(userId) {

    const data =
        await api(`/admin/users/${userId}`);

    if (!data || !data.success) {

        alert(data?.message || "Failed to load user");

        return;
    }

    const user = data.user;

    alert(`
USER PROFILE

Name: ${user.name}

Username: ${user.username}

Email: ${user.email}

Phone: ${user.phone}

Balance: ₦${Number(user.balance)
        .toLocaleString()}

Status: ${user.blocked
        ? "BLOCKED"
        : "ACTIVE"}
    `);
}

// ============================================
// ADD BALANCE
// ============================================

async function addBalance(userId) {

    const amount =
        prompt("Enter amount to ADD:");

    if (amount === null) return;

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {

        alert("Please enter a valid amount");

        return;
    }

    if (!confirm(
        `Add ₦${value.toLocaleString()} to this user?`
    )) {
        return;
    }

    const data =
        await api(
            `/admin/users/${userId}/add-balance`,
            {
                method: "POST",

                body: JSON.stringify({
                    amount: value
                })
            }
        );

    if (!data) return;

    if (!data.success) {

        alert(data.message);

        return;
    }

    alert(
        `Balance added successfully!\n\nNew Balance: ₦${Number(data.newBalance).toLocaleString()}`
    );

    loadUsers();
}

// ============================================
// DEDUCT BALANCE
// ============================================

async function deductBalance(userId) {

    const amount =
        prompt("Enter amount to DEDUCT:");

    if (amount === null) return;

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {

        alert("Please enter a valid amount");

        return;
    }

    if (!confirm(
        `Deduct ₦${value.toLocaleString()} from this user?`
    )) {
        return;
    }

    const data =
        await api(
            `/admin/users/${userId}/deduct-balance`,
            {
                method: "POST",

                body: JSON.stringify({
                    amount: value
                })
            }
        );

    if (!data) return;

    if (!data.success) {

        alert(data.message);

        return;
    }

    alert(
        `Balance deducted successfully!\n\nNew Balance: ₦${Number(data.newBalance).toLocaleString()}`
    );

    loadUsers();
}

// ============================================
// BLOCK USER
// ============================================

async function blockUser(userId) {

    if (!confirm(
        "Are you sure you want to BLOCK this user?"
    )) {
        return;
    }

    const data =
        await api(
            `/admin/users/${userId}/block`,
            {
                method: "POST"
            }
        );

    if (!data) return;

    alert(data.message);

    if (data.success) {
        loadUsers();
    }
}

// ============================================
// UNBLOCK USER
// ============================================

async function unblockUser(userId) {

    if (!confirm(
        "Are you sure you want to UNBLOCK this user?"
    )) {
        return;
    }

    const data =
        await api(
            `/admin/users/${userId}/unblock`,
            {
                method: "POST"
            }
        );

    if (!data) return;

    alert(data.message);

    if (data.success) {
        loadUsers();
    }
}

// ============================================
// SEARCH USERS
// ============================================

if (userSearch) {

    userSearch.addEventListener(
        "input",
        function () {

            const search =
                this.value
                    .toLowerCase()
                    .trim();

            const filtered =
                allUsers.filter(user => {

                    return (

                        (user.name || "")
                            .toLowerCase()
                            .includes(search)

                        ||

                        (user.username || "")
                            .toLowerCase()
                            .includes(search)

                        ||

                        (user.email || "")
                            .toLowerCase()
                            .includes(search)

                        ||

                        (user.phone || "")
                            .toLowerCase()
                            .includes(search)

                    );

                });

            renderUsers(filtered);

        }
    );
}

// ============================================
// FILTER BUTTONS
// ============================================

let currentTransactionFilter = "all";

const filterButtons =
    document.querySelectorAll(".filterBtn");

filterButtons.forEach(button => {

    button.addEventListener("click", function () {

        filterButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        this.classList.add("active");

        const filter =
            this.textContent.trim().toLowerCase();

        currentTransactionFilter = filter;

        let filteredTransactions =
            allAdminTransactions;

        if (filter === "data") {

            filteredTransactions =
                allAdminTransactions.filter(transaction =>
                    String(transaction.type || "")
                        .toUpperCase() === "DATA"
                );

        } else if (filter === "airtime") {

            filteredTransactions =
                allAdminTransactions.filter(transaction =>
                    String(transaction.type || "")
                        .toUpperCase() === "AIRTIME"
                );

        } else if (filter === "funding") {

            filteredTransactions =
                allAdminTransactions.filter(transaction =>
                    String(transaction.type || "")
                        .toUpperCase() === "FUND"
                );
        }

        renderAdminTransactions(filteredTransactions);

    });

});

// ============================================
// LOGOUT
// ============================================

const logoutBtn =
    document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function () {

            try {

                await api(
                    "/admin/logout",
                    {
                        method: "POST"
                    }
                );

            } catch (error) {

                console.log(error);

            }

            sessionStorage.removeItem(
                "ge_admin_token"
            );

            sessionStorage.removeItem(
                "ge_admin"
            );

            window.location.href =
                "/admin-login.html";

        }
    );
}

// ============================================
// ESCAPE HTML
// ============================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

// ============================================
// START
// ============================================

openPage("dashboard");
loadDashboardStats();

console.log(
    "GE DATA Admin Panel loaded"
);


// ============================================
// LOAD USERS
// ============================================

async function loadUsers() {

    const userList = document.getElementById("userList");

    if (!userList) return;

    userList.innerHTML = `
        <div class="empty">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading users...
        </div>
    `;

    try {

        const response = await fetch("/admin/users", {
            headers: {
                "x-admin-token": adminToken
            }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load users");
        }

        if (!data.users || data.users.length === 0) {

            userList.innerHTML = `
                <div class="empty">
                    No users yet
                </div>
            `;

            return;
        }

        renderUsers(data.users);

    } catch (error) {

        console.error("LOAD USERS ERROR:", error);

        userList.innerHTML = `
            <div class="empty">
                Failed to load users
            </div>
        `;
    }
}


// ============================================
// RENDER USERS
// ============================================

function renderUsers(users) {

    const userList = document.getElementById("userList");

    userList.innerHTML = "";

    users.forEach(user => {

        const firstLetter =
            (user.name || "U").charAt(0).toUpperCase();

        const statusClass =
            user.blocked ? "blocked" : "activeStatus";

        const statusText =
            user.blocked ? "Blocked" : "Active";

        const actionButton = user.blocked

            ? `
                <button
                    class="unblockBtn"
                    onclick="unblockUser('${user.id}')">

                    <i class="fa-solid fa-unlock"></i>
                    Unblock

                </button>               `

            : `
                <button
                    class="blockBtn"
        
            onclick="blockUser('${user.id}')">

                    <i class="fa-solid fa-ban"></i>
                    Block

                </button>
              `;


        const card = document.createElement("div");

        card.className = "adminUserCard";

        card.innerHTML = `

            <div class="userInfo">

                <div class="userAvatar">
                    ${firstLetter}
                </div>

                <div class="userDetails">

                    <h3>${user.name || "No Name"}</h3>

                    <p>@${user.username || "username"}</p>

                    <small>${user.email || ""}</small>

                    <small>${user.phone || ""}</small>

                </div>

            </div>


            <div class="userBalance">

                <span>Wallet Balance</span>

                <strong>
                    ₦${Number(user.balance || 0).toLocaleString()}
                </strong>

            </div>


            <div class="userStatus">

                <span class="status ${statusClass}">
                    ${statusText}
                </span>

            </div>


            <div class="userActions">

                <button
                    class="viewBtn"
                    onclick="viewUser('${user.id}')">

                    <i class="fa-solid fa-eye"></i>
                    View

                </button>


                <button
                    class="addBtn"
                    onclick="addBalance('${user.id}')">

                    <i class="fa-solid fa-plus"></i>
                    Add

                </button>


                <button
                    class="deductBtn"
                    onclick="deductBalance('${user.id}')">

                    <i class="fa-solid fa-minus"></i>
                    Deduct

                </button>


                ${actionButton}

            </div>

        `;

        userList.appendChild(card);

    });

}


// ============================================
// VIEW USER
// ============================================

async function viewUser(userId) {

    try {

        const response = await fetch(
            `/admin/users/${userId}`,
            {
                headers: {
                    "x-admin-token": adminToken
                }
            }
        );

        const data = await response.json();

        if (!data.success) {
            alert(data.message);
            return;
        }

        const user = data.user;

        alert(
            `USER PROFILE\n\n` +
            `Name: ${user.name}\n` +
            `Username: ${user.username}\n` +
            `Email: ${user.email}\n` +
            `Phone: ${user.phone}\n` +
            `Balance: ₦${Number(user.balance).toLocaleString()}\n` +
            `Status: ${user.blocked ? "Blocked" : "Active"}`
        );

    } catch (error) {

        console.error(error);

        alert("Failed to load user");

    }

}


// ============================================
// ADD BALANCE
// ============================================

async function addBalance(userId) {

    const amount = prompt(
        "Enter amount to ADD to user's balance:"
    );

    if (amount === null) return;

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {

        alert("Please enter a valid amount");

        return;
    }

    try {

        const response = await fetch(
            `/admin/users/${userId}/add-balance`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-admin-token": adminToken
                },

                body: JSON.stringify({
                    amount: value
                })
            }
        );

        const data = await response.json();

        if (!data.success) {

            alert(data.message);

            return;
        }

        alert(
            `Balance added successfully.\n\n` +
            `New Balance: ₦${Number(
                data.newBalance
            ).toLocaleString()}`
        );

        loadUsers();

    } catch (error) {

        console.error(error);

        alert("Failed to add balance");

    }

}


// ============================================
// DEDUCT BALANCE
// ============================================

async function deductBalance(userId) {

    const amount = prompt(
        "Enter amount to DEDUCT from user's balance:"
    );

    if (amount === null) return;

    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {

        alert("Please enter a valid amount");

        return;
    }

    try {

        const response = await fetch(
            `/admin/users/${userId}/deduct-balance`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-admin-token": adminToken
                },

                body: JSON.stringify({
                    amount: value
                })
            }
        );

        const data = await response.json();

        if (!data.success) {

            alert(data.message);

            return;
        }

        alert(
            `Balance deducted successfully.\n\n` +
            `New Balance: ₦${Number(
                data.newBalance
            ).toLocaleString()}`
        );

        loadUsers();

    } catch (error) {

        console.error(error);

        alert("Failed to deduct balance");

    }

}


// ============================================
// BLOCK USER
// ============================================

async function blockUser(userId) {

    const confirmBlock = confirm(
        "Are you sure you want to block this user?"
    );

    if (!confirmBlock) return;

    try {

        const response = await fetch(
            `/admin/users/${userId}/block`,
            {
                method: "POST",

                headers: {
                    "x-admin-token": adminToken
                }
            }
        );

        const data = await response.json();

        if (!data.success) {

            alert(data.message);

            return;
        }

        alert("User blocked successfully");

        loadUsers();

    } catch (error) {

        console.error(error);

        alert("Failed to block user");

    }

}


// ============================================
// UNBLOCK USER
// ============================================

async function unblockUser(userId) {

    const confirmUnblock = confirm(
        "Are you sure you want to unblock this user?"
    );

    if (!confirmUnblock) return;

    try {

        const response = await fetch(
            `/admin/users/${userId}/unblock`,
            {
                method: "POST",

                headers: {
                    "x-admin-token": adminToken
                }
            }
        );

        const data = await response.json();

        if (!data.success) {

            alert(data.message);

            return;
        }

        alert("User unblocked successfully");

        loadUsers();

    } catch (error) {

        console.error(error);

        alert("Failed to unblock user");

    }

}


// ============================================
// LOAD USERS WHEN USERS PAGE OPENS
// ============================================

const originalOpenPage = openPage;

openPage = function(pageName) {

    originalOpenPage(pageName);

    if (pageName === "users") {
        loadUsers();
    }

};


// ============================================
// INITIAL USERS LOAD
// ============================================

if (
    document.getElementById("usersPage") &&
    document.getElementById("userList")
) {

    // Users za su loda idan an bude Users page

}

// ============================================
// DATA NETWORKS
// ============================================

async function loadDataNetworks() {

    const container =
        document.getElementById("dataNetworksContainer");

    if (!container) return;

    container.innerHTML = `
        <div class="networkLoading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading networks...
        </div>
    `;

    try {

        const response = await fetch(
            "/admin/data/networks",
            {
                method: "GET",
                headers: {
                    "x-admin-token": adminToken
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            container.innerHTML = `
                <div class="networkLoading">
                    Failed to load networks.
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        data.networks.forEach(network => {

            const card = document.createElement("div");

            card.className = "networkCard";
            
            card.onclick = () => {
               loadAdminDataPlans(network.code);
            };

            card.innerHTML = `

                <div class="networkCardTop">

                    <img
                        src="${network.logo}"
                        alt="${network.name}"
                    >

                    <div>
                        <strong>${network.name}</strong>

                        <span class="${
                            network.enabled
                                ? "networkEnabled"
                                : "networkDisabled"
                        }">

                            ${
                                network.enabled
                                    ? "Enabled"
                                    : "Disabled"
                            }

                        </span>
                    </div>

                </div>


                <button
                    class="${
                        network.enabled
                            ? "networkDisableBtn"
                            : "networkEnableBtn"
                    }"
                    onclick="toggleDataNetwork(
                        '${network.code}',
                        ${network.enabled}
                    )"
                >

                    ${
                        network.enabled
                            ? "Disable"
                            : "Enable"
                    }

                </button>

            `;

            container.appendChild(card);

        });

    } catch (error) {

        console.error(
            "LOAD DATA NETWORKS ERROR:",
            error
        );

        container.innerHTML = `
            <div class="networkLoading">
                Failed to connect to server.
            </div>
        `;
    }
}


// ============================================
// ENABLE / DISABLE DATA NETWORK
// ============================================

async function toggleDataNetwork(
    network,
    currentlyEnabled
) {

    const action =
        currentlyEnabled
            ? "disable"
            : "enable";

    const confirmAction = confirm(
        `Are you sure you want to ${action} ${network.toUpperCase()}?`
    );

    if (!confirmAction) return;

    try {

        const response = await fetch(
            `/admin/data/networks/${network}/${action}`,
            {
                method: "POST",

                headers: {
                    "x-admin-token": adminToken,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            alert(
                data.message ||
                `Failed to ${action} network`
            );

            return;
        }

        alert(data.message);

        loadDataNetworks();

    } catch (error) {

        console.error(
            "TOGGLE DATA NETWORK ERROR:",
            error
        );

        alert(
            `Failed to ${action} network`
        );
    }
}


// ============================================
// LOAD DATA WHEN DATA PAGE OPENS
// ============================================

const oldOpenPage = openPage;

openPage = function(pageName) {

    oldOpenPage(pageName);

    if (pageName === "data") {
        loadDataNetworks();
    }

};

// ============================================
// LOAD ADMIN DATA PLANS
// ============================================

async function loadAdminDataPlans(network) {

    const container =
        document.getElementById("dataPlansContainer");

    if (!container) return;

    container.innerHTML = `
        <div class="networkLoading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading data plans...
        </div>
    `;

    try {

        const response = await fetch(
            `/admin/data/plans?network=${encodeURIComponent(network)}`,
            {
                method: "GET",
                headers: {
                    "x-admin-token": adminToken
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            container.innerHTML = `
                <div class="networkLoading">
                    Failed to load data plans.
                </div>
            `;

            return;
        }

        if (
            !Array.isArray(data.plans) ||
            data.plans.length === 0
        ) {

            container.innerHTML = `
                <div class="emptyDataPlans">
                    <i class="fa-solid fa-box-open"></i>

                    <h3>No data plans found</h3>

                    <p>
                        No plans are available for this network.
                    </p>
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        data.plans.forEach(plan => {

            const card =
                document.createElement("div");

            card.className = "dataPlanCard";

            const planName =
                plan.name ||
                plan.plan_name ||
                "Data Plan";

            const planSize =
                plan.size ||
                plan.volume ||
                "";

            const apiPrice =
                Number(plan.price || 0);

            const sellingPrice =
                Number(
                    plan.sellingPrice ||
                    plan.salePrice ||
                    apiPrice
                );

            const planId =
                plan.id ||
                plan.plan_id ||
                plan.planId;

            card.innerHTML = `

                <div class="dataPlanInfo">

                    <strong>
                        ${planName}
                    </strong>

                    <p>
                        ${planSize}
                    </p>

                    <small>
                        API Cost:
                        ₦${apiPrice.toLocaleString()}
                    </small>

                </div>

                <div class="dataPlanPrice">

                    <label>
                        Your Price
                    </label>

                    <div class="priceEditRow">

                        <input
                            type="number"
                            class="dataPlanPriceInput"
                            value="${sellingPrice}"
                            min="0"
                            step="1"
                            data-plan-id="${planId}"
                        >

                        <button
                            type="button"
                            class="saveDataPriceBtn"
                            onclick="saveDataPlanPrice(
                                '${network}',
                                '${planId}'
                            )"
                        >
                            Save
                        </button>

                    </div>

                </div>
            `;

            container.appendChild(card);

        });

    } catch (error) {

        console.error(
            "LOAD ADMIN DATA PLANS ERROR:",
            error
        );

        container.innerHTML = `
            <div class="networkLoading">
                Failed to connect to server.
            </div>
        `;
    }
}

async function saveDataPlanPrice(network, planId) {

    const input = document.querySelector(
        `.dataPlanPriceInput[data-plan-id="${planId}"]`
    );

    if (!input) {
        alert("Price input not found");
        return;
    }

    const sellingPrice = Number(input.value);

    if (!sellingPrice || sellingPrice <= 0) {
        alert("Enter a valid price");
        return;
    }

    try {

        const response = await fetch(
            "/admin/data/plans/price",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-admin-token": adminToken
                },

                body: JSON.stringify({
                    network,
                    planId,
                    sellingPrice
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            alert(
                data.message ||
                "Failed to save price"
            );
            return;
        }

        alert("Price updated successfully");

    } catch (error) {

        console.error(
            "SAVE DATA PLAN PRICE ERROR:",
            error
        );

        alert("Failed to connect to server");
    }
}

const uploadPinBtn = document.getElementById("uploadPinBtn");
const uploadPinForm = document.getElementById("uploadPinForm");

if (uploadPinBtn && uploadPinForm) {

    uploadPinBtn.onclick = () => {

        const pinList =
            document.getElementById("airtimePinsList");

        if (uploadPinForm.style.display === "none") {

            uploadPinForm.style.display = "block";

            if (pinList) {
                pinList.style.display = "block";
            }

        } else {

            uploadPinForm.style.display = "none";

            if (pinList) {
                pinList.style.display = "none";
            }

        }

    };
}

const airtimePinsList =
    document.getElementById("airtimePinsList");

if (airtimePinsList) {
    airtimePinsList.style.display = "none";
}

const saveAirtimePin =
    document.getElementById("saveAirtimePin");

if (saveAirtimePin) {

    saveAirtimePin.onclick = async () => {

        const network =
            document.getElementById("adminPinNetwork").value;

        const amount =
            document.getElementById("adminPinAmount").value;

        const pin =
            document.getElementById("adminPinCode").value.trim();

        if (!network) {
            alert("Select network");
            return;
        }

        if (!amount) {
            alert("Select amount");
            return;
        }

        if (!pin) {
            alert("Enter Airtime PIN");
            return;
        }

            sessionStorage.getItem("ge_admin_token");

        if (!adminToken) {
            alert("Admin session expired. Login again.");
            return;
        }

        try {

            saveAirtimePin.disabled = true;
            saveAirtimePin.textContent = "Saving...";

            const response = await fetch(
                "/admin/airtime-pins",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "x-admin-token": adminToken
                    },

                    body: JSON.stringify({
                        network: network,
                        amount: amount,
                        pin: pin
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {

                alert(
                    result.message ||
                    "Failed to upload PIN"
                );

                return;
            }

            alert("Airtime PIN uploaded successfully.");

            document.getElementById(
                "adminPinCode"
            ).value = "";

        } catch (error) {

            console.error(
                "UPLOAD PIN ERROR:",
                error
            );

            alert(
                "Unable to upload PIN"
            );

        } finally {

            saveAirtimePin.disabled = false;
            saveAirtimePin.textContent = "Save PIN";

        }

    };
}

// ===============================
// LOAD AIRTIME PINS
// ===============================
async function loadAirtimePins() {

    const list =
        document.getElementById("airtimePinsList");

    const availableCount =
        document.getElementById("availableCards");

    const usedCount =
        document.getElementById("usedCards");

    if (!list) return;

    try {

        list.innerHTML = "<p>Loading PINs...</p>";

        const response = await fetch(
            "/admin/airtime-pins",
            {
                headers: {
                    "x-admin-token": adminToken
                }
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            list.innerHTML =
                "<p>Failed to load PINs.</p>";
            return;
        }

        if (availableCount) {
            availableCount.textContent =
                result.available;
        }

        if (usedCount) {
            usedCount.textContent =
                result.used;
        }

        if (!result.pins || result.pins.length === 0) {

            list.innerHTML =
                "<p>No Airtime PINs uploaded yet.</p>";

            return;
        }

        list.innerHTML = result.pins.map(pin => {

    const status =
        String(pin.status || "available").toLowerCase();

    const deleteButton =
        status === "available"
            ? `
                <button
                    class="deletePinBtn"
                    data-pin-id="${pin.id}">
                    <i class="fa-solid fa-trash"></i>
                    Delete
                </button>
            `
            : "";

    return `
        <div class="airtimePinItem">

            <div>
                <strong>${pin.network}</strong>
                <span>₦${Number(pin.amount).toLocaleString()}</span>
            </div>

            <div>
                <strong>${pin.pin}</strong>
            </div>

            <div>
                <span class="pinStatus ${status}">
                    ${status.toUpperCase()}
                </span>

                ${deleteButton}
            </div>

        </div>
    `;

}).join("");

document.querySelectorAll(".deletePinBtn").forEach(button => {

    button.onclick = async () => {

        const pinId = button.dataset.pinId;

        const confirmDelete = confirm(
            "Are you sure you want to delete this PIN?"
        );

        if (!confirmDelete) return;

        try {

            button.disabled = true;
            button.textContent = "Deleting...";

            const response = await fetch(
                `/admin/airtime-pins/${pinId}`,
                {
                    method: "DELETE",
                    headers: {
                        "x-admin-token": adminToken
                    }
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                alert(
                    result.message ||
                    "Failed to delete PIN"
                );
                return;
            }

            alert("PIN deleted successfully.");

            loadAirtimePins();

        } catch (error) {

            console.error(
                "DELETE PIN ERROR:",
                error
            );

            alert("Unable to delete PIN.");

        } finally {

            button.disabled = false;
        }
    };
}); 

    } catch (error) {

        console.error(
            "LOAD AIRTIME PINS ERROR:",
            error
        );

        list.innerHTML =
            "<p>Unable to load PINs.</p>";
    }
}

// Load when Admin page opens
loadAirtimePins();


// ===============================
// LOAD FUNDING REQUESTS
// ===============================

async function loadFundingRequests() {

    const fundingList =
        document.getElementById("fundingList");

    if (!fundingList) return;

    const adminToken =
        sessionStorage.getItem("ge_admin_token");

    if (!adminToken) {
        console.error("Admin token not found");
        return;
    }

    fundingList.innerHTML =
        "<p>Loading funding requests...</p>";

    try {

        const response = await fetch(
            "/admin/fund-requests",
            {
                headers: {
                    "x-admin-token": adminToken
                }
            }
        );

        const result =
            await response.json();
         const pendingFunding =
    document.getElementById("pendingFunding");

if (pendingFunding) {

    const pendingCount =
        result.requests.filter(request =>
            String(request.status || "")
                .toLowerCase() === "pending"
        ).length;

    pendingFunding.textContent =
        pendingCount;
}

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Failed to load funding requests"
            );
        }

        if (!result.requests.length) {

            fundingList.innerHTML =
                "<p>No funding requests</p>";

            return;
        }

        fundingList.innerHTML =
            result.requests.map(request => `

                <div class="fundingRequestItem">

    <div>
        <strong>
            ₦${Number(request.amount || 0)
                .toLocaleString("en-NG")}
        </strong>

        <small>
            ${String(request.status || "pending").toUpperCase()}
        </small>

         <span>
    <i class="fa-solid fa-user"></i>
    ${request.name || "Unknown User"}
     </span>
    </div>

    ${
    String(request.status || "").toLowerCase() === "pending"
    ? `
        <div class="fundActionButtons">

            <button
                class="approveFundBtn"
                data-user-id="${request.userId}"
                data-request-id="${request.id}"
            >
                Approve
            </button>

            <button
                class="rejectFundBtn"
                data-user-id="${request.userId}"
                data-request-id="${request.id}"
            >
                Reject
            </button>

        </div>
    `
    : ""
}

</div>

            `).join("");

    } catch (error) {

        console.error(
            "Funding requests error:",
            error
        );

        fundingList.innerHTML =
            "<p>Failed to load funding requests</p>";
    }
}


// ===============================
// APPROVE FUND REQUEST BUTTON
// ===============================

document.addEventListener("click", async (event) => {

    const button =
        event.target.closest(".approveFundBtn");

    if (!button) return;

    const userId =
        button.dataset.userId;

    const requestId =
        button.dataset.requestId;

    if (!userId || !requestId) {
        alert("Invalid fund request");
        return;
    }

    const confirmApprove =
        confirm(
            "Are you sure you want to approve this fund request?"
        );

    if (!confirmApprove) return;

    const adminToken =
        sessionStorage.getItem("ge_admin_token");

    if (!adminToken) {
        alert("Admin session expired");
        return;
    }

    button.disabled = true;
    button.textContent = "Approving...";

    try {

        const response = await fetch(
            `/admin/fund-requests/${userId}/${requestId}/approve`,
            {
                method: "POST",
                headers: {
                    "x-admin-token": adminToken
                }
            }
        );

        const result =
            await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Failed to approve fund request"
            );
        }

        alert(
            "Fund request approved successfully."
        );

        await loadFundingRequests();

    } catch (error) {

        console.error(
            "Approve fund request error:",
            error
        );

        alert(
            error.message ||
            "Failed to approve fund request"
        );

        button.disabled = false;
        button.textContent = "Approve";
    }
});


// ===============================
// REJECT FUND REQUEST BUTTON
// ===============================

document.addEventListener("click", async (event) => {

    const button =
        event.target.closest(".rejectFundBtn");

    if (!button) return;

    const userId =
        button.dataset.userId;

    const requestId =
        button.dataset.requestId;

    if (!userId || !requestId) {
        alert("Invalid fund request");
        return;
    }

    const confirmReject =
        confirm(
            "Are you sure you want to reject this fund request?"
        );

    if (!confirmReject) return;

    const adminToken =
        sessionStorage.getItem("ge_admin_token");

    if (!adminToken) {
        alert("Admin session expired");
        return;
    }

    button.disabled = true;
    button.textContent = "Rejecting...";

    try {

        const response = await fetch(
            `/admin/fund-requests/${userId}/${requestId}/reject`,
            {
                method: "POST",
                headers: {
                    "x-admin-token": adminToken
                }
            }
        );

        const result =
            await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Failed to reject fund request"
            );
        }

        alert(
            "Fund request rejected successfully."
        );

        await loadFundingRequests();

    } catch (error) {

        console.error(
            "Reject fund request error:",
            error
        );

        alert(
            error.message ||
            "Failed to reject fund request"
        );

        button.disabled = false;
        button.textContent = "Reject";
    }
});

// ==========================================
// LOAD ADMIN DASHBOARD STATS
// ==========================================

async function loadDashboardStats() {

    const adminToken =
        sessionStorage.getItem("ge_admin_token");

    if (!adminToken) {
        console.error("Admin token not found");
        return;
    }

    try {

        const response = await fetch(
            "/admin/dashboard-stats",
            {
                method: "GET",
                headers: {
                    "x-admin-token": adminToken,
                    "Accept": "application/json"
                }
            }
        );

        const result =
            await response.json();

        console.log("ADMIN DASHBOARD STATS:", result);

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Failed to load dashboard stats"
            );
        }

        const stats =
            result.stats || {};

        // ==========================================
        // TOTAL USERS
        // ==========================================

        const totalUsers =
            document.getElementById("totalUsers");

        if (totalUsers) {

            totalUsers.textContent =
                Number(
                    stats.totalUsers || 0
                ).toLocaleString("en-NG");

        }


        // ==========================================
        // TOTAL BALANCE
        // ==========================================

        const totalBalance =
            document.getElementById("totalBalance");

        if (totalBalance) {

            totalBalance.textContent =
                "₦" +
                Number(
                    stats.totalBalance || 0
                ).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });

        }


        // ==========================================
        // PENDING FUNDING
        // ==========================================

        const pendingFunding =
            document.getElementById("pendingFunding");

        if (pendingFunding) {

            pendingFunding.textContent =
                Number(
                    stats.pendingFunding || 0
                ).toLocaleString("en-NG");

        }


        // ==========================================
        // TOTAL TRANSACTIONS
        // ==========================================

        const totalTransactions =
            document.getElementById("totalTransactions");

        if (totalTransactions) {

            totalTransactions.textContent =
                Number(
                    stats.totalTransactions || 0
                ).toLocaleString("en-NG");

        }


        // ==========================================
        // TODAY'S SALES
        // ==========================================

        const todaySales =
            document.getElementById("todaySales");

        if (todaySales) {

            todaySales.textContent =
                "₦" +
                Number(
                    stats.todaysSales || 0
                ).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });

        }


        // ==========================================
        // RECENT TRANSACTIONS
        // ==========================================

        renderAdminRecentTransactions(
            result.recentTransactions || []
        );


    } catch (error) {

        console.error(
            "Dashboard stats error:",
            error
        );

    }
}

// ==========================================
// RENDER ADMIN RECENT TRANSACTIONS
// ==========================================

function renderAdminRecentTransactions(transactions) {

    const container =
        document.getElementById("recentTransactions");

    if (!container) return;


    if (!transactions.length) {

        container.innerHTML = `
            <div class="adminEmptyState">
                No recent transactions
            </div>
        `;

        return;
    }


    container.innerHTML =
        transactions.map(transaction => {

            const type =
                String(transaction.type || "")
                    .toUpperCase();

            let title = "Transaction";
            let icon = "fa-receipt";


            if (type === "DATA") {
                title = "Data Purchase";
                icon = "fa-wifi";
            }

            else if (type === "AIRTIME") {
                title = "Airtime Purchase";
                icon = "fa-phone";
            }

            else if (type === "AIRTIME_PIN") {
                title = "Airtime PIN";
                icon = "fa-key";
            }

            else if (type === "FUND") {
                title = "Wallet Funding";
                icon = "fa-wallet";
            }


            const amount =
                Number(transaction.amount || 0);


            const status =
                String(transaction.status || "")
                    .toLowerCase();


            return `
                <div class="adminRecentTransaction">

                    <div class="adminRecentIcon">
                        <i class="fa-solid ${icon}"></i>
                    </div>

                    <div class="adminRecentInfo">

                        <strong>
                            ${title}
                        </strong>

                        <small>
    <i class="fa-solid fa-user"></i>
    ${escapeHTML(
        transaction.name || "Unknown User"
    )}
</small>

                    </div>

                    <div class="adminRecentAmount">

                        <strong>
                            ₦${amount.toLocaleString("en-NG")}
                        </strong>

                        <small class="${status}">
                            ${status.toUpperCase()}
                        </small>

                    </div>

                </div>
            `;

        }).join("");
}

// ==========================================
// LOAD ADMIN TRANSACTIONS
// ==========================================

let allAdminTransactions = [];

async function loadAdminTransactions() {
    const transactionList =
        document.getElementById("transactionList");

    if (!transactionList) return;

    transactionList.innerHTML = `
        <div class="empty">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading transactions...
        </div>
    `;

    try {
        const response = await fetch(
            "/admin/transactions",
            {
                headers: {
                    "x-admin-token": adminToken
                }
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Failed to load transactions"
            );
        }

        allAdminTransactions =
            result.transactions || [];

        renderAdminTransactions(allAdminTransactions);

    } catch (error) {
        console.error(
            "LOAD ADMIN TRANSACTIONS ERROR:",
            error
        );

        transactionList.innerHTML = `
            <div class="empty">
                Failed to load transactions
            </div>
        `;
    }
}

function renderAdminTransactions(transactions) {

    const transactionList =
        document.getElementById("transactionList");

    if (!transactionList) return;

    if (!transactions.length) {
        transactionList.innerHTML = `
            <div class="empty">
                No transactions yet
            </div>
        `;
        return;
    }

    transactionList.innerHTML =
        transactions.map(transaction => {

            const type =
                String(transaction.type || "")
                    .toUpperCase();

            let title = "Transaction";
            let icon = "fa-receipt";

            if (type === "DATA") {
                title = "Data Purchase";
                icon = "fa-wifi";
            } else if (type === "AIRTIME") {
                title = "Airtime Purchase";
                icon = "fa-phone";
            } else if (type === "AIRTIME_PIN") {
                title = "Airtime PIN";
                icon = "fa-key";
            } else if (type === "FUND") {
                title = "Wallet Funding";
                icon = "fa-wallet";
            }

            const amount =
                Number(transaction.amount || 0);

            const status =
                String(transaction.status || "")
                    .toLowerCase();

            return `
                <div class="adminTransactionItem">

                    <div class="adminTransactionIcon">
                        <i class="fa-solid ${icon}"></i>
                    </div>

                    <div class="adminTransactionInfo">
                        <strong>${title}</strong>

                        <small>
    <i class="fa-solid fa-user"></i>
    ${escapeHTML(
        transaction.name || "Unknown User"
    )}
</small>
                    </div>

                    <div class="adminTransactionRight">
                        <strong>
                            ₦${amount.toLocaleString("en-NG")}
                        </strong>

                        <span class="${status}">
                            ${status.toUpperCase()}
                        </span>
                    </div>

                </div>
            `;

        }).join("");
}
