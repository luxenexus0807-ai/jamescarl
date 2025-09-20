from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)
CORS(app)

# --- MongoDB Connection ---
client = MongoClient("mongodb://localhost:27017/")
db = client["student_portal"]
students = db["students"]

# --- Helpers ---
def serialize_student(student):
    student["_id"] = str(student["_id"])
    return student

# --- Routes ---

# Get all students
@app.route("/students", methods=["GET"])
def get_students():
    return jsonify([serialize_student(s) for s in students.find()])

# Get single student (needed for Edit!)
@app.route("/students/<id>", methods=["GET"])
def get_student(id):
    try:
        student = students.find_one({"_id": ObjectId(id)})
        if student:
            return jsonify(serialize_student(student))
        return jsonify({"error": "Student not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Add student
@app.route("/students", methods=["POST"])
def add_student():
    data = request.json
    result = students.insert_one(data)
    return jsonify({"_id": str(result.inserted_id)}), 201

# Update student
@app.route("/students/<id>", methods=["PUT"])
def update_student(id):
    data = request.json
    students.update_one({"_id": ObjectId(id)}, {"$set": data})
    return jsonify({"msg": "Student updated"})

# Delete student
@app.route("/students/<id>", methods=["DELETE"])
def delete_student(id):
    students.delete_one({"_id": ObjectId(id)})
    return jsonify({"msg": "Student deleted"})

# GWA Calculator (Python logic)
@app.route("/compute-gwa", methods=["POST"])
def compute_gwa():
    data = request.json
    grades = data.get("grades", [])
    if not grades:
        return jsonify({"error": "No grades provided"}), 400
    gwa = sum(grades) / len(grades)
    return jsonify({"gwa": round(gwa, 2)})

if __name__ == "__main__":
    app.run(debug=True)
