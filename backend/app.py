from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

# MySQL connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",   # put your MySQL password here
    database="retinacare"
)

cursor = db.cursor()

@app.route("/")
def home():
    return "RetinaCare AI Backend Running"
# REGISTER USER
@app.route("/register", methods=["POST"])
def register():

    data = request.json

    name = data["name"]
    email = data["email"]
    phone = data["phone"]
    password = data["password"]

    try:

        sql = "INSERT INTO users (name,email,phone,password) VALUES (%s,%s,%s,%s)"
        val = (name,email,phone,password)

        cursor.execute(sql,val)
        db.commit()

        return jsonify({"message":"User registered successfully"})

    except:

        return jsonify({"message":"User already exists"})


# LOGIN USER
@app.route("/login", methods=["POST"])
def login():

    data = request.json

    email = data["email"]
    password = data["password"]

    sql = "SELECT * FROM users WHERE email=%s AND password=%s"

    cursor.execute(sql,(email,password))

    user = cursor.fetchone()

    if user:

        return jsonify({"status":"success"})

    else:

        return jsonify({"status":"fail"})


if __name__ == "__main__":
    app.run(debug=True)