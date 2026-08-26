
// ================= SERVER API =================

const API_BASE = ""; // Same Express server because frontend is inside /public
const AUTH_TOKEN_KEY = "ge_token";

let currentUser = null;
let currentBalance = 0;

function getAuthToken(){
    return localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

// ==========================================
// CHECK LOGIN SESSION
// ==========================================

(function checkLoginSession() {

    const token = localStorage.getItem("ge_token");

    if (!token) {

        document.body.style.display = "none";

        window.location.replace("/auth.html");

        return;
    }

})();

async function apiFetch(path, options = {}) {

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    const token = getAuthToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(API_BASE + path, {
        ...options,
        headers
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {
            success: false,
            message: "Invalid server response"
        };
    }

    // ==========================================
    // SESSION EXPIRED / UNAUTHORIZED
    // ==========================================

    if (response.status === 401 || response.status === 403) {

        console.warn("Session expired. Redirecting to login...");

        // Clear old login data
        localStorage.removeItem("ge_token");
        localStorage.removeItem("ge_user");

        // Prevent dashboard from remaining visible
        document.body.style.display = "none";

        // Send user back to login page
        window.location.replace("/auth.html");

        return;
    }

    // ==========================================
    // OTHER SERVER ERRORS
    // ==========================================

    if (!response.ok) {

        throw new Error(
            data.message || "Server request failed"
        );

    }

    return data;
}

function formatMoney(value){
    return "₦" + Number(value || 0).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function updateDashboardUser(user){
    if(!user) return;

    currentUser = user;
    currentBalance = Number(user.balance || 0);

    const balanceEl = document.getElementById("balance");
    if(balanceEl && visible){
        balanceEl.innerHTML = formatMoney(currentBalance);
    }

    const nameEl = document.querySelector(".header .left h2");
    if(nameEl){
        nameEl.textContent = `${user.name || "User"} 👋`;
    }

    const greetingEl = document.querySelector(".header .small");
    if(greetingEl){
        const hour = new Date().getHours();
        greetingEl.textContent =
            hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
    }
}

async function loadCurrentUser(){
    const token = getAuthToken();

    if(!token){
        console.warn("No login token found. Login first to load your Firebase account.");
        return;
    }

    try{
        const data = await apiFetch("/api/user");
        if(data.success){
            updateDashboardUser(data.user);
        }
    }catch(error){
        console.error("USER API:", error);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        currentUser = null;
    }
}

async function loadHistory(){
    const historyCard = document.querySelector(".history .card");
    if(!historyCard || !getAuthToken()) return;

    try{
        const data = await apiFetch("/api/history");
        const transactions = Array.isArray(data.transactions) ? data.transactions : [];

        if(!transactions.length){
            historyCard.innerHTML = `
                <div>
                    <h4>No Transactions</h4>
                    <p>Your transactions will appear here.</p>
                </div>
            `;
            return;
        }

        historyCard.innerHTML = transactions.slice(0, 5).map(tx => `
            <div class="historyRow" style="padding:10px 0;border-bottom:1px solid #eee;">
                <h4>${escapeHtml(tx.service || tx.type || "Transaction")}</h4>
                <p>${escapeHtml(tx.network || "")} ${tx.phone ? "• " + escapeHtml(tx.phone) : ""}</p>
                <p><strong>${formatMoney(tx.amount)}</strong> • ${escapeHtml(tx.status || "pending")}</p>
            </div>
        `).join("");
    }catch(error){
        console.error("HISTORY API:", error);
    }
}

function escapeHtml(value){
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ================= BALANCE =================

const balance = document.getElementById("balance");
const toggle = document.getElementById("toggleBalance");

let visible = true;

if (toggle) {
    toggle.addEventListener("click", () => {
        if (visible) {
            balance.innerHTML = "******";
            toggle.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
            visible = false;
        } else {
            balance.innerHTML = formatMoney(currentBalance);
            toggle.innerHTML = '<i class="fa-regular fa-eye"></i>';
            visible = true;
        }
    });
}

// ================= MENU =================

const menu = document.querySelector(".menu");

if (menu) {

    menu.onclick = () => {

        alert("Menu Coming Soon");

    };

}

// ================= NOTIFICATION =================

const notify = document.querySelector(".notify");

if (notify) {

    notify.onclick = () => {

        alert("No New Notification");

    };

}

// ================= ACTION BUTTONS =================

const actions = document.querySelectorAll(".action");

actions.forEach(action => {

    action.addEventListener("click", () => {

        const text = action.querySelector("h4").innerText;

        if (text === "Fund Wallet") {

            alert("Fund Wallet Page");

        } else {

            alert("More Options");

        }

    });

});

// ================= SERVICES =================

const services = document.querySelectorAll(".item");

services.forEach(item => {

    item.addEventListener("click", () => {

        const service = item.querySelector("span").innerText;

        switch (service) {

            case "Data":
                openPage("dataPage");
                break;

            case "Airtime":
                openPage("airtimeHomePage");
                break;
            case "Electricity":
                alert("Electricity Page");
                break;

            case "Cable":
                alert("Cable TV Page");
                break;

            case "Betting":
                alert("Betting Page");
                break;

            case "Internet":
                alert("Internet Page");
                break;

            case "Wallet":
                alert("Wallet Page");
                break;

            case "History":
    openPage("historyPage");
    loadFullHistory();
    break;

            default:
                alert(service);

        }

    });

});

// ================= PAGE =================

function openPage(page, addHistory = true) {

    // Save page in browser history
    if (addHistory) {
        history.pushState({ page: page }, "", "#" + page);
    }

    // Hide Dashboard
    const homePage = document.getElementById("homePage");

    if (homePage) {
        homePage.style.display = "none";
    }

    // Hide all pages
    document.querySelectorAll(".page").forEach(p => {
        p.style.display = "none";
    });

    // Show selected page
    const targetPage = document.getElementById(page);

    if (targetPage) {
        targetPage.style.display = "block";
    }
}

function goHome() {

    // Hide all pages
    document.querySelectorAll(".page").forEach(page => {
        page.style.display = "none";
    });
     
     

    // Show Home page
    const homePage = document.getElementById("homePage");

    if (homePage) {
        homePage.style.display = "block";
    }

    // Remove active state from all navigation items
    document.querySelectorAll(".navItem").forEach(item => {
        item.classList.remove("active");
    });

    // Activate Dashboard/Home icon
    const homeNav = document.getElementById("homeNav");

    if (homeNav) {
        homeNav.classList.add("active");
    }

        // Refresh app after returning to Dashboard
    setTimeout(() => {
        window.location.reload();
    }, 100);
}
// ================= PHONE INPUT =================

const phoneInput = document.getElementById("phoneNumber");
const networkCards = document.querySelectorAll(".networkCard");
const categorySection = document.getElementById("categorySection");
const plansSection = document.getElementById("plansSection");

let selectedNetwork = "";
let selectedCategory = "";
let selectedPlanId = "";
let selectedPlanName = "";
let selectedPlanPrice = 0;
let selectedPlanValidity = "";
let selectedPlanType = "";

const prefixes = {

mtn:[
"0803","0806","0703","0706",
"0813","0816","0810","0814",
"0903","0906","0913","0916",
"0704"
],

airtel:[
"0802","0808","0701","0708",
"0812","0902","0907","0912"
],

glo:[
"0805","0807","0811","0815",
"0905","0915"
],

ninemobile:[
"0809","0817","0818",
"0908","0909"
]

};


// ================= AUTO DETECT =================

if(phoneInput){

phoneInput.addEventListener("input",()=>{
    
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 11);
    
    phoneError.innerHTML = "";
    const error=document.getElementById("phoneError");

error.innerHTML="";

if(phoneInput.value.length>11){

error.innerHTML="Number is invalid";

return;

}

if(
phoneInput.value.length>=4 &&
selectedNetwork==""
){

error.innerHTML="Number is incorrect";

}

    const number = phoneInput.value.substring(0,4);

    networkCards.forEach(card=>{
        card.classList.remove(
            "mtn",
            "airtel",
            "glo",
            "ninemobile",
            "active"
        );
    });

    selectedNetwork="";

    for(let network in prefixes){

        if(prefixes[network].includes(number)){

            const search =
            network==="ninemobile" ? "9mobile" : network;

            const card =
            document.querySelector(
            `.networkCard[data-network="${search}"]`
            );

            if(card){

                card.classList.add(network);

                selectedNetwork = search;

            }

        }

    }

    
    categorySection.style.display = "flex";
categorySection.style.flexDirection = "column";
    plansSection.style.display="none";

});

}

// ================= CLICK NETWORK =================
networkCards.forEach(card=>{

card.addEventListener("click",()=>{
const phoneError = document.getElementById("phoneError");

phoneError.innerHTML = "";

const number = phoneInput.value.trim();

// Idan an fara rubuta number amma bai kai 11 ba
if(number.length > 0 && number.length < 11){

    phoneError.innerHTML = "Number is wrong";

    return;

}

// Idan ya wuce 11
if(number.length > 11){

    phoneError.innerHTML = "Number is invalid";

    return;

}
networkCards.forEach(c=>{

c.classList.remove(
"active",
"mtn",
"airtel",
"glo",
"ninemobile"
);

});

card.classList.add("active");

selectedNetwork = card.dataset.network;

card.classList.add(
selectedNetwork==="9mobile"
? "ninemobile"
: selectedNetwork
);

categorySection.style.display="block";
plansSection.style.display="none";

/* Hide Pay Bar */
payBar.style.display="none";

document.querySelectorAll(".planCard")
.forEach(card=>{

card.classList.remove("active");

});

});
});


// ==========================================// =====================================================
// BILALSADASUB - LOAD DATA PLANS
// =====================================================

async function loadBilalDataPlans(network, category) {

    const plansContainer =
        document.getElementById("plansContainer");

    const plansSection =
        document.getElementById("plansSection");

    if (!plansContainer) return;

    plansSection.style.display = "block";

    plansContainer.innerHTML = `
        <div class="plansLoading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading data plans...
        </div>
    `;

    try {

        const token =
            localStorage.getItem("ge_token");

        if (!token) {

            plansContainer.innerHTML = `
                <div class="plansError">
                    Please login again.
                </div>
            `;

            return;
        }

        const response = await fetch(
            `/api/data/plans?network=${encodeURIComponent(network)}`,
            {
                method: "GET",

                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                }
            }
        );

        const result =
            await response.json();
         
           console.log(
    "DATA PLANS RESPONSE:",
    result
);

      
       
            
           console.log(
           "PLAN TYPES:",
         result.plans.map(plan => plan.plan_type)
      );
        if (!response.ok || !result.success) {

            plansContainer.innerHTML = `
                <div class="plansError">
                    ${result.message || "Unable to load data plans"}
                </div>
            `;

            return;
        }

        if (
            !Array.isArray(result.plans) ||
            result.plans.length === 0
        ) {

            plansContainer.innerHTML = `
                <div class="plansError">
                    No data plans available.
                </div>
            `;

            return;
        }

        // Clear loading
        plansContainer.innerHTML = "";
       
        // FILTER PLANS BY CATEGORY
let plansToShow = result.plans;

if (category) {

    const selectedCategory =
        String(category)
            .toLowerCase()
            .trim();

    plansToShow = result.plans.filter(plan =>
        String(plan.plan_type || "")
            .toLowerCase()
            .trim() === selectedCategory
    );
}

        // Create plans
        plansToShow.forEach(plan => {

            plansContainer.innerHTML += `

                <div class="planCard">

                    <div class="planTop">

                        <span class="planBadge">
                            ${plan.plan_type || "DATA"}
                        </span>

                        <i class="fa-solid fa-angle-right"></i>

                    </div>

                    <div class="planMiddle">

                        <h3>
                            ${plan.plan_name || "-"}
                        </h3>

                        <small>
                            ${plan.plan_day || "-"}
                        </small>

                    </div>

                    <div class="planBottom">

                        <strong>
                            ₦${Number(
                                plan.sellingPrice || plan.amount || 0
                            ).toLocaleString()}
                        </strong>

                    </div>

                    <button
                        class="selectPlan"
                        data-plan-id="${plan.plan_id}"
                        data-name="${plan.plan_name || ""}"
                        data-price="${plan.sellingPrice || plan.amount || 0}"
                        data-validity="${plan.plan_day || ""}"
                        data-type="${plan.plan_type || ""}">
                    </button>

                </div>

            `;

        });

        // Activate plan buttons
        activatePlans();

    } catch (error) {

        console.error(
            "LOAD BILAL PLANS ERROR:",
            error
        );

        plansContainer.innerHTML = `
            <div class="plansError">
                Failed to connect to data service.
            </div>
        `;
    }

}

// ================= CATEGORY =================

// ================= CATEGORY =================

const categoryCards =
    document.querySelectorAll(".categoryCard");

const plansContainer =
    document.getElementById("plansContainer");


// ================= SHOW PLANS =================

categoryCards.forEach(card => {

    card.addEventListener("click", async () => {

        const phoneError =
            document.getElementById("phoneError");

        if (phoneError) {
            phoneError.innerHTML = "";
        }

        const number =
            phoneInput.value.trim();

        // Check phone number
        if (number.length > 0 && number.length < 11) {

            if (phoneError) {
                phoneError.innerHTML =
                    "Number is wrong";
            }

            return;
        }

        if (number.length > 11) {

            if (phoneError) {
                phoneError.innerHTML =
                    "Number is invalid";
            }

            return;
        }

        // Remove old category active
        categoryCards.forEach(c =>
            c.classList.remove("active")
        );

        // Activate selected category
        card.classList.add("active");

        selectedCategory =
            card.dataset.category;

        // Show plans section
        plansSection.style.display = "block";

        // Load REAL plans from Bilalsadasub
        await loadBilalDataPlans(
        selectedNetwork.toUpperCase(),
         selectedCategory

        );

    });

});

// ================= SELECT PLAN =================

function activatePlans() {

    const buttons =
        document.querySelectorAll(".selectPlan");

    buttons.forEach(btn => {

        btn.onclick = () => {

            document
                .querySelectorAll(".planCard")
                .forEach(card =>
                    card.classList.remove("active")
                );

            btn.parentElement.classList.add("active");

            selectedPlanId =
                btn.dataset.planId;

            selectedPlanName =
                btn.dataset.name;

            selectedPlanPrice =
                Number(btn.dataset.price);

            selectedPlanValidity =
                btn.dataset.validity;

            selectedPlanType =
                btn.dataset.type;

            const payBar =
                document.getElementById("payBar");

            if (payBar) {
                payBar.style.display = "flex";
            }

            const payAmount =
                document.getElementById("payAmount");

            if (payAmount) {
                payAmount.innerHTML =
                    "₦" +
                    selectedPlanPrice.toLocaleString();
            }

            const payPlan =
                document.getElementById("payPlan");

            if (payPlan) {
                payPlan.innerHTML =
                    selectedPlanName;
            }

        };

    });

}

let pendingPurchaseType = "data";
// ================= BUY DATA =================

const buyButton = document.getElementById("buyDataBtn");

if (buyButton) {

    buyButton.onclick = () => {

        const phoneInput =
            document.getElementById("phoneNumber");

        const phone =
            phoneInput ? phoneInput.value.trim() : "";

        // Check phone
        if (!/^\d{11}$/.test(phone)) {
            alert("Enter a valid 11-digit phone number");
            return;
        }

        // Check selected network
        if (!selectedNetwork) {
            alert("Please select a network");
            return;
        }

        // Check selected plan
        if (!selectedPlanId) {
            alert("Please select a data plan");
            return;
        }

        // Open existing transaction PIN modal
        // Open existing transaction PIN modal
        pendingPurchaseType = "data";
        openPinModal();
    };
}


// ================= CLOSE SUCCESS =================

function closeSuccess(){

document.getElementById("successModal").style.display="none";

goHome();

}

// ================= BOTTOM NAVIGATION =================

const navItems = document.querySelectorAll(".navItem");

navItems.forEach(item => {

    item.addEventListener("click", () => {

        navItems.forEach(n => n.classList.remove("active"));

        item.classList.add("active");

        const page = item.innerText.trim();

        if (page === "Home") {

    goHome();

} else if (page === "Profile") {

    if (
        !currentUser ||
        currentUser.transactionPin !== true
    ) {
        openSetPinModal();
    } else {
        console.log(
            "PIN already exists. Use Forgot PIN to reset it."
        );
    }

} else {

    alert(page + " Coming Soon");

}

    });

});

// ================= ANIMATION =================

window.addEventListener("load", () => {

    document.body.style.opacity = "0";

    setTimeout(() => {

        document.body.style.transition = "0.5s";

        document.body.style.opacity = "1";

    }, 100);

});

// ================= BANNER =================

const banner = document.querySelector(".banner");

if (banner) {

    banner.addEventListener("click", () => {

        alert("Opening WhatsApp...");

    });

}

// ================= PAY NOW =================

const payNowBtn = document.getElementById("payNowBtn");
const confirmModal = document.getElementById("confirmModal");

payNowBtn.onclick = () => {

    document.getElementById("confirmAmount").innerHTML =
    document.getElementById("payAmount").innerHTML;

    document.getElementById("confirmPhone").innerHTML =
    phoneInput.value || "Not Entered";

    document.getElementById("confirmRecipient").innerHTML =
    phoneInput.value || "Not Entered";

    document.getElementById("confirmNetworkName").innerHTML =
    selectedNetwork || "Not Selected";

    document.getElementById("confirmCategory").innerHTML =
    selectedCategory || "-";

    document.getElementById("confirmPlan").innerHTML =
    document.getElementById("payPlan").innerHTML;

    confirmModal.style.display = "flex";

};


// ================= CLOSE MODAL =================

document.getElementById("closeConfirm").onclick = () => {

    confirmModal.style.display = "none";

};

document.getElementById("cancelPayBtn").onclick = () => {

    confirmModal.style.display = "none";

};


// ================= CONFIRM PAYMENT =================
// ================= OPEN PIN MODAL =================

const pinModal = document.getElementById("pinModal");
const pinInputs = document.querySelectorAll(".pinInput");
const pinError = document.getElementById("pinError");

const confirmPayBtn = document.getElementById("confirmPayBtn");

if (confirmPayBtn) {

    confirmPayBtn.onclick = () => {

        // Close Confirm Purchase Modal
        if (confirmModal) {
            confirmModal.style.display = "none";
        }

        // Open Transaction PIN Modal
        if (pinModal) {
            pinModal.style.display = "flex";
        }

        // Clear old PIN
        pinInputs.forEach(input => {
            input.value = "";
        });

        // Clear error
        if (pinError) {
            pinError.textContent = "";
        }

        // Focus first PIN input
        setTimeout(() => {
            if (pinInputs.length > 0) {
                pinInputs[0].focus();
            }
        }, 100);
    };

}

// ================= AIRTIME PAGE =================


// OPEN AIRTIME HOME BUTTONS

const buyAirtimeCard = document.getElementById("buyAirtimeCard");
const uploadPinCard = document.getElementById("uploadPinCard");


if(buyAirtimeCard){

buyAirtimeCard.onclick = ()=>{

openPage("buyAirtimePage");

};

}



if(uploadPinCard){

uploadPinCard.onclick = ()=>{

openPage("uploadPinPage");

};

}




function goBackAirtime(){

document.querySelectorAll(".page").forEach(p=>{

p.style.display="none";

});


document.getElementById("airtimeHomePage").style.display="block";

}






// ================= AIRTIME AUTO NETWORK =================


const airtimePhone = document.getElementById("airtimePhone");

const airtimeCards = document.querySelectorAll(
"#buyAirtimePage .networkCard"
);


let airtimeNetwork="";



const airtimePrefixes={


mtn:[
"0803","0806","0703","0706",
"0813","0816","0810",
"0814","0903","0906",
"0913","0916","0704"
],


airtel:[
"0802","0808","0701",
"0708","0812",
"0902","0907","0912"
],


glo:[
"0805","0807",
"0811","0815",
"0905","0915"
],


ninemobile:[
"0809","0817",
"0818","0908",
"0909"
]


};





if(airtimePhone){


airtimePhone.addEventListener("input",()=>{

airtimePhone.value = airtimePhone.value
    .replace(/\D/g, "")
    .slice(0, 11);

let error =
document.getElementById(
"airtimePhoneError"
);



error.innerHTML="";



if(airtimePhone.value.length>11){


error.innerHTML=
"Number is invalid";


return;


}




airtimeCards.forEach(card=>{

card.classList.remove("active");

});



airtimeNetwork="";



let number =
airtimePhone.value.substring(0,4);



for(let net in airtimePrefixes){



if(
airtimePrefixes[net].includes(number)
){


let search =
net==="ninemobile"
?
"9mobile"
:
net;



let card =
document.querySelector(
`#buyAirtimePage .networkCard[data-airnetwork="${search}"]`
);



if(card){


card.classList.add("active");


airtimeNetwork=net;


}



}



}



if(
airtimePhone.value.length>=4 &&
airtimeNetwork==""
){


error.innerHTML=
"Number is incorrect";


}



});


}







// ================= CLICK NETWORK =================


airtimeCards.forEach(card=>{


card.onclick=()=>{


airtimeCards.forEach(c=>{

c.classList.remove("active");

});


card.classList.add("active");


airtimeNetwork =
card.dataset.airnetwork;



};



});







// ================= QUICK AMOUNT =================



const quickButtons =
document.querySelectorAll(
"#buyAirtimePage .quickAmount button"
);


const airtimeAmount =
document.getElementById(
"airtimeAmount"
);



quickButtons.forEach(btn=>{

btn.onclick=()=>{

// Cire active daga sauran buttons
quickButtons.forEach(b=>{
    b.classList.remove("active");
});

// Sanya active ga wanda aka danna
btn.classList.add("active");

let amount =
btn.innerText.replace("₦","");

airtimeAmount.value=amount;

checkAirtimeAmount();

};

});



// ================= AMOUNT CHECK =================


function checkAirtimeAmount(){


let error =
document.getElementById(
"amountError"
);



error.innerHTML="";



if(
airtimeAmount.value < 100 &&
airtimeAmount.value!=""
){


error.innerHTML=
"Minimum amount is ₦100";


document.getElementById(
"airtimePayBar"
).style.display="none";


return false;


}



document.getElementById(
"airtimePayAmount"
).innerHTML =
"₦"+airtimeAmount.value;



document.getElementById(
"airtimePayBar"
).style.display="flex";


return true;


}



if(airtimeAmount){


airtimeAmount.addEventListener(
"input",
checkAirtimeAmount
);


}








// ================= PAY NOW =================





// ================= UPLOAD PIN PAGE =================


const uploadNetworks =
document.querySelectorAll(
"#uploadPinPage .networkCard"
);


let uploadNetwork = "";

let uploadAmount = "";



// SELECT NETWORK

uploadNetworks.forEach(card=>{


card.onclick=()=>{


uploadNetworks.forEach(c=>{

c.classList.remove("active");

});


card.classList.add("active");


uploadNetwork =
card.querySelector("span").innerText;



};


});




// QUICK AMOUNT


const uploadQuick =
document.querySelectorAll(
"#uploadPinPage .quickAmount button"
);



const uploadAmountInput =
document.querySelector(
"#uploadPinPage .amountInput input"
);



uploadQuick.forEach(btn=>{

btn.onclick=()=>{

// Cire active daga sauran buttons
uploadQuick.forEach(b=>{
    b.classList.remove("active");
});

// Sanya active ga wanda aka danna
btn.classList.add("active");

uploadAmountInput.value =
btn.innerText.replace("₦","");

uploadAmount =
uploadAmountInput.value;

showUploadPay();

};

});



// INPUT AMOUNT


if(uploadAmountInput){


uploadAmountInput.addEventListener(
"input",
()=>{


uploadAmount =
uploadAmountInput.value;


showUploadPay();


});


}






function showUploadPay(){

    if(uploadAmount < 100 && uploadAmount !== ""){

        document.getElementById("uploadPinPayBar").style.display = "none";
        return;

    }

    if(uploadAmount == ""){

        document.getElementById("uploadPinPayBar").style.display = "none";
        return;

    }

    document.getElementById("uploadPayAmount").innerHTML =
    "₦" + uploadAmount;

    document.getElementById("uploadPayNetwork").innerHTML =
    uploadNetwork || "Airtime PIN";

    document.getElementById("uploadPinPayBar").style.display = "flex";

    uploadPinConfirm();

}





// ================= UPLOAD PIN CONFIRM =================


function uploadPinConfirm(){


const btn =
document.getElementById(
"uploadPinPayNow"
);



if(!btn)return;



btn.onclick=()=>{


if(!uploadNetwork){


alert(
"Select network"
);

return;

}



if(!uploadAmount ||
uploadAmount < 100){


alert(
"Minimum amount is ₦100"
);

return;

}




document.getElementById(
"uploadConfirmAmount"
).innerHTML =
"₦"+uploadAmount;



document.getElementById(
"uploadTableAmount"
).innerHTML =
"₦"+uploadAmount;



document.getElementById(
"uploadTableNetwork"
).innerHTML =
uploadNetwork;



document.getElementById(
"uploadConfirmNetwork"
).innerHTML =
uploadNetwork;



document.getElementById(
"uploadConfirmLogo"
).src =
uploadNetwork.toLowerCase()+".png";




document.getElementById(
"uploadConfirmModal"
).style.display="flex";



};


}






// CLOSE


const closeUploadConfirm =
document.getElementById(
"closeUploadConfirm"
);



if(closeUploadConfirm){


closeUploadConfirm.onclick=()=>{


document.getElementById(
"uploadConfirmModal"
).style.display="none";


};

}





const cancelUploadPayBtn =
document.getElementById(
"cancelUploadPayBtn"
);



if(cancelUploadPayBtn){


cancelUploadPayBtn.onclick=()=>{


document.getElementById(
"uploadConfirmModal"
).style.display="none";


};


}






// FINAL PAYMENT


if(confirmUploadPayBtn){

    confirmUploadPayBtn.onclick = () => {

        pendingPurchaseType = "uploadPin";

        document.getElementById(
            "uploadConfirmModal"
        ).style.display = "none";

        openPinModal();
    };
}


// ================= BUY AIRTIME CONFIRM =================

const airtimePayBtn = document.getElementById("airtimePayNow");
const airtimeConfirm = document.getElementById("airtimeConfirmModal");

if (airtimePayBtn) {

    airtimePayBtn.onclick = () => {
      
       pendingPurchaseType = "airtime";

        let phone = airtimePhone.value.trim();
        let amount = airtimeAmount.value.trim();

        document.getElementById("airtimePhoneError").innerHTML = "";
        document.getElementById("amountError").innerHTML = "";

        if (phone.length !== 11) {
            document.getElementById("airtimePhoneError").innerHTML = "Number is incorrect";
            return;
        }

        if (!amount || Number(amount) < 100) {
            document.getElementById("amountError").innerHTML = "Minimum amount is ₦100";
            return;
        }

        if (airtimeNetwork == "") {
            alert("Select network");
            return;
        }

        document.getElementById("airtimeConfirmAmount").innerHTML = "₦" + amount;
        document.getElementById("airtimeConfirmPhone").innerHTML = phone;
        document.getElementById("airtimeTableNetwork").innerHTML = airtimeNetwork.toUpperCase();
        document.getElementById("airtimeTableAmount").innerHTML = "₦" + amount;
        document.getElementById("airtimeTablePhone").innerHTML = phone;
        document.getElementById("airtimeConfirmNetwork").innerHTML = airtimeNetwork.toUpperCase();
        document.getElementById("airtimeConfirmLogo").src = airtimeNetwork + ".png";

        airtimeConfirm.style.display = "flex";

    };

}

const closeAirtime = document.getElementById("closeAirtimeConfirm");

if (closeAirtime) {
    closeAirtime.onclick = () => {
        airtimeConfirm.style.display = "none";
    };
}

const cancelAirtime = document.getElementById("cancelAirtimePayBtn");

if (cancelAirtime) {
    cancelAirtime.onclick = () => {
        airtimeConfirm.style.display = "none";
    };
}

const confirmAirtimePayBtn =
document.getElementById("confirmAirtimePayBtn");

if(confirmAirtimePayBtn){

    confirmAirtimePayBtn.onclick = ()=>{
       
       pendingPurchaseType = "airtime";

        airtimeConfirm.style.display = "none";

        openPinModal();

    };

}

// =====================================================
// TRANSACTION PIN SYSTEM
// =====================================================

const cancelPinBtn = document.getElementById("cancelPinBtn");


// -----------------------------------------------------
// OPEN PIN MODAL
// -----------------------------------------------------

function openPinModal() {

    if (!pinModal) return;

    pinModal.style.display = "flex";

    pinInputs.forEach(input => {
        input.value = "";
    });

    if (pinError) {
        pinError.textContent = "";
    }

    setTimeout(() => {
        if (pinInputs.length > 0) {
            pinInputs[0].focus();
        }
    }, 100);
}


// -----------------------------------------------------
// CLOSE PIN MODAL
// -----------------------------------------------------

function closePinModal() {

    if (!pinModal) return;

    pinModal.style.display = "none";

    pinInputs.forEach(input => {
        input.value = "";
    });

    if (pinError) {
        pinError.textContent = "";
    }
}


// -----------------------------------------------------
// CANCEL BUTTON
// -----------------------------------------------------

if (cancelPinBtn) {

    cancelPinBtn.addEventListener("click", () => {

        closePinModal();

    });

}


// -----------------------------------------------------
// PIN INPUT
// -----------------------------------------------------

pinInputs.forEach((input, index) => {

    input.addEventListener("input", async () => {

        input.value = input.value.replace(/\D/g, "");

        // Move to next input
        if (input.value && index < pinInputs.length - 1) {

            pinInputs[index + 1].focus();

        }

        // Check if all 4 PIN digits are entered
        if (getTransactionPin().length === 4) {

            await verifyTransactionPin();

        }

    });


    input.addEventListener("keydown", (e) => {

        if (
            e.key === "Backspace" &&
            !input.value &&
            index > 0
        ) {

            pinInputs[index - 1].focus();

        }

    });

});

// -----------------------------------------------------
// GET PIN
// -----------------------------------------------------

function getTransactionPin() {

    let pin = "";

    pinInputs.forEach(input => {

        pin += input.value;

    });

    return pin;

}


// -----------------------------------------------------
// VERIFY PIN WITH SERVER
// -----------------------------------------------------

async function verifyTransactionPin() {
     console.log("🔥 VERIFY PIN CALLED", Date.now());
    const token = localStorage.getItem("ge_token");

    if (!token) {

        if (pinError) {
            pinError.textContent = "Please login again.";
        }

        return false;
    }


    const pin = getTransactionPin();


    if (!/^\d{4}$/.test(pin)) {

        if (pinError) {
            pinError.textContent = "Enter your 4-digit PIN.";
        }

        return false;
    }


    try {

        const response = await fetch("/api/user/verify-pin", {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },

            body: JSON.stringify({
                pin: pin
            })

        });


        const data = await response.json();


        if (!response.ok || !data.success) {

    if (pinError) {
        pinError.textContent =
            data.message || "Incorrect PIN.";
    }

    return false;
}

// PIN ya yi daidai
closePinModal();

// Sai a fara purchase da aka nema
console.log(
    "PURCHASE TYPE BEFORE PIN ACTION:",
    pendingPurchaseType
);

const purchaseType = pendingPurchaseType;

if (purchaseType === "airtime") {

    await purchaseAirtimeAfterPin(pin);

} else if (purchaseType === "data") {

    await purchaseDataAfterPin(pin);

} else if (purchaseType === "uploadPin") {

    await purchaseUploadPinAfterPin(pin);

}

return true;


    } catch (error) {

        console.error(
            "VERIFY PIN ERROR:",
            error
        );

        if (pinError) {
            pinError.textContent =
                "Unable to verify PIN.";
        }

        return false;

    }

}

// ==========================================
// BUY DATA AFTER PIN VERIFICATION
// ==========================================

async function purchaseDataAfterPin(pin) {
       console.log("🔥 AIRTIME PURCHASE STARTED");

    const token = localStorage.getItem("ge_token");

    if (!token) {
        alert("Please login again.");
        return;
    }

    const phoneInput =
        document.getElementById("phoneNumber");

    const phone = phoneInput
        ? phoneInput.value.trim()
        : "";

    if (!/^\d{11}$/.test(phone)) {
        alert("Enter a valid 11-digit phone number");
        return;
    }

    if (!selectedNetwork) {
        alert("Please select a network");
        return;
    }

    if (!selectedPlanId) {
        alert("Please select a data plan");
        return;
    }

    // ==========================================
    // SHOW PROCESSING
    // ==========================================

    const processingModal =
        document.getElementById("processingModal");

    if (processingModal) {
        processingModal.style.display = "flex";
    }

    try {

        const response = await fetch(
            "/api/data/purchase",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },

                body: JSON.stringify({
                    network: selectedNetwork,
                    phone: phone,
                    data_plan: selectedPlanId,

                    // IMPORTANT:
                    // Use the verified PIN
                    pin: pin
                })
            }
        );

        const result = await response.json();

        console.log("AIRTIME PURCHASE RESPONSE:",
            result
        );
         console.log("🔥 AIRTIME PURCHASE STARTED");
        // ==========================================
        // PURCHASE FAILED
        // ==========================================

        if (!response.ok || !result.success) {

            if (processingModal) {
                processingModal.style.display = "none";
            }

            alert(
                result.message ||
                "Data purchase failed"
            );

            return;
        }

        // ==========================================
        // PURCHASE SUCCESS
        // ==========================================

        if (processingModal) {
            processingModal.style.display = "none";
        }

        const successModal =
            document.getElementById("successModal");

          if (successModal) {
    successModal.style.display = "flex";
    successModal.classList.add("show");

           
        }

        // Update balance
        if (
            typeof updateDashboardUser === "function"
        ) {
            await updateDashboardUser();
        }

        console.log(
            "DATA PURCHASE SUCCESS:",
            result
        );

    } catch (error) {

        console.error(
            "DATA PURCHASE ERROR:",
            error
        );

        // Hide processing
        if (processingModal) {
            processingModal.style.display = "none";
        }

        alert(
            "Unable to complete data purchase"
        );
    }
}

// -----------------------------------------------------
// GLOBAL ACCESS
// ----------------------------------------
window.openPinModal = openPinModal;
window.closePinModal = closePinModal;
window.verifyTransactionPin = verifyTransactionPin;


// =====================================================
// PROFILE → TRANSACTION PIN
// =====================================================


if (profileNav) {

    profileNav.addEventListener("click", () => {

        // Hide all pages
        document.querySelectorAll(".page").forEach(page => {
            page.style.display = "none";
        });

        // Hide Dashboard
        const homePage = document.getElementById("homePage");

        if (homePage) {
            homePage.style.display = "none";
        }

        // Show Profile page
        const profilePage =
            document.getElementById("profilePage");

        if (profilePage) {
            profilePage.style.display = "block";
        }

        // Remove active navigation
        document.querySelectorAll(".navItem").forEach(item => {
            item.classList.remove("active");
        });

        // Activate Profile
        profileNav.classList.add("active");

    });

}

// ================= SERVER DATA LOAD =================

loadCurrentUser();
loadHistory();

// =====================================================
// SET TRANSACTION PIN
// =====================================================

const setPinModal = document.getElementById("setPinModal");
const setPinInputs = document.querySelectorAll(".setPinInput");
const setPinError = document.getElementById("setPinError");
const savePinBtn = document.getElementById("savePinBtn");
const cancelSetPinBtn = document.getElementById("cancelSetPinBtn");

// OPEN SET PIN MODAL
function openSetPinModal() {
    if (!setPinModal) return;

    setPinModal.style.display = "flex";

    setPinInputs.forEach(input => {
        input.value = "";
    });

    if (setPinError) {
        setPinError.textContent = "";
    }

    setTimeout(() => {
        if (setPinInputs.length > 0) {
            setPinInputs[0].focus();
        }
    }, 100);
}

// CLOSE SET PIN MODAL
function closeSetPinModal() {
    if (!setPinModal) return;

    setPinModal.style.display = "none";

    setPinInputs.forEach(input => {
        input.value = "";
    });

    if (setPinError) {
        setPinError.textContent = "";
    }
}

// PIN INPUT
setPinInputs.forEach((input, index) => {

    input.addEventListener("input", () => {

        input.value = input.value.replace(/\D/g, "").slice(0, 1);

        if (input.value && index < setPinInputs.length - 1) {
            setPinInputs[index + 1].focus();
        }
    });

    input.addEventListener("keydown", (e) => {

        if (
            e.key === "Backspace" &&
            !input.value &&
            index > 0
        ) {
            setPinInputs[index - 1].focus();
        }
    });
});

// GET NEW PIN
function getSetPin() {
    let pin = "";

    setPinInputs.forEach(input => {
        pin += input.value;
    });

    return pin;
}

// SAVE PIN
if (savePinBtn) {

    savePinBtn.addEventListener("click", async () => {

        const token = localStorage.getItem("ge_token");

        if (!token) {
            setPinError.textContent = "Please login again.";
            return;
        }

        const pin = getSetPin();

        if (!/^\d{4}$/.test(pin)) {
            setPinError.textContent = "Enter your 4-digit PIN.";
            return;
        }

        savePinBtn.disabled = true;
        savePinBtn.textContent = "Saving...";

        try {

            const response = await fetch("/api/user/set-pin", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },

                body: JSON.stringify({
                    pin: pin
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {

                setPinError.textContent =
                    data.message || "Failed to save PIN.";

                return;
            }

            closeSetPinModal();

            alert("Transaction PIN created successfully.");

        } catch (error) {

            console.error("SET PIN ERROR:", error);

            setPinError.textContent =
                "Unable to save PIN.";

        } finally {

            savePinBtn.disabled = false;
            savePinBtn.textContent = "Save PIN";

        }
    });
}

// CANCEL
if (cancelSetPinBtn) {

    cancelSetPinBtn.addEventListener("click", () => {
        closeSetPinModal();
    });

}

// GLOBAL ACCESS
window.openSetPinModal = openSetPinModal;
window.closeSetPinModal = closeSetPinModal;

// =====================================================
// FORGOT / RESET TRANSACTION PIN
// =====================================================

const forgotPinBtn = document.getElementById("forgotPinBtn");
const forgotPinModal = document.getElementById("forgotPinModal");
const cancelForgotPinBtn = document.getElementById("cancelForgotPinBtn");
const resetPinBtn = document.getElementById("resetPinBtn");

const forgotPinPassword =
    document.getElementById("forgotPinPassword");

const forgotPinInputs =
    document.querySelectorAll(".forgotPinInput");

const forgotPinError =
    document.getElementById("forgotPinError");


// ================= OPEN FORGOT PIN =================

if (forgotPinBtn) {

    forgotPinBtn.onclick = () => {

        if (pinModal) {
            pinModal.style.display = "none";
        }

        if (forgotPinModal) {
            forgotPinModal.style.display = "flex";
        }

        forgotPinPassword.value = "";

        forgotPinInputs.forEach(input => {
            input.value = "";
        });

        forgotPinError.textContent = "";

        setTimeout(() => {
            forgotPinPassword.focus();
        }, 100);

    };

}


// ================= CLOSE FORGOT PIN =================

if (cancelForgotPinBtn) {

    cancelForgotPinBtn.onclick = () => {

        forgotPinModal.style.display = "none";

        forgotPinPassword.value = "";

        forgotPinInputs.forEach(input => {
            input.value = "";
        });

        forgotPinError.textContent = "";

    };

}


// ================= FORGOT PIN INPUT =================

forgotPinInputs.forEach((input, index) => {

    input.addEventListener("input", () => {

        input.value = input.value.replace(/\D/g, "");

        if (
            input.value &&
            index < forgotPinInputs.length - 1
        ) {

            forgotPinInputs[index + 1].focus();

        }

    });


    input.addEventListener("keydown", (e) => {

        if (
            e.key === "Backspace" &&
            !input.value &&
            index > 0
        ) {

            forgotPinInputs[index - 1].focus();

        }

    });

});


// ================= GET NEW PIN =================

function getForgotPin() {

    let pin = "";

    forgotPinInputs.forEach(input => {
        pin += input.value;
    });

    return pin;

}


// ================= RESET PIN =================

if (resetPinBtn) {

    resetPinBtn.onclick = async () => {

        const password =
            forgotPinPassword.value.trim();

        const pin =
            getForgotPin();

        forgotPinError.textContent = "";


        if (!password) {

            forgotPinError.textContent =
                "Enter your login password.";

            forgotPinPassword.focus();

            return;
        }


        if (!/^\d{4}$/.test(pin)) {

            forgotPinError.textContent =
                "Enter your new 4-digit PIN.";

            return;
        }


        const token =
            localStorage.getItem("ge_token");


        if (!token) {

            forgotPinError.textContent =
                "Please login again.";

            return;
        }


        resetPinBtn.disabled = true;
        resetPinBtn.textContent = "Resetting...";


        try {

            const response = await fetch(
                "/api/user/reset-pin",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token
                    },

                    body: JSON.stringify({
                        password: password,
                        pin: pin
                    })
                }
            );


            const data =
                await response.json();


            if (!response.ok || !data.success) {

                forgotPinError.textContent =
                    data.message ||
                    "Failed to reset PIN.";

                return;
            }


            // SUCCESS

            forgotPinError.style.color = "green";

            forgotPinError.textContent =
                "Transaction PIN reset successfully.";


            setTimeout(() => {

                forgotPinModal.style.display =
                    "none";

                forgotPinPassword.value = "";

                forgotPinInputs.forEach(input => {
                    input.value = "";
                });

                forgotPinError.textContent = "";
                forgotPinError.style.color = "";

            }, 1200);


        } catch (error) {

            console.error(
                "RESET PIN ERROR:",
                error
            );

            forgotPinError.textContent =
                "Unable to reset PIN.";

        } finally {

            resetPinBtn.disabled = false;

            resetPinBtn.textContent =
                "Reset PIN";

        }

    };

}

// ==========================================
// BUY AIRTIME AFTER PIN VERIFICATION
// ==========================================
   async function purchaseAirtimeAfterPin(pin) {

    const token = localStorage.getItem("ge_token");

    if (!token) {
        alert("Please login again.");
        return;
    }

    const phoneInput = document.getElementById("airtimePhone");
    const amountInput = document.getElementById("airtimeAmount");

    const phone = phoneInput ? phoneInput.value.trim() : "";
    const amount = amountInput ? Number(amountInput.value) : 0;

    if (!/^\d{11}$/.test(phone)) {
        alert("Enter a valid 11-digit phone number");
        return;
    }

    if (!airtimeNetwork) {
        alert("Please select a network");
        return;
    }

    if (!Number.isInteger(amount) || amount < 100) {
        alert("Minimum airtime amount is ₦100");
        return;
    }

    const processingModal =
        document.getElementById("processingModal");

    if (processingModal) {
        processingModal.style.display = "flex";
    }

    try {

        const response = await fetch("/api/airtime/purchase", {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },

            body: JSON.stringify({
                network: airtimeNetwork,
                phone: phone,
                amount: amount,
                plan_type: "VTU",
                pin: pin
            })
        });

        const result = await response.json();

        console.log("AIRTIME PURCHASE RESPONSE:", result);

        // ==========================
        // PURCHASE FAILED
        // ==========================

        if (!response.ok || !result.success) {

            if (processingModal) {
                processingModal.style.display = "none";
            }

            alert(
                result.message ||
                "Airtime purchase failed"
            );

            return;
        }

        // ==========================
        // PURCHASE SUCCESS
        // ==========================

        if (processingModal) {
            processingModal.style.display = "none";
        }

        // CLOSE AIRTIME CONFIRM MODAL
        const airtimeConfirm =
            document.getElementById("airtimeConfirmModal");

        if (airtimeConfirm) {
            airtimeConfirm.style.display = "none";
        }

        // SHOW SUCCESS MODAL
        const airtimeSuccessModal =
    document.getElementById("airtimeSuccessModal");

if (airtimeSuccessModal) {
    airtimeSuccessModal.style.display = "flex";
}

        // UPDATE BALANCE
        if (typeof updateDashboardUser === "function") {
            try {
                await updateDashboardUser();
            } catch (balanceError) {
                console.error(
                    "BALANCE UPDATE ERROR:",
                    balanceError
                );
            }
        }

        console.log(
            "AIRTIME PURCHASE SUCCESS:",
            result
        );

    } catch (error) {

        console.error(
            "AIRTIME PURCHASE ERROR:",
            error
        );

        if (processingModal) {
            processingModal.style.display = "none";
        }

        alert("Unable to complete airtime purchase");
    }
}
                                      
    const airtimeSuccessDone =
    document.getElementById("airtimeSuccessDone");

if (airtimeSuccessDone) {
    airtimeSuccessDone.onclick = () => {
    window.location.reload();
  };
}
    

async function purchaseUploadPinAfterPin(pin) {

    const processingModal =
        document.getElementById("processingModal");

    try {

        const token =
            localStorage.getItem("ge_token");

        if (!token) {
            alert("Please login again.");
            return;
        }

        // SHOW PROCESSING
        if (processingModal) {
            processingModal.style.display = "flex";
        }

        const response = await fetch(
            "/api/airtime-pin/purchase",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },

                body: JSON.stringify({
                    network: uploadNetwork,
                    amount: uploadAmount,
                    pin: pin
                })
            }
        );

        const result =
            await response.json();

        console.log(
            "UPLOAD PIN PURCHASE RESPONSE:",
            result
        );

        // PURCHASE FAILED
        if (!response.ok || !result.success) {

            if (processingModal) {
                processingModal.style.display = "none";
            }

            alert(
                result.message ||
                "PIN purchase failed."
            );

            return;
        }

        // HIDE PROCESSING
        if (processingModal) {
            processingModal.style.display = "none";
        }

        // SHOW SUCCESS PIN CARD
        const successModal =
            document.getElementById(
                "uploadPinSuccessModal"
            );

        const purchasedPinValue =
            document.getElementById(
                "purchasedPinValue"
            );

        if (purchasedPinValue) {
            purchasedPinValue.textContent =
                result.pin;
        }

        if (successModal) {
            successModal.style.display = "flex";
        }

        // UPDATE BALANCE
        if (
            typeof updateDashboardUser ===
            "function"
        ) {
            try {
                await updateDashboardUser();
            } catch (balanceError) {

                console.error(
                    "BALANCE UPDATE ERROR:",
                    balanceError
                );

            }
        }

        console.log(
            "UPLOAD PIN PURCHASE SUCCESS:",
            result
        );

    } catch (error) {

        console.error(
            "UPLOAD PIN PURCHASE ERROR:",
            error
        );

        if (processingModal) {
            processingModal.style.display = "none";
        }

        alert(
            "Unable to purchase PIN."
        );
    }
}

// ================================
// AIRTIME PIN SUCCESS MODAL
// ================================

const closePinSuccessModal =
    document.getElementById("closePinSuccessModal");

const donePinSuccess =
    document.getElementById("donePinSuccess");

const copyPurchasedPin =
    document.getElementById("copyPurchasedPin");

const openPurchasedPin =
    document.getElementById("openPurchasedPin");

const uploadPinSuccessModal =
    document.getElementById("uploadPinSuccessModal");

const purchasedPinValue =
    document.getElementById("purchasedPinValue");


function closeUploadPinSuccessModal() {

    if (uploadPinSuccessModal) {
        uploadPinSuccessModal.style.display = "none";
    }

}


if (closePinSuccessModal) {

    closePinSuccessModal.onclick =
        closeUploadPinSuccessModal;

}


if (donePinSuccess) {

    donePinSuccess.onclick =
        closeUploadPinSuccessModal;

}


if (copyPurchasedPin) {

    copyPurchasedPin.onclick = async () => {

        const pin =
            purchasedPinValue?.textContent.trim();

        if (!pin) return;

        try {

            await navigator.clipboard.writeText(pin);

            copyPurchasedPin.innerHTML =
                '<i class="fa-solid fa-check"></i> Copied';

            setTimeout(() => {

                copyPurchasedPin.innerHTML =
                    '<i class="fa-solid fa-copy"></i> Copy PIN';

            }, 1500);

        } catch (error) {

            alert("Unable to copy PIN.");

        }

    };

}


if (openPurchasedPin) {

    openPurchasedPin.onclick = () => {

        const pin =
            purchasedPinValue?.textContent.trim();

        if (!pin) return;

        window.location.href =
            "tel:" + pin;

    };

}

// ================= OPEN FULL HISTORY =================

const seeAllHistory = document.getElementById("seeAllHistory");

if (seeAllHistory) {

    seeAllHistory.onclick = async (e) => {

        e.preventDefault();

        openPage("historyPage");

        await loadFullHistory();

    };

}

// ==========================================
// //DASHBOARD - LATEST 5 TRANSACTIONS
// ==========================================

async function loadDashboardHistory() {

    const historyList =
        document.getElementById("dashboardHistoryList");

    if (!historyList) return;

    const token = localStorage.getItem("ge_token");

    if (!token) {
        historyList.innerHTML = `
            <div class="historyLoading">
                Please login again.
            </div>
        `;
        return;
    }

    try {

        const response = await fetch("/api/user/history", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Failed to load history"
            );
        }

        const transactions =
            Array.isArray(result.transactions)
                ? result.transactions.slice(0, 5)
                : [];

        if (transactions.length === 0) {

            historyList.innerHTML = `
                <div class="historyEmpty">
                    <i class="fa-solid fa-clock-rotate-left"></i>

                    <h3>No Transactions</h3>

                    <p>Your transactions will appear here.</p>
                </div>
            `;

            return;
        }

        historyList.innerHTML =
            transactions.map(transaction => {

                const type =
                    String(transaction.type || "").toUpperCase();

                let title = "Transaction";
                let icon = "fa-receipt";
                let iconClass = "data";

                if (type === "DATA") {
                    title = "Data Purchase";
                    icon = "fa-wifi";
                    iconClass = "data";
                }

                else if (type === "AIRTIME") {
                    title = "Airtime Purchase";
                    icon = "fa-phone";
                    iconClass = "airtime";
                }

                else if (type === "AIRTIME_PIN") {
                    title = "Airtime PIN";
                    icon = "fa-key";
                    iconClass = "pin";
                }

                else if (type === "FUND") {
                    title = "Wallet Funding";
                    icon = "fa-wallet";
                    iconClass = "fund";
                }

                const amount =
                    Number(transaction.amount || 0);

                const status =
                    String(
                        transaction.status || "success"
                    ).toLowerCase();

                const date = formatHistoryDate(
                    transaction.createdAt
                );

                return `
                    <div class="historyTransaction"
                         data-history-id="${transaction.id || ""}">

                        <div class="historyTransactionIcon ${iconClass}">
                            <i class="fa-solid ${icon}"></i>
                        </div>

                        <div class="historyTransactionDetails">

                            <h4>${title}</h4>

                            <p>${date}</p>

                        </div>

                        <div class="historyTransactionRight">

                            <span class="historyTransactionAmount">
                                ₦${amount.toLocaleString()}
                            </span>

                            <span class="historyTransactionStatus ${status}">
                                ${status}
                            </span>

                        </div>

                    </div>
                `;

            }).join("");

    } catch (error) {

        console.error(
            "DASHBOARD HISTORY ERROR:",
            error
        );

        historyList.innerHTML = `
            <div class="historyEmpty">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>Unable to load history</h3>

                <p>Please try again.</p>

            </div>
        `;
    }
}


// ==========================================
// HISTORY DATE + TIME
// ==========================================

function formatHistoryDate(value) {

    if (!value) {
        return "Date unavailable";
    }

    let date;

    if (value._seconds) {
        date = new Date(value._seconds * 1000);
    }

    else if (value.seconds) {
        date = new Date(value.seconds * 1000);
    }

    else {
        date = new Date(value);
    }

    if (isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}


// ==========================================
// LOAD HISTORY AFTER LOGIN
// ==========================================

loadDashboardHistory();


// ==========================================
// FULL HISTORY PAGE
// ==========================================

let allHistoryTransactions = [];

async function loadFullHistory() {

    const historyList =
        document.getElementById("fullHistoryList");

    if (!historyList) return;

    const token = localStorage.getItem("ge_token");

    if (!token) {
        historyList.innerHTML = `
            <div class="historyEmpty">
                <h3>Session Expired</h3>
                <p>Please login again.</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = `
        <div class="historyLoading">
            Loading transactions...
        </div>
    `;

    try {

        const response = await fetch("/api/user/history", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Failed to load history"
            );
        }

        allHistoryTransactions =
            Array.isArray(result.transactions)
                ? result.transactions
                : [];

        renderFullHistory(allHistoryTransactions);

    } catch (error) {

        console.error(
            "FULL HISTORY ERROR:",
            error
        );

        historyList.innerHTML = `
            <div class="historyEmpty">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>Unable to load history</h3>

                <p>Please try again.</p>

            </div>
        `;
    }
}


// ==========================================
// RENDER FULL HISTORY
// ==========================================

function renderFullHistory(transactions) {

    const historyList =
        document.getElementById("fullHistoryList");

    if (!historyList) return;

    if (!transactions.length) {

        historyList.innerHTML = `
            <div class="historyEmpty">

                <i class="fa-solid fa-clock-rotate-left"></i>

                <h3>No Transactions</h3>

                <p>Your transactions will appear here.</p>

            </div>
        `;

        return;
    }

    historyList.innerHTML =
        transactions.map(transaction => {

            const type =
                String(transaction.type || "").toUpperCase();

            let title = "Transaction";
            let icon = "fa-receipt";
            let iconClass = "data";

            if (type === "DATA") {

                title = "Data Purchase";
                icon = "fa-wifi";
                iconClass = "data";

            } else if (type === "AIRTIME") {

                title = "Airtime Purchase";
                icon = "fa-phone";
                iconClass = "airtime";

            } else if (type === "AIRTIME_PIN") {

                title = "Airtime PIN";
                icon = "fa-key";
                iconClass = "pin";

            } else if (type === "FUND") {

                title = "Wallet Funding";
                icon = "fa-wallet";
                iconClass = "fund";

            }

            const amount =
                Number(transaction.amount || 0);

            const status =
                String(
                    transaction.status || "success"
                ).toLowerCase();

            const date =
                formatHistoryDate(
                    transaction.createdAt
                );

            return `
                <div class="historyTransaction"
                     data-history-id="${transaction.id || ""}">

                    <div class="historyTransactionIcon ${iconClass}">
                        <i class="fa-solid ${icon}"></i>
                    </div>

                    <div class="historyTransactionDetails">

                        <h4>${title}</h4>

                        <p>${date}</p>

                    </div>

                    <div class="historyTransactionRight">

                        <span class="historyTransactionAmount">
                            ₦${amount.toLocaleString()}
                        </span>

                        <span class="historyTransactionStatus ${status}">
                            ${status}
                        </span>

                    </div>

                </div>
            `;

        }).join("");
}

// ==========================================
// HISTORY FILTERS
// ==========================================

const historyFilters =
    document.querySelectorAll(".historyFilter");

historyFilters.forEach(filter => {

    filter.addEventListener("click", () => {

        // Remove active
        historyFilters.forEach(btn => {
            btn.classList.remove("active");
        });

        // Add active
        filter.classList.add("active");

        const selectedFilter =
            filter.dataset.historyFilter;

        let filteredTransactions =
            allHistoryTransactions;

        if (selectedFilter !== "all") {

            filteredTransactions =
                allHistoryTransactions.filter(transaction => {

                    const type =
                        String(
                            transaction.type || ""
                        ).toUpperCase();

                    if (selectedFilter === "data") {
                        return type === "DATA";
                    }

                    if (selectedFilter === "airtime") {
                        return type === "AIRTIME";
                    }

                    if (selectedFilter === "pin") {
                        return type === "AIRTIME_PIN";
                    }

                    if (selectedFilter === "fund") {
                        return type === "FUND";
                    }

                    return true;
                });
        }

        renderFullHistory(
            filteredTransactions
        );

    });

});

// ==========================================
// HISTORY SEARCH - PHONE OR AMOUNT
// ==========================================

const historySearchInput =
    document.getElementById("historySearchInput");

const clearHistorySearch =
    document.getElementById("clearHistorySearch");

if (historySearchInput) {

    historySearchInput.addEventListener("input", () => {

        const search =
            historySearchInput.value
                .trim()
                .toLowerCase();

        if (clearHistorySearch) {
            clearHistorySearch.style.display =
                search ? "flex" : "none";
        }

        // Empty search = show all
        if (!search) {
            renderFullHistory(allHistoryTransactions);
            return;
        }

        const filteredTransactions =
            allHistoryTransactions.filter(transaction => {

                const phone = String(
                    transaction.phone ||
                    transaction.phoneNumber ||
                    ""
                ).toLowerCase();

                const amount = String(
                    Number(transaction.amount || 0)
                ).toLowerCase();

                return (
                    phone.includes(search) ||
                    amount.includes(search)
                );

            });

        renderFullHistory(filteredTransactions);

    });

}


// CLEAR SEARCH

if (clearHistorySearch) {

    clearHistorySearch.addEventListener("click", () => {

        historySearchInput.value = "";

        clearHistorySearch.style.display = "none";

        renderFullHistory(allHistoryTransactions);

        historySearchInput.focus();

    });

}

// ==========================================
// TRANSACTION DETAILS
// ==========================================

const transactionDetailsModal =
    document.getElementById("transactionDetailsModal");

const closeTransactionDetails =
    document.getElementById("closeTransactionDetails");

const closeTransactionDetailsBtn =
    document.getElementById("closeTransactionDetailsBtn");

const transactionDetailsTitle =
    document.getElementById("transactionDetailsTitle");

const transactionDetailsSubtitle =
    document.getElementById("transactionDetailsSubtitle");

const transactionDetailsIcon =
    document.getElementById("transactionDetailsIcon");

const transactionDetailsAmount =
    document.getElementById("transactionDetailsAmount");

const transactionDetailsType =
    document.getElementById("transactionDetailsType");

const transactionDetailsNetwork =
    document.getElementById("transactionDetailsNetwork");

const transactionDetailsPhone =
    document.getElementById("transactionDetailsPhone");

const transactionDetailsDate =
    document.getElementById("transactionDetailsDate");

const transactionDetailsStatus =
    document.getElementById("transactionDetailsStatus");

const transactionPinSection =
    document.getElementById("transactionPinSection");

const transactionDetailsPin =
    document.getElementById("transactionDetailsPin");

const transactionCopyPin =
    document.getElementById("transactionCopyPin");

const transactionOpenKeypad =
    document.getElementById("transactionOpenKeypad");


// ==========================================
// OPEN TRANSACTION DETAILS
// ==========================================

function openTransactionDetails(transaction) {

    if (!transactionDetailsModal) return;

    const type =
        String(transaction.type || "").toUpperCase();

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

    // TITLE
    if (transactionDetailsTitle) {
        transactionDetailsTitle.textContent = title;
    }

    // SUBTITLE
    if (transactionDetailsSubtitle) {
        transactionDetailsSubtitle.textContent =
            "Transaction details";
    }

    // ICON
    if (transactionDetailsIcon) {

        transactionDetailsIcon.className =
            "fa-solid " + icon;

    }

    // AMOUNT
    const amount =
        Number(transaction.amount || 0);

    if (transactionDetailsAmount) {

        transactionDetailsAmount.textContent =
            "₦" + amount.toLocaleString();

    }

    // TYPE
    if (transactionDetailsType) {

        transactionDetailsType.textContent =
            type || "-";

    }

    // NETWORK
    if (transactionDetailsNetwork) {

        transactionDetailsNetwork.textContent =
            transaction.network || "-";

    }

    // PHONE
    if (transactionDetailsPhone) {

        transactionDetailsPhone.textContent =
            transaction.phone ||
            transaction.phoneNumber ||
            "-";

    }

    // DATE
    if (transactionDetailsDate) {

        transactionDetailsDate.textContent =
            formatHistoryDate(
                transaction.createdAt
            );

    }

    // STATUS
    const status =
        String(
            transaction.status || "success"
        ).toUpperCase();

    if (transactionDetailsStatus) {

        transactionDetailsStatus.textContent =
            status;

    }


    // ======================================
    // PIN DETAILS
    // ======================================

    if (type === "AIRTIME_PIN" && transaction.pin) {

        if (transactionPinSection) {
            transactionPinSection.style.display = "block";
        }

        if (transactionDetailsPin) {
            transactionDetailsPin.textContent =
                transaction.pin;
        }

    } else {

        if (transactionPinSection) {
            transactionPinSection.style.display = "none";
        }

        if (transactionDetailsPin) {
            transactionDetailsPin.textContent = "-";
        }

    }


    // SHOW MODAL

    transactionDetailsModal.style.display = "flex";
}


// ==========================================
// CLOSE TRANSACTION DETAILS
// ==========================================

function closeTransactionDetailsModal() {

    if (transactionDetailsModal) {

        transactionDetailsModal.style.display =
            "none";

    }

}

if (closeTransactionDetails) {

    closeTransactionDetails.onclick =
        closeTransactionDetailsModal;

}

if (closeTransactionDetailsBtn) {

    closeTransactionDetailsBtn.onclick =
        closeTransactionDetailsModal;

}


// Close when clicking outside

if (transactionDetailsModal) {

    transactionDetailsModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                transactionDetailsModal
            ) {

                closeTransactionDetailsModal();

            }

        }
    );

}


// ==========================================
// CLICK TRANSACTION
// ==========================================

if (document.getElementById("fullHistoryList")) {

    document
        .getElementById("fullHistoryList")
        .addEventListener("click", (event) => {

            const transactionCard =
                event.target.closest(
                    ".historyTransaction"
                );

            if (!transactionCard) return;

            const transactionId =
                transactionCard.dataset.historyId;

            const transaction =
                allHistoryTransactions.find(
                    item =>
                        item.id === transactionId
                );

            if (!transaction) return;

            openTransactionDetails(transaction);

        });

}


// ==========================================
// COPY PIN
// ==========================================

if (transactionCopyPin) {

    transactionCopyPin.onclick = async () => {

        const pin =
            transactionDetailsPin?.textContent.trim();

        if (!pin || pin === "-") return;

        try {

            await navigator.clipboard.writeText(pin);

            transactionCopyPin.innerHTML =
                '<i class="fa-solid fa-check"></i> Copied';

            setTimeout(() => {

                transactionCopyPin.innerHTML =
                    '<i class="fa-solid fa-copy"></i> Copy PIN';

            }, 1500);

        } catch (error) {

            alert("Unable to copy PIN.");

        }

    };

}


// ==========================================
// OPEN KEYPAD
// ==========================================

if (transactionOpenKeypad) {

    transactionOpenKeypad.onclick = () => {

        const pin =
            transactionDetailsPin?.textContent.trim();

        if (!pin || pin === "-") return;

        window.location.href =
            "tel:" + pin;

    };

}

// ================= HISTORY ICON =================

document.querySelectorAll(".historyBtn").forEach((btn) => {

    btn.onclick = async () => {
        openPage("historyPage");
        await loadFullHistory();
    };

});

// PROFILE TRANSACTION HISTORY
const profileHistoryBtn =
    document.getElementById("profileHistoryBtn");

if (profileHistoryBtn) {

    profileHistoryBtn.onclick = async () => {

        openPage("historyPage");

        await loadFullHistory();

    };

}

const fundWalletBtn = document.getElementById("fundWalletBtn");

if (fundWalletBtn) {
    fundWalletBtn.onclick = async () => {
    openPage("fundRequestPage");

    await loadFundBalance();
    await loadFundRequestStatus();
  };

}

async function loadFundBalance() {

    const balanceElement =
        document.getElementById("fundCurrentBalance");

    if (!balanceElement) return;

    const token = localStorage.getItem("ge_token");

    if (!token) return;

    try {

        const response = await fetch("/api/user/profile", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const result = await response.json();

        if (result.success && result.user) {

            const balance =
                Number(result.user.balance || 0);

            balanceElement.textContent =
                balance.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
        }

    } catch (error) {

        console.error(
            "Failed to load fund balance:",
            error
        );

    }
}

// ===============================
// FUND REQUEST BUTTON
// ===============================

const submitFundRequestBtn =
    document.getElementById("submitFundRequestBtn");

if (submitFundRequestBtn) {

    submitFundRequestBtn.onclick = async () => {

        const amountInput =
            document.getElementById("fundAmount");

        const amount =
            Number(amountInput.value);

        if (!amount || amount < 100) {
            alert("Minimum fund amount is ₦100");
            return;
        }

        const token =
            localStorage.getItem("ge_token");

        if (!token) {
            alert("Please login first.");
            return;
        }

        submitFundRequestBtn.disabled = true;
        submitFundRequestBtn.textContent = "Submitting...";

        try {

            const response = await fetch(
                "/api/fund-request",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },

                    body: JSON.stringify({
                        amount: amount
                    })
                }
            );

            const result =
                await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Failed to submit fund request"
                );
            }

            alert(
                "Fund request submitted successfully.\n\n" +
                "Amount: ₦" +
                amount.toLocaleString("en-NG") +
                "\nStatus: Pending"
            );

            amountInput.value = "";

        } catch (error) {

            console.error(
                "Fund request error:",
                error
            );

            alert(
                error.message ||
                "Failed to submit fund request"
            );

        } finally {

            submitFundRequestBtn.disabled = false;
            submitFundRequestBtn.textContent =
                "Submit Fund Request";
        }
    };
}

// ===============================
// LOAD FUND REQUEST STATUS
// ===============================

async function loadFundRequestStatus() {

    const statusBox =
        document.getElementById("fundRequestStatus");

    if (!statusBox) return;

    const token =
        localStorage.getItem("ge_token");

    if (!token) return;

    statusBox.innerHTML =
        `<p>Loading request...</p>`;

    try {

        const response = await fetch(
            "/api/fund-request",
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const result =
            await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Failed to load fund request"
            );
        }

        if (!result.request) {

            statusBox.innerHTML = `
                <p>No fund request yet.</p>
            `;

            return;
        }

        const request =
            result.request;

        const amount =
            Number(request.amount || 0);

        const status =
            String(request.status || "pending")
                .toLowerCase();

        statusBox.innerHTML = `
            <div class="fundStatusItem">

                <div>
                    <strong>₦${amount.toLocaleString("en-NG")}</strong>
                    <span>Fund Request</span>
                </div>

                <div class="fundStatusBadge ${status}">
                    ${status.toUpperCase()}
                </div>

            </div>
        `;

    } catch (error) {

        console.error(
            "Fund status error:",
            error
        );

        statusBox.innerHTML = `
            <p>Unable to load fund request.</p>
        `;
    }
}

// ================================
// USER APP CUSTOM ALERT SYSTEM
// ================================

const appAlert = document.getElementById("appAlert");
const appAlertTitle = document.getElementById("appAlertTitle");
const appAlertMessage = document.getElementById("appAlertMessage");
const appAlertIcon = document.getElementById("appAlertIcon");
const appAlertClose = document.getElementById("appAlertClose");

let appAlertTimer;

function showAppAlert(message, type = "info") {

    if (!appAlert) {
        console.warn("User app alert element not found.");
        return;
    }

    clearTimeout(appAlertTimer);

    appAlertMessage.textContent = message;

    let title = "Information";
    let icon = "fa-circle-info";

    if (type === "success") {
        title = "Success";
        icon = "fa-circle-check";

        appAlertIcon.style.background = "#dcfce7";
        appAlertIcon.style.color = "#16a34a";
    }

    if (type === "error") {
        title = "Error";
        icon = "fa-circle-xmark";

        appAlertIcon.style.background = "#fee2e2";
        appAlertIcon.style.color = "#dc2626";
    }

    if (type === "info") {
        title = "Information";
        icon = "fa-circle-info";

        appAlertIcon.style.background = "#dbeafe";
        appAlertIcon.style.color = "#2563eb";
    }

    appAlertTitle.textContent = title;

    appAlertIcon.innerHTML = `
        <i class="fa-solid ${icon}"></i>
    `;

    appAlert.classList.add("show");

    appAlertTimer = setTimeout(() => {
        appAlert.classList.remove("show");
    }, 4000);
}


// CLOSE BUTTON

if (appAlertClose) {

    appAlertClose.addEventListener("click", () => {

        clearTimeout(appAlertTimer);

        appAlert.classList.remove("show");

    });

}


// REPLACE NORMAL ALERT

window.alert = function(message) {

    showAppAlert(
        message,
        "info"
    );

};


// TRANSACTION PIN BUTTON
const transactionPinBtn =
    document.getElementById("transactionPinBtn");

if (transactionPinBtn) {

    transactionPinBtn.addEventListener("click", () => {

        if (
            !currentUser ||
            currentUser.transactionPin !== true
        ) {
            openSetPinModal();
        } else {
            alert("You have already created a Transaction PIN.");
        }

    });

}


const profileBackBtn =
    document.getElementById("profileBackBtn");

if (profileBackBtn) {

    profileBackBtn.addEventListener("click", () => {
        goHome();
    });

}

// =========================
// APPEARANCE SETTINGS
// =========================

const profileAppearanceBtn =
    document.getElementById("profileAppearanceBtn");

const appearanceModal =
    document.getElementById("appearanceModal");

const closeAppearanceBtn =
    document.getElementById("closeAppearanceBtn");

const appearanceOptions =
    document.querySelectorAll(".appearanceOption");

function applyAppearance(theme) {

    if (theme === "dark") {
        document.body.classList.add("darkMode");
    } else if (theme === "light") {
        document.body.classList.remove("darkMode");
    } else {
        const prefersDark =
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;

        document.body.classList.toggle(
            "darkMode",
            prefersDark
        );
    }

    appearanceOptions.forEach(option => {

        option.classList.toggle(
            "active",
            option.dataset.theme === theme
        );

    });
}

function loadAppearance() {

    const savedTheme =
        localStorage.getItem("geAppearance") || "system";

    applyAppearance(savedTheme);
}

if (profileAppearanceBtn) {

    profileAppearanceBtn.addEventListener("click", () => {

        if (appearanceModal) {
            appearanceModal.style.display = "flex";
        }

    });

}

if (closeAppearanceBtn) {

    closeAppearanceBtn.addEventListener("click", () => {

        if (appearanceModal) {
            appearanceModal.style.display = "none";
        }

    });

}

appearanceOptions.forEach(option => {

    option.addEventListener("click", () => {

        const theme =
            option.dataset.theme;

        localStorage.setItem(
            "geAppearance",
            theme
        );

        applyAppearance(theme);

    });

});

if (appearanceModal) {

    appearanceModal.addEventListener("click", (event) => {

        if (event.target === appearanceModal) {
            appearanceModal.style.display = "none";
        }

    });

}

loadAppearance();


// ==========================================
// LOGIN WITH PIN TOGGLE
// ==========================================

const loginPinToggle =
    document.getElementById("loginPinToggle");

if (loginPinToggle) {

    const savedLoginPin =
        localStorage.getItem("geLoginWithPin");

    loginPinToggle.checked =
        savedLoginPin === "true";

    loginPinToggle.addEventListener("change", () => {

        if (loginPinToggle.checked) {

            localStorage.setItem(
                "geLoginWithPin",
                "true"
            );

            alert("Login with PIN enabled.");

        } else {

            localStorage.setItem(
                "geLoginWithPin",
                "false"
            );

            alert("Login with PIN disabled.");

        }

    });

}

// ==========================================
// PROFILE LOGOUT
// ==========================================

const profileLogoutBtn =
    document.getElementById("profileLogoutBtn");

const logoutModal =
    document.getElementById("logoutModal");

const cancelLogoutBtn =
    document.getElementById("cancelLogoutBtn");

const confirmLogoutBtn =
    document.getElementById("confirmLogoutBtn");


if (profileLogoutBtn) {

    profileLogoutBtn.addEventListener("click", () => {

        logoutModal.style.display = "flex";

    });

}


if (cancelLogoutBtn) {

    cancelLogoutBtn.addEventListener("click", () => {

        logoutModal.style.display = "none";

    });

}


if (confirmLogoutBtn) {

    confirmLogoutBtn.addEventListener("click", () => {

        localStorage.removeItem("ge_token");
        localStorage.removeItem("ge_user");

        window.location.href = "/auth.html";

    });

}

// ==========================================
// BOTTOM NAV - WALLET
// ==========================================

const walletNav =
    document.getElementById("walletNav");

if (walletNav) {

    walletNav.addEventListener("click", () => {

        openPage("fundRequestPage");

    });

}


// ===============================
// CUSTOMER SUPPORT - WHATSAPP
// ===============================
const profileSupportBtn = document.getElementById("profileSupportBtn");

if (profileSupportBtn) {
    profileSupportBtn.addEventListener("click", () => {
        window.open(
            "https://wa.me/2348080978733",
            "_blank"
        );
    });
}

// ================= ANDROID / PHONE BACK =================

window.addEventListener("popstate", function (event) {

    if (event.state && event.state.page) {

        openPage(event.state.page, false);

    } else {

        goHome();

    }

});
