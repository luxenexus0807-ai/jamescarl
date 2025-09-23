import { spawn } from "child_process";
import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// Call Python script to compute GWA
app.post("/api/calc-gwa", (req, res) => {
  const grades = req.body.grades;

  if (!grades || !Array.isArray(grades)) {
    return res.status(400).json({ error: "Grades must be an array" });
  }

  const py = spawn("python", ["calc_gwa.py"]); // make sure path is correct

  let result = "";
  py.stdout.on("data", (data) => {
    result += data.toString();
  });

  py.stderr.on("data", (data) => {
    console.error(`Python error: ${data}`);
  });

  py.on("close", () => {
    try {
      const json = JSON.parse(result);
      res.json(json);
    } catch (err) {
      res.status(500).json({ error: "Failed to parse Python response" });
    }
  });

  py.stdin.write(JSON.stringify({ grades }));
  py.stdin.end();
});

app.listen(4000, () => {
  console.log("Node.js server running on http://localhost:4000");
});
