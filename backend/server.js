const express = require("express")
const mysql = require("mysql2")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())

/* RetinaCare AI prediction proxy */
app.post(
    "/predict",
    express.raw({
        type: ["image/*", "application/octet-stream"],
        limit: "10mb"
    }),
    async (req, res) => {

        try {

            const response = await fetch(
                "http://127.0.0.1:8000/predict",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": req.headers["content-type"] || "application/octet-stream"
                    },
                    body: req.body
                }
            )

            const result = await response.json()

            if (!response.ok) {
                return res.status(response.status).json(result)
            }

            /*
             * Convert RetinaCare Python response
             * into the format expected by the existing frontend.
             */
            const prediction = [{
    label: result.predicted_stage,
    score: result.confidence / 100,
    gradcam_image: result.gradcam_image
}]

            res.json(prediction)

        } catch (err) {

            console.error("RetinaCare ML API request failed:", err)

            res.status(502).json({
                error: "Unable to reach RetinaCare AI ML API"
            })
        }
    }
)

const db = mysql.createConnection({
host:"localhost",
user:"root",
password:"root",
database:"retinacare"
})

db.connect(err=>{
if(err){
console.log(err)
}else{
console.log("MySQL connected")
}
})

app.get("/", (req,res)=>{
res.send("RetinaCare Backend Running")
})

/* REGISTER */
app.post("/register",(req,res)=>{

const {name,email,phone,password}=req.body

const sql="INSERT INTO users(name,email,phone,password) VALUES(?,?,?,?)"

db.query(sql,[name,email,phone,password],(err,result)=>{

if(err){
res.json({message:"User already exists"})
}
else{
res.json({message:"User registered successfully"})
}

})

})

/* LOGIN */
app.post("/login",(req,res)=>{

const {email,password}=req.body

const sql="SELECT * FROM users WHERE email=? AND password=?"

db.query(sql,[email,password],(err,result)=>{

if(err){
res.json({status:"error"})
return
}

if(result.length>0){
res.json({status:"success"})
}
else{
res.json({status:"fail"})
}

})

})
// UPDATE PASSWORD (Forgot Password)

app.post("/updatePassword",(req,res)=>{

const {email,newPassword}=req.body;

const sql="UPDATE users SET password=? WHERE email=?";

db.query(sql,[newPassword,email],(err,result)=>{

if(err){
res.json({status:"error"});
}
else if(result.affectedRows>0){
res.json({status:"success"});
}
else{
res.json({status:"user_not_found"});
}

});

});
/* SAVE REPORT */
app.post("/saveReport",(req,res)=>{

const {email,stage,confidence}=req.body

const sql="INSERT INTO reports(email,stage,confidence,scan_date) VALUES(?,?,?,NOW())"

db.query(sql,[email,stage,confidence],(err,result)=>{

if(err){
console.log(err)
res.json({status:"error"})
}
else{
res.json({status:"saved"})
}

})

})

/* HISTORY */
app.get("/history/:email",(req,res)=>{

const email=req.params.email

const sql="SELECT * FROM reports WHERE email=? ORDER BY scan_date DESC"

db.query(sql,[email],(err,result)=>{

if(err){
res.json([])
}
else{
res.json(result)
}

})

})

app.listen(5000,()=>{
console.log("Server running on http://localhost:5000")
})