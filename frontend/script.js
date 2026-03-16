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

const fileInput=document.getElementById("image-upload")

const file=fileInput?fileInput.files[0]:null

if(!file && btn.id!=="analyse-btn"){
alert("Upload image")
return
}

if(processingUI){
processingUI.style.display="flex"
}

try{

const arrayBuffer=await file.arrayBuffer()

const response=await fetch(
"https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
{
method:"POST",
headers:{
"Authorization":"Bearer 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"
},
body:arrayBuffer
}
)

const result=await response.json()

const label=result[0].label
const confidence=(result[0].score*100).toFixed(2)

let risk="Low"

if(label.toLowerCase().includes("mild")){
risk="Medium"
}

if(label.toLowerCase().includes("moderate") || label.toLowerCase().includes("severe")){
risk="High"
}

document.getElementById("risk-level").innerText=risk
document.getElementById("res-stage").textContent=label
document.getElementById("res-conf").textContent="Confidence: "+confidence+"%"

await saveReport(label,confidence)

showDietAdvice(label)
showDoctorAdvice(label)

demoRes.style.display="flex"

}catch(err){

alert("AI prediction failed")

}

if(processingUI){
processingUI.style.display="none"
}

}

/* SAVE REPORT */

async function saveReport(stage,confidence){

const user=JSON.parse(sessionStorage.getItem("rc_user"))

if(!user) return

await fetch("/.netlify/functions/saveReport",{

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