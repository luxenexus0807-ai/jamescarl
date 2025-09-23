from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)
CORS(app)

# --- MongoDB Connection ---
client = MongoClient("mongodb+srv://luxenexus0807_db_user:<db_password>@student-mini-portal.5jht2iv.mongodb.net/")
db = client["student_portal"]
students = db["students"]

# --- Helpers ---
def serialize_student(student):
    student["_id"] = str(student["_id"])
    return student

def calculate_gwa(subjects):
    """Compute GWA based on subject grades (numeric only)."""
    grades = []
    for g in subjects.values():
        try:
            if g is not None:
                grades.append(float(g))  # numeric only
        except (ValueError, TypeError):
            continue  # skip INC or invalid
    if grades:
        return round(sum(grades) / len(grades), 2)
    return None

# --- CRUD Routes ---
@app.route("/students", methods=["GET"])
def get_students():
    return jsonify([serialize_student(s) for s in students.find()])

@app.route("/students/<id>", methods=["GET"])
def get_student(id):
    try:
        student = students.find_one({"_id": ObjectId(id)})
        if student:
            return jsonify(serialize_student(student))
        return jsonify({"error": "Student not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/students", methods=["POST"])
def add_student():
    data = request.json

    required = ["studentId", "username", "password", "name", "course", "year", "address"]
    for field in required:
        if field not in data or not data[field]:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # prevent duplicate studentId or username
    existing = students.find_one({
        "$or": [{"studentId": data["studentId"]}, {"username": data["username"]}]
    })
    if existing:
        return jsonify({"error": "Student ID or Username already exists"}), 400

    if "subjects" not in data:
        data["subjects"] = {"OLSA01": None, "OLIPT2": None}

    data["gwa"] = calculate_gwa(data["subjects"])

    result = students.insert_one(data)
    return jsonify({"_id": str(result.inserted_id)}), 201

@app.route("/students/<id>", methods=["PUT"])
def update_student(id):
    data = request.json
    if "subjects" in data:
        data["gwa"] = calculate_gwa(data["subjects"])
    students.update_one({"_id": ObjectId(id)}, {"$set": data})
    return jsonify({"msg": "Student updated"})

@app.route("/students/<id>", methods=["DELETE"])
def delete_student(id):
    students.delete_one({"_id": ObjectId(id)})
    return jsonify({"msg": "Student deleted"})

# --- Login Route ---
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    role = data.get("role")
    username_or_id = data.get("username")
    password = data.get("password")

    # Professor login (fixed credentials)
    if role == "professor":
        if username_or_id == "prof" and password == "1234":
            return jsonify({"role": "professor", "msg": "Professor login successful"})
        return jsonify({"error": "Invalid professor credentials"}), 401

    # Student login
    if role == "student":
        student = students.find_one({
            "$or": [{"username": username_or_id}, {"studentId": username_or_id}],
            "password": password
        })
        if student:
            return jsonify({"role": "student", "student": serialize_student(student)})
        return jsonify({"error": "Invalid student credentials"}), 401

    return jsonify({"error": "Invalid role"}), 400

# --- GWA Calculator ---
@app.route("/compute-gwa", methods=["POST"])
def compute_gwa():
    data = request.json
    subjects = data.get("subjects", {})
    gwa = calculate_gwa(subjects)
    if gwa is None:
        return jsonify({"error": "No grades provided"}), 400
    return jsonify({"gwa": gwa})

if __name__ == "__main__":
    app.run(debug=True)
@app.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.json
    username_or_id = data.get("username")
    if not username_or_id:
        return jsonify({"error": "Username is required"}), 400

    student = students.find_one({
        "$or": [{"username": username_or_id}, {"studentId": username_or_id}]
    })
    if not student:
        return jsonify({"error": "User not found"}), 404

    # For simplicity, we just return the password (in real apps, send email)
    # ⚠️ In production, use email with token instead
    return jsonify({
        "msg": f"Your password is: {student['password']}"
    })