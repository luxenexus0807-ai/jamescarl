import sys
import json

# Read grades from Node.js (passed as JSON)
data = sys.stdin.read()
grades = json.loads(data)  # Example: {"grades": [90, 85, 88]}

grades_list = grades.get("grades", [])

if not grades_list:
    result = {"error": "No grades provided"}
else:
    gwa = sum(grades_list) / len(grades_list)
    result = {"gwa": round(gwa, 2)}

# Return result as JSON
print(json.dumps(result))
