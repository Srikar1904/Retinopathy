let stream=null

const video=document.getElementById("camera-video")
const canvas=document.getElementById("capture-canvas")
const photoPreview=document.getElementById("photo-preview")

const videoWrapper=document.getElementById("video-wrapper")
const photoWrapper=document.getElementById("photo-wrapper")

const captureBtn=document.getElementById("capture-btn")
const retakeBtn=document.getElementById("retake-btn")
const analyseBtn=document.getElementById("analyse-btn")

const demoRes=document.getElementById("demo-res")
const cameraStatus=document.getElementById("camera-status")
const processingUI=document.getElementById("processing-ui")

/* SWITCH MODE */

function switchMode(mode){

const tabs=document.querySelectorAll(".demo-tab")
const contents=document.querySelectorAll(".demo-content")

tabs.forEach(t=>t.classList.remove("active"))
contents.forEach(c=>c.classList.remove("active"))

if(mode==="upload"){
tabs[0].classList.add("active")
document.getElementById("upload-mode").classList.add("active")
stopCamera()
}else{
tabs[1].classList.add("active")
document.getElementById("camera-mode").classList.add("active")
startCamera()
}

demoRes.style.display="none"

}

/* CAMERA */

async function startCamera(){

try{

stream=await navigator.mediaDevices.getUserMedia({
video:true,
audio:false
})

video.srcObject=stream

cameraStatus.textContent="Position your eye within frame"

}catch(err){

cameraStatus.textContent="Camera access denied"

}

}

function stopCamera(){

if(stream){
stream.getTracks().forEach(track=>track.stop())
stream=null
}

}

function capturePhoto(){

const ctx=canvas.getContext("2d")

canvas.width=video.videoWidth
canvas.height=video.videoHeight

ctx.drawImage(video,0,0)

const data=canvas.toDataURL("image/png")

photoPreview.src=data

videoWrapper.style.display="none"
photoWrapper.style.display="block"

captureBtn.style.display="none"
retakeBtn.style.display="inline-block"
analyseBtn.style.display="inline-block"

}

function retakePhoto(){

videoWrapper.style.display="flex"
photoWrapper.style.display="none"

captureBtn.style.display="flex"
retakeBtn.style.display="none"
analyseBtn.style.display="none"

}

/* UPLOAD PREVIEW */

function previewUpload(input){

const file=input.files[0]

if(!file) return

const url=URL.createObjectURL(file)

document.getElementById("upload-preview-img").src=url

document.getElementById("upload-preview-wrap").style.display="block"

document.getElementById("upload-analyse-btn").style.display="inline-block"

}

/* AI ANALYSIS */

async function runDemo(btn){
    let currentUser = null;

    try {
        const savedUser = sessionStorage.getItem("rc_user");

        if (savedUser) {
            currentUser = JSON.parse(savedUser);
        }
    } catch (error) {
        currentUser = null;
    }

    if (!currentUser || !currentUser.email) {
        const loginPopup = document.getElementById("demo-login-popup");

        if (loginPopup) {
            loginPopup.classList.add("show");
        }

        return;
    }
    const savedUser = sessionStorage.getItem("rc_user");

    if (!savedUser) {
        const loginPopup =
            document.getElementById("demo-login-popup");

        if (loginPopup) {
            loginPopup.classList.add("show");
        }

        return;
    }

    const fileInput = document.getElementById("image-upload");
    const file = fileInput ? fileInput.files[0] : null;

    if(!file && btn.id !== "analyse-btn"){
        alert("Upload image");
        return;
    }

    /*
    =====================================================
    START REALISTIC AI SCANNING EXPERIENCE
    =====================================================
    */

    const demoBox = document.querySelector(".demo-box");

    // Add scanning effect
    if(demoBox){
    demoBox.classList.add("ai-processing");
}
// Start retinal image scanner
const scanOverlay = document.getElementById("retina-scan-overlay");

if(scanOverlay){
    scanOverlay.style.display = "block";
}

const scanStatusText =
    document.getElementById("scan-status-text");

if(scanStatusText){
    scanStatusText.textContent =
        "Scanning retinal structures...";
}

    // Show processing UI
    if(processingUI){
        processingUI.style.display = "flex";

        const processingText =
            processingUI.querySelector("p");

        if(processingText){
            processingText.textContent =
                "AI is analyzing retinal patterns...";
        }
    }

    try{

        const image =
            file ||
            await new Promise(resolve =>
                canvas.toBlob(resolve, "image/png")
            );

        if(!image){
            throw new Error("No image data available");
        }

        /*
        =====================================================
        RUN REAL AI PREDICTION
        =====================================================
        */

        const predictionPromise = fetch(
            "http://localhost:5000/predict",
            {
                method:"POST",
                headers:{
                    "Content-Type":
                        image.type ||
                        "application/octet-stream"
                },
                body:image
            }
        );

        /*
        =====================================================
        KEEP SCANNING ANIMATION FOR 5.5 SECONDS
        =====================================================
        */

const minimumScanTime = new Promise(resolve => {

    const messages = [
        "Scanning retinal structures...",
        "Analyzing vascular patterns...",
        "Extracting retinal features...",
        "Running ResNet-50 classification...",
        "Generating explainable AI result..."
    ];

    const scanStatusText =
        document.getElementById("scan-status-text");

    const progressBar =
        document.getElementById("scan-progress-bar");

    const progressText =
        document.getElementById("scan-progress-text");

    let progress = 0;
    let messageIndex = 0;

    const scanInterval = setInterval(() => {

        progress += 2;

        if(progress > 100){
            progress = 100;
        }

        if(progressBar){
            progressBar.style.width =
                progress + "%";
        }

        if(progressText){
            progressText.textContent =
                progress + "%";
        }

        const newMessageIndex =
            Math.min(
                Math.floor(progress / 20),
                messages.length - 1
            );

        if(newMessageIndex !== messageIndex){

            messageIndex = newMessageIndex;

            if(scanStatusText){
                scanStatusText.textContent =
                    messages[messageIndex];
            }
        }

    }, 110);

    setTimeout(() => {

        clearInterval(scanInterval);

        if(progressBar){
            progressBar.style.width = "100%";
        }

        if(progressText){
            progressText.textContent = "100%";
        }

        if(scanStatusText){
            scanStatusText.textContent =
                "✓ Analysis complete";
        }

        resolve();

    }, 5500);

});
   
        // Wait for BOTH:
        // 1. Real AI prediction
        // 2. 5.5 second scanning animation

        const [response] =
            await Promise.all([
                predictionPromise,
                minimumScanTime
            ]);

        const result = await response.json();

        if(
            !response.ok ||
            !Array.isArray(result) ||
            !result[0]
        ){
            throw new Error(
                result.error ||
                result.message ||
                "The AI model returned no prediction"
            );
        }

        /*
        =====================================================
        AI RESULT
        =====================================================
        */

        const label = result[0].label;

        const gradcamImage =
            result[0].gradcam_image;

        const confidence =
            (result[0].score * 100).toFixed(2);

        let risk = "Low";

        if(
            label.toLowerCase().includes("mild")
        ){
            risk = "Medium";
        }

        if(
            label.toLowerCase().includes("moderate") ||
            label.toLowerCase().includes("severe")
        ){
            risk = "High";
        }

        document.getElementById(
            "risk-level"
        ).innerText = risk;

        document.getElementById(
            "res-stage"
        ).textContent = label;

        document.getElementById(
            "res-conf"
        ).textContent =
            "Confidence: " + confidence + "%";

        await saveReport(
            label,
            confidence
        );

        showDietAdvice(label);

        showDoctorAdvice(label);

        /*
        =====================================================
        SHOW GRAD-CAM
        =====================================================
        */

        if(gradcamImage){

            const gradcamResult =
                document.getElementById(
                    "gradcam-result"
                );

            const gradcamImageElement =
                document.getElementById(
                    "gradcam-image"
                );

            gradcamImageElement.src =
                gradcamImage;

            gradcamResult.style.display =
                "block";
        }

        /*
        =====================================================
        SHOW RESULT WITH ANIMATION
        =====================================================
        */

        demoRes.style.display = "flex";

        demoRes.classList.remove(
            "ai-result-reveal"
        );

        // Force browser to restart animation
        void demoRes.offsetWidth;

        demoRes.classList.add(
            "ai-result-reveal"
        );

    }catch(err){

        console.error(
            "RetinaCare AI error:",
            err
        );

        alert(
            "AI prediction failed. Please try again."
        );

    }

    /*
    =====================================================
    STOP SCANNING
    =====================================================
    */

    if(processingUI){
        processingUI.style.display = "none";
    }

    // Stop retinal scanner
if(scanOverlay){
    scanOverlay.style.display = "none";
}

if(scanStatusText){
    scanStatusText.textContent =
        "Scan complete";
}

}
async function saveReport(stage,confidence){

const user=JSON.parse(sessionStorage.getItem("rc_user"))

if(!user) return

await fetch("http://localhost:5000/saveReport",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
email:user.email,
stage:stage,
confidence:confidence
})

})

}


/* DOWNLOAD REPORT */

window.downloadReport = function(){

const stageElement = document.getElementById("res-stage")
const confidenceElement = document.getElementById("res-conf")
const riskElement = document.getElementById("risk-level")
const inferenceElement = document.getElementById("res-inf")

const stage = stageElement ? stageElement.innerText : "Not available"
const confidence = confidenceElement ? confidenceElement.innerText : "Not available"
const risk = riskElement ? riskElement.innerText : "Not available"
const inference = inferenceElement ? inferenceElement.innerText : "Not available"

const user = JSON.parse(sessionStorage.getItem("rc_user") || "null")

const email = user && user.email ? user.email : "Guest User"

const date = new Date().toLocaleString()

const report = `
RETINACARE AI
DIABETIC RETINOPATHY SCREENING REPORT
========================================

Patient/User:
${email}

Date:
${date}

----------------------------------------
AI ANALYSIS
----------------------------------------

Predicted Stage:
${stage}

Model Confidence:
${confidence}

Risk Level:
${risk}

Inference Time:
${inference}

----------------------------------------
MODEL INFORMATION
----------------------------------------

Model:
RetinaCare AI - ResNet-50

Dataset:
APTOS 2019 Blindness Detection

Classification Classes:
No DR
Mild
Moderate
Severe
Proliferative

----------------------------------------
DISCLAIMER
----------------------------------------

This report is generated by an AI-based screening
prototype and is intended for research and
educational purposes. It should not be considered
a medical diagnosis or a replacement for evaluation
by a qualified eye-care professional.

========================================
RetinaCare AI
`

const blob = new Blob(
    [report],
    { type: "text/plain;charset=utf-8" }
)

const url = URL.createObjectURL(blob)

const link = document.createElement("a")

link.href = url
link.download = "RetinaCare_AI_Report.txt"

document.body.appendChild(link)

link.click()

document.body.removeChild(link)

URL.revokeObjectURL(url)

}


/* DIET */
/* DIET */

function showDietAdvice(stage){

let advice=""

if(stage.toLowerCase().includes("healthy")){
advice="Eat leafy greens, carrots, omega-3 foods."
}
else if(stage.toLowerCase().includes("mild")){
advice="Reduce sugar. Eat whole grains and fruits."
}
else if(stage.toLowerCase().includes("moderate")){
advice="Strict sugar control. Eat fiber vegetables."
}
else{
advice="Severe stage. Follow strict diabetic diet."
}

document.getElementById("diet-advice").innerHTML=advice

}

/* DOCTOR */

function showDoctorAdvice(stage){

let advice=""

if(stage.toLowerCase().includes("healthy")){
advice="Your retina looks healthy."
}
else if(stage.toLowerCase().includes("mild")){
advice="Consult doctor within 6 months."
}
else if(stage.toLowerCase().includes("moderate")){
advice="Visit ophthalmologist soon."
}
else{
advice="Immediate doctor consultation required."
}

document.getElementById("doctor-advice").innerHTML=advice

}
/* =====================================================
   RETINAL IMAGE PREVIEW
===================================================== */

window.previewUpload = function(input) {

    const file = input.files && input.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Please select a valid retinal image.");
        input.value = "";
        return;
    }

    const previewWrap =
        document.getElementById("upload-preview-wrap");

    const previewImage =
        document.getElementById("upload-preview-img");

    const analyseButton =
        document.getElementById("upload-analyse-btn");

    const scanOverlay =
        document.getElementById("retina-scan-overlay");

    const reader = new FileReader();

    reader.onload = function(event) {

        if (previewImage) {
            previewImage.src = event.target.result;
        }

        if (previewWrap) {
            previewWrap.style.display = "block";
        }

        if (scanOverlay) {
            scanOverlay.style.display = "none";
        }

        if (analyseButton) {
            analyseButton.style.display = "inline-block";
        }
    };

    reader.readAsDataURL(file);
};
/* =====================================================
   RETINACARE AI — GLOBAL DARK MODE
===================================================== */

(function(){

    const themeToggle =
        document.getElementById("theme-toggle");

    /*
    Apply saved theme immediately
    */

    const savedTheme =
        localStorage.getItem("retinacare-theme");

    if(savedTheme === "dark"){
        document.body.classList.add("dark-theme");
    }

    /*
    Update button icon
    */

    function updateThemeIcon(){

        if(!themeToggle){
            return;
        }

        const isDark =
            document.body.classList.contains("dark-theme");

        themeToggle.textContent =
            isDark ? "☀️" : "🌙";

        themeToggle.setAttribute(
            "aria-label",
            isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
        );

        themeToggle.setAttribute(
            "title",
            isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
        );
    }

    updateThemeIcon();

    /*
    Toggle theme
    */

    if(themeToggle){

        themeToggle.addEventListener(
            "click",
            function(){

                const isDark =
                    document.body.classList.toggle(
                        "dark-theme"
                    );

                localStorage.setItem(
                    "retinacare-theme",
                    isDark ? "dark" : "light"
                );

                updateThemeIcon();

            }
        );

    }

})();
/* =========================================================
   LOGIN / REGISTER WELCOME POPUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const popup = document.getElementById("auth-popup");
    const closeButton = document.getElementById("auth-popup-close");
    const loginButton = document.getElementById("auth-popup-login");
    const registerButton = document.getElementById("auth-popup-register");

    // Only run on pages where the popup exists
    if (!popup) {
        return;
    }

    // Show popup after 5 seconds
    const popupTimer = setTimeout(function () {
        popup.classList.add("show");
    }, 5000);

    // Close popup
    if (closeButton) {
        closeButton.addEventListener("click", function () {
            popup.classList.remove("show");
        });
    }

    // Login redirect
    if (loginButton) {
        loginButton.addEventListener("click", function () {
            window.location.href = "login.html";
        });
    }
   //Register redirect
    if (registerButton) {
    registerButton.addEventListener("click", function () {
        window.location.href = "login.html?mode=register";
    });
}

    // Close when clicking outside the popup
    popup.addEventListener("click", function (event) {

        if (event.target === popup) {
            popup.classList.remove("show");
        }

    });

});
document.addEventListener("DOMContentLoaded", function () {
    const demoPopup = document.getElementById("demo-login-popup");
    if (!demoPopup) return;

    const closeButton = document.getElementById("demo-login-close");

    if (closeButton) {
        closeButton.addEventListener("click", function () {
            demoPopup.classList.remove("show");
        });
    }

    const loginButton = document.getElementById("demo-login-button");

    if (loginButton) {
        loginButton.addEventListener("click", function () {
            window.location.href = "login.html";
        });
    }

    const registerButton = document.getElementById("demo-register-button");

    if (registerButton) {
        registerButton.addEventListener("click", function () {
            window.location.href = "login.html?mode=register";
        });
    }
});
/* =====================================================
   RETINACARE AI — GLOBAL TOAST SYSTEM
===================================================== */

window.showToast = function(message, type = "info", title = "") {

    let container = document.querySelector(".rc-toast-container");

    if (!container) {
        container = document.createElement("div");
        container.className = "rc-toast-container";
        document.body.appendChild(container);
    }

    const settings = {
        success: {
            icon: "✓",
            title: title || "Success"
        },
        error: {
            icon: "!",
            title: title || "Something went wrong"
        },
        warning: {
            icon: "⚠",
            title: title || "Please check"
        },
        info: {
            icon: "i",
            title: title || "RetinaCare AI"
        }
    };

    const current = settings[type] || settings.info;

    const toast = document.createElement("div");

    toast.className = `rc-toast rc-toast-${type}`;

    toast.innerHTML = `
        <div class="rc-toast-icon">
            ${current.icon}
        </div>

        <div class="rc-toast-content">
            <div class="rc-toast-title">
                ${current.title}
            </div>

            <p class="rc-toast-message">
                ${message}
            </p>
        </div>

        <button class="rc-toast-close" type="button">
            ×
        </button>

        <div class="rc-toast-progress"></div>
    `;

    container.appendChild(toast);

    const closeToast = () => {

        if (toast.classList.contains("rc-toast-out")) {
            return;
        }

        toast.classList.add("rc-toast-out");

        setTimeout(() => {
            toast.remove();

            if (container.children.length === 0) {
                container.remove();
            }

        }, 350);
    };

    const closeButton =
        toast.querySelector(".rc-toast-close");

    closeButton.addEventListener(
        "click",
        closeToast
    );

    let timer = setTimeout(
        closeToast,
        4000
    );

    toast.addEventListener("mouseenter", () => {
        clearTimeout(timer);

        const progress =
            toast.querySelector(".rc-toast-progress");

        if (progress) {
            progress.style.animationPlayState = "paused";
        }
    });

    toast.addEventListener("mouseleave", () => {

        const progress =
            toast.querySelector(".rc-toast-progress");

        if (progress) {
            progress.style.animationPlayState = "running";
        }

        timer = setTimeout(
            closeToast,
            1500
        );
    });
};
/* =====================================================
   REPLACE DEFAULT BROWSER ALERT
===================================================== */

window.alert = function(message) {

    let type = "info";
    let title = "RetinaCare AI";

    const text = String(message).toLowerCase();

    if (
        text.includes("invalid") ||
        text.includes("failed") ||
        text.includes("error") ||
        text.includes("wrong")
    ) {
        type = "error";
        title = "Something went wrong";
    }
    else if (
        text.includes("please") ||
        text.includes("upload") ||
        text.includes("required") ||
        text.includes("warning")
    ) {
        type = "warning";
        title = "Please check";
    }
    else if (
        text.includes("success") ||
        text.includes("successful") ||
        text.includes("created") ||
        text.includes("updated")
    ) {
        type = "success";
        title = "Success";
    }

    showToast(message, type, title);
};