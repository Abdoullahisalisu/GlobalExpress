<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>GE DATA - Admin Panel</title>

<link rel="stylesheet" href="admin.css">

<link rel="preconnect" href="https://fonts.googleapis.com">

<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
rel="stylesheet">

<link rel="stylesheet"
href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">

</head>

<body>

<!-- =========================
     TOP BAR
========================= -->

<header class="topbar">

    <div class="brand">

        <img src="logo.png" alt="GE DATA">

        <div>

            <h2>GE DATA</h2>

            <span>Admin Panel</span>

        </div>

    </div>

    <button id="logoutBtn" class="logoutBtn">

        <i class="fa-solid fa-right-from-bracket"></i>

        Logout

    </button>

</header>


<!-- =========================
     SIDE / DESKTOP NAV
========================= -->

<aside class="sidebar">

    <button class="sideItem active" data-page="dashboard">
        <i class="fa-solid fa-house"></i>
        <span>Dashboard</span>
    </button>

    <button class="sideItem" data-page="users">
        <i class="fa-solid fa-users"></i>
        <span>Users</span>
    </button>

    <button class="sideItem" data-page="funding">
        <i class="fa-solid fa-wallet"></i>
        <span>Funding</span>
    </button>

    <button class="sideItem" data-page="data">
        <i class="fa-solid fa-wifi"></i>
        <span>Data</span>
    </button>

    <button class="sideItem" data-page="airtime">
        <i class="fa-solid fa-mobile-screen"></i>
        <span>Airtime</span>
    </button>

    <button class="sideItem" data-page="cards">
        <i class="fa-solid fa-sim-card"></i>
        <span>Cards / PINs</span>
    </button>

    <button class="sideItem" data-page="transactions">
        <i class="fa-solid fa-receipt"></i>
        <span>Transactions</span>
    </button>

    <button class="sideItem" data-page="notifications">
        <i class="fa-solid fa-bell"></i>
        <span>Notifications</span>
    </button>

    <button class="sideItem" data-page="settings">
        <i class="fa-solid fa-gear"></i>
        <span>Settings</span>
    </button>

    <button class="sideItem" data-page="activity">
        <i class="fa-solid fa-clock-rotate-left"></i>
        <span>Activity Log</span>
    </button>

</aside>


<!-- =========================
     MAIN
========================= -->

<main class="adminMain">


<!-- =========================
     DASHBOARD
========================= -->

<section class="adminPage active" id="dashboardPage">

    <div class="welcome">

        <h1>Dashboard</h1>

        <p>
            Welcome back, Administrator
        </p>

    </div>


    <section class="stats">


        <div class="statCard">

            <div class="statIcon usersIcon">

                <i class="fa-solid fa-users"></i>

            </div>

            <div>

                <span>Total Users</span>

                <h2 id="totalUsers">0</h2>

            </div>

        </div>


        <div class="statCard">

            <div class="statIcon balanceIcon">

                <i class="fa-solid fa-wallet"></i>

            </div>

            <div>

                <span>Total Balance</span>

                <h2 id="totalBalance">₦0</h2>

            </div>

        </div>


        <div class="statCard">

            <div class="statIcon pendingIcon">

                <i class="fa-solid fa-clock"></i>

            </div>

            <div>

                <span>Pending Funding</span>

                <h2 id="pendingFunding">0</h2>

            </div>

        </div>


        <div class="statCard">

            <div class="statIcon transactionIcon">

                <i class="fa-solid fa-chart-line"></i>

            </div>

            <div>

                <span>Transactions</span>

                <h2 id="totalTransactions">0</h2>

            </div>

        </div>


    </section>


    <section class="section">

        <div class="sectionHeader">

            <h2>Today's Sales</h2>

        </div>

        <div class="bigAmount" id="todaySales">

            ₦0

        </div>

    </section>


    <section class="section">

        <div class="sectionHeader">

            <h2>Recent Transactions</h2>

        </div>

        <div id="recentTransactions">

            <div class="empty">
                No transactions yet
            </div>

        </div>

    </section>

</section>


<!-- =========================
     USERS
========================= -->

<section class="adminPage" id="usersPage">

    <div class="pageTitle">

        <h1>Users</h1>

        <p>Manage registered users</p>

    </div>


    <div class="searchBox">

        <i class="fa-solid fa-search"></i>

        <input
        type="text"
        id="userSearch"
        placeholder="Search name, email or phone">

    </div>


    <div class="userList" id="userList">

        <div class="empty">
            No users yet
        </div>

    </div>

</section>


<!-- =========================
     FUNDING
========================= -->

<section class="adminPage" id="fundingPage">

    <div class="pageTitle">

        <h1>Funding Requests</h1>

        <p>Approve or reject wallet funding</p>

    </div>


    <div id="fundingList">

        <div class="empty">
            No funding requests
        </div>

    </div>

</section>


<!-- =========================
     DATA
========================= -->

<section class="adminPage" id="dataPage">

    <div class="pageTitle">
        <h1>Data</h1>
        <p>Manage data networks and packages</p>
    </div>


    <!-- ========================= -->
    <!-- DATA NETWORKS -->
    <!-- ========================= -->

    <div class="dataSectionHeader">
        <div>
            <h2>Data Networks</h2>
            <p>Enable or disable networks for users.</p>
        </div>
    </div>


    <div id="dataNetworksContainer" class="networkGrid">

        <!-- Networks will load here from server -->

        <div class="networkLoading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading networks...
        </div>

    </div>


    <!-- ========================= -->
    <!-- DATA PLANS -->
    <!-- ========================= -->

    <div class="dataSectionHeader dataPlansHeader">

        <div>
            <h2>Data Plans</h2>
            <p>Manage your data packages and prices.</p>
        </div>

        <button
            id="addDataPlanBtn"
            class="primaryBtn">

            <i class="fa-solid fa-plus"></i>
            Add Data Package

        </button>

    </div>


    <div id="dataPlansContainer" class="dataPlansContainer">

        <div class="emptyDataPlans">
            <i class="fa-solid fa-box-open"></i>

            <h3>No network selected</h3>

            <p>
                Select a network above to manage its data plans.
            </p>
        </div>

    </div>

</section>

<!-- =========================
     AIRTIME
========================= -->

<section class="adminPage" id="airtimePage">

    <div class="pageTitle">

        <h1>Airtime</h1>

        <p>Manage airtime services</p>

    </div>


    <div class="networkGrid">

        <button class="networkCard">
            <img src="mtn.png">
            <span>MTN</span>
        </button>

        <button class="networkCard">
            <img src="airtel.png">
            <span>Airtel</span>
        </button>

        <button class="networkCard">
            <img src="glo.png">
            <span>Glo</span>
        </button>

        <button class="networkCard">
            <img src="9mobile.png">
            <span>9mobile</span>
        </button>

    </div>

</section>


<!-- =========================
     CARDS
========================= -->

<section class="adminPage" id="cardsPage">

    <div class="pageTitle">

        <h1>Cards / PINs</h1>

        <p>Manage available and used cards</p>

    </div>


    <button class="primaryBtn">

        <i class="fa-solid fa-upload"></i>

        Upload PIN

    </button>


    <div class="cardStats">

        <div>
            <span>Available</span>
            <strong id="availableCards">0</strong>
        </div>

        <div>
            <span>Used</span>
            <strong id="usedCards">0</strong>
        </div>

    </div>

</section>


<!-- =========================
     TRANSACTIONS
========================= -->

<section class="adminPage" id="transactionsPage">

    <div class="pageTitle">

        <h1>Transactions</h1>

        <p>View all transactions</p>

    </div>


    <div class="filterRow">

        <button class="filterBtn active">
            All
        </button>

        <button class="filterBtn">
            Data
        </button>

        <button class="filterBtn">
            Airtime
        </button>

        <button class="filterBtn">
            Funding
        </button>

    </div>


    <div id="transactionList">

        <div class="empty">
            No transactions yet
        </div>

    </div>

</section>


<!-- =========================
     NOTIFICATIONS
========================= -->

<section class="adminPage" id="notificationsPage">

    <div class="pageTitle">

        <h1>Notifications</h1>

        <p>Send announcements to users</p>

    </div>


    <div class="formCard">

        <label>Recipient</label>

        <select id="notificationRecipient">

            <option value="all">
                All Users
            </option>

            <option value="user">
                Specific User
            </option>

        </select>


        <label>Title</label>

        <input
        type="text"
        id="notificationTitle"
        placeholder="Notification title">


        <label>Message</label>

        <textarea
        id="notificationMessage"
        placeholder="Write your message"></textarea>


        <button class="primaryBtn">

            <i class="fa-solid fa-paper-plane"></i>

            Send Notification

        </button>

    </div>

</section>


<!-- =========================
     SETTINGS
========================= -->

<section class="adminPage" id="settingsPage">

    <div class="pageTitle">

        <h1>Settings</h1>

        <p>Manage application settings</p>

    </div>


    <div class="settingsList">

        <div class="settingItem">

            <div>

                <strong>Maintenance Mode</strong>

                <span>Temporarily disable user services</span>

            </div>

            <label class="switch">

                <input type="checkbox"
                id="maintenanceMode">

                <span class="slider"></span>

            </label>

        </div>


        <div class="settingItem">

            <div>

                <strong>Minimum Funding</strong>

                <span>Minimum wallet funding amount</span>

            </div>

            <input
            type="number"
            id="minimumFunding"
            value="100">

        </div>

    </div>

</section>


<!-- =========================
     ACTIVITY LOG
========================= -->

<section class="adminPage" id="activityPage">

    <div class="pageTitle">

        <h1>Activity Log</h1>

        <p>Admin actions and system activity</p>

    </div>


    <div id="activityList">

        <div class="empty">
            No activity yet
        </div>

    </div>

</section>


</main>


<!-- =========================
     MOBILE NAV
========================= -->

<nav class="bottomNav">

    <button class="navItem active"
    data-page="dashboard">

        <i class="fa-solid fa-house"></i>

        <span>Home</span>

    </button>


    <button class="navItem"
    data-page="users">

        <i class="fa-solid fa-users"></i>

        <span>Users</span>

    </button>


    <button class="navItem"
    data-page="funding">

        <i class="fa-solid fa-wallet"></i>

        <span>Funding</span>

    </button>


    <button class="navItem"
    data-page="settings">

        <i class="fa-solid fa-gear"></i>

        <span>Settings</span>

    </button>

</nav>


<script src="admin.js"></script>

</body>

</html>
