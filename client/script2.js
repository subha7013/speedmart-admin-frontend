/* ================= CONFIG ================= */

const BASE_URL = "http://localhost:5000";


/* ================= LOGIN ================= */

async function login(){

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if(!email || !password){
        showToast("Enter Email & Password");
        return;
    }

    try{

        const res = await fetch(`${BASE_URL}/api/admin/login`,{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ email,password })
        });

        const data = await res.json();

        if(!data.token){
            showToast("Invalid Credentials");
            return;
        }

        localStorage.setItem("adminToken", data.token);

        afterLogin();

    }catch(err){
        showToast("Server Error");
    }
}


/* ================= AFTER LOGIN ================= */

function afterLogin(){

    document.getElementById("loginSection").style.display="none";
    document.getElementById("dashboard").style.display="block";

    document.getElementById("navOptions").innerHTML = `
        <li><button class="btn" onclick="logout()">Logout</button></li>
    `;

    loadOrders();
}


/* ================= LOGOUT ================= */

function logout(){
    localStorage.removeItem("adminToken");
    location.reload();
}


/* ================= LOAD ORDERS ================= */

async function loadOrders(){

    const token = localStorage.getItem("adminToken");
    if(!token) return;

    const date = document.getElementById("dateFilter")?.value;

    let url = `${BASE_URL}/api/admin/orders`;
    if(date) url += `?date=${date}`;

    try{

        const res = await fetch(url,{
            headers:{
                Authorization:`Bearer ${token}`
            }
        });

        const orders = await res.json();

        renderOrders(orders);

    }catch(err){
        showToast("Error loading orders");
    }
}


/* ================= RENDER ORDERS ================= */
/* IMPORTANT: Matches YOUR Order Schema */

function renderOrders(orders){

    const container = document.getElementById("ordersContainer");

    if(!orders || !orders.length){
        container.innerHTML = "<p>No Orders Found</p>";
        return;
    }

    container.innerHTML = orders.map(order => `

        <div class="order-card">

            <h3>Order ID: ${order._id}</h3>

            <p>
                Status:
                <b style="color:${getStatusColor(order.status)}">
                    ${order.status}
                </b>
            </p>

            <p>Total Bill: ₹${order.total}</p>

            <p>
                Date:
                ${new Date(order.createdAt).toLocaleString()}
            </p>

            <h4>Products</h4>

            ${order.items.map(item => `
                <p>
                    ${item.name}
                    x ${item.qty}
                    = ₹${item.price * item.qty}
                </p>
            `).join("")}

            ${order.status !== "DELIVERED" ? `
                <button
                    class="deliver-btn"
                    onclick="confirmDeliver('${order._id}')">
                    Mark Delivered
                </button>
            ` : `<p style="color:green;font-weight:bold">Delivered</p>`}

        </div>

    `).join("");
}


/* ================= STATUS COLOR ================= */

function getStatusColor(status){

    if(status === "PLACED") return "orange";
    if(status === "SHIPPED") return "blue";
    if(status === "DELIVERED") return "green";

    return "black";
}


/* ================= MARK DELIVERED ================= */

async function confirmDeliver(orderId){

    if(!confirm("Confirm Mark As Delivered?")) return;

    try{

        await fetch(
            `${BASE_URL}/api/admin/orders/${orderId}/deliver`,
            {
                method:"PUT",
                headers:{
                    Authorization:`Bearer ${localStorage.getItem("adminToken")}`
                }
            }
        );

        showToast("🚚 Order Delivered");
        loadOrders();

    }catch(err){
        showToast("Update Failed");
    }
}


/* ================= TOAST ================= */

function showToast(msg){

    const toast = document.getElementById("toast");

    if(!toast) return;

    toast.innerText = msg;
    toast.style.display = "block";

    setTimeout(()=>{
        toast.style.display = "none";
    },3000);
}


/* ================= AUTO LOGIN CHECK ================= */

window.onload = ()=>{

    const token = localStorage.getItem("adminToken");

    if(token){
        afterLogin();
    }
};
