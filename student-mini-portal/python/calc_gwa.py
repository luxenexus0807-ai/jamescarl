import sys
import json

# Read JSON input from Node.js
data = sys.stdin.read()
grades = json.loads(data)  # Example: {"grades": [90, 85, 88]}

grades_list = grades.get("grades", [])

if not grades_list:
    result = {"error": "No grades provided"}
else:
    gwa = sum(grades_list) / len(grades_list)
    result = {"gwa": round(gwa, 2)}

# Print JSON result
print(json.dumps(result))
