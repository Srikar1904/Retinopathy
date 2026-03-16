/* ── AUTH.JS — Authentication + Profile Navbar (Node.js Backend) ── */

(function () {
"use strict";

/* ─────────────────────────────
USER STORAGE HELPERS
───────────────────────────── */

function getUser(){
try{
const raw=sessionStorage.getItem("rc_user");
return raw?JSON.parse(raw):null;
}catch(e){return null;}
}

function setUser(user){
sessionStorage.setItem("rc_user",JSON.stringify(user));
}

function clearUser(){
sessionStorage.removeItem("rc_user");
}

/* ─────────────────────────────
LOGIN / REGISTER FORM SWITCH
───────────────────────────── */

window.toggleAuthMode=function(mode){

const loginForm=document.getElementById("login-form-container");
const registerForm=document.getElementById("register-form-container");

if(!loginForm||!registerForm) return;

if(mode==="register"){
loginForm.style.display="none";
registerForm.style.display="block";
}
else{
loginForm.style.display="block";
registerForm.style.display="none";
}

};

/* ─────────────────────────────
REGISTER USER
───────────────────────────── */

window.registerUser=async function(event){

event.preventDefault();

const name=document.getElementById("reg-name").value;
const email=document.getElementById("reg-email").value;
const phone=document.getElementById("reg-phone").value;
const password=document.getElementById("reg-password").value;

try{

const res=await fetch("http://localhost:5000/register",{

method:"POST",
headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
name,
email,
phone,
password
})

});

const data=await res.json();

alert(data.message);

toggleAuthMode("login");

}catch(err){

alert("Server connection error");

}

};

/* ─────────────────────────────
LOGIN USER
───────────────────────────── */

window.loginUser=async function(event){

event.preventDefault();

const email=document.getElementById("login-email").value;
const password=document.getElementById("login-password").value;

try{

const res=await fetch("http://localhost:5000/login",{

method:"POST",
headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
email,
password
})

});

const data=await res.json();

if(data.status==="success"){

setUser({email});

window.location.href="index.html";

}else{

alert("Invalid login");

}

}catch(err){

alert("Server connection error");

}

};

/* ─────────────────────────────
PROFILE NAVBAR SYSTEM
───────────────────────────── */

function getInitials(name){

return name
.trim()
.split(/\s+/)
.map(w=>w[0].toUpperCase())
.slice(0,2)
.join("");

}

function injectProfileNav(user){

const loginLinks=document.querySelectorAll('nav a[href="login.html"]');
loginLinks.forEach(link=>link.remove());

const nav=document.querySelector("nav");
if(!nav) return;

const initials=getInitials(user.name||user.email);
const displayName=user.name||user.email.split("@")[0];

const profileHTML=`

<div class="nav-profile" id="nav-profile-wrap">

<button class="nav-avatar-btn" onclick="toggleProfileDropdown()">
<span class="nav-avatar-initials">${initials}</span>
</button>

<div class="nav-profile-dropdown" id="nav-profile-dropdown">

<div class="nav-profile-info">

<div class="nav-profile-avatar-lg">${initials}</div>

<div>
<div class="nav-profile-name">${displayName}</div>
<div class="nav-profile-email">${user.email}</div>
</div>

</div>

<hr>

<a href="demo.html" class="nav-profile-item">
Live Demo
</a>

<a href="patient-history.html" class="nav-profile-item">
Patient History
</a>

<button class="nav-profile-item nav-profile-logout" onclick="logoutUser()">
Sign Out
</button>

</div>

</div>
`;

const navPill=nav.querySelector(".nav-pill");

if(navPill){
navPill.insertAdjacentHTML("beforebegin",profileHTML);
}else{
nav.insertAdjacentHTML("beforeend",profileHTML);
}

document.addEventListener("click",function(e){

const wrap=document.getElementById("nav-profile-wrap");

if(wrap && !wrap.contains(e.target)){
const dd=document.getElementById("nav-profile-dropdown");
if(dd) dd.classList.remove("open");
}

});

}

/* ─────────────────────────────
PROFILE ACTIONS
───────────────────────────── */

window.toggleProfileDropdown=function(){

const dd=document.getElementById("nav-profile-dropdown");
if(dd) dd.classList.toggle("open");

};

window.logoutUser=function(){

clearUser();
window.location.href="login.html";

};

/* ─────────────────────────────
INIT PROFILE NAV
───────────────────────────── */

document.addEventListener("DOMContentLoaded",function(){

const user=getUser();

if(user){
injectProfileNav(user);
}

});

})();
