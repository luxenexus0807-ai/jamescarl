const API_URL = "http://127.0.0.1:5000";

// UI refs
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const courseInput = document.getElementById("course");
const yearInput = document.getElementById("year");
const addressInput = document.getElementById("address");
const gwaInput = document.getElementById("gwa");
const studentForm = document.getElementById("studentForm");
const tableBody = document.getElementById("studentTableBody");

// ---------- Helpers ----------
async function api(path, opts = {}) {
  const res = await fetch(API_URL + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json().catch(() => ({}));
}

// ---------- Load students ----------
async function loadStudents() {
  const students = await api("/students");
  tableBody.innerHTML = "";
  students.forEach((s) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s._id}</td>
      <td>${s.name}</td>
      <td>${s.email}</td>
      <td>${s.course}</td>
      <td>${s.year}</td>
      <td>${s.address}</td>
      <td>${s.gwa || "-"}</td>
      <td>
        <button onclick="editStudent('${s._id}')">Edit</button>
        <button onclick="deleteStudent('${s._id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// ---------- Edit student ----------
async function editStudent(id) {
  try {
    const s = await api(`/students/${id}`); // fetch one student
    // Fill form with existing data
    nameInput.value = s.name;
    emailInput.value = s.email;
    courseInput.value = s.course;
    yearInput.value = s.year;
    addressInput.value = s.address;
    gwaInput.value = s.gwa || "";

    // Change form submit to update
    studentForm.onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        course: courseInput.value.trim(),
        year: yearInput.value.trim(),
        address: addressInput.value.trim(),
        gwa: gwaInput.value ? parseFloat(gwaInput.value) : null,
      };
      try {
        await api(`/students/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        alert("✏️ Student updated!");
        studentForm.reset();
        // restore form back to add mode
        studentForm.onsubmit = addStudentHandler;
        loadStudents();
      } catch (err) {
        console.error(err);
        alert("❌ Failed to update student");
      }
    };
  } catch (err) {
    console.error(err);
    alert("❌ Failed to fetch student data");
  }
}

// keep add-student logic in a separate function so we can restore it after edit
async function addStudentHandler(e) {
  e.preventDefault();
  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    course: courseInput.value.trim(),
    year: yearInput.value.trim(),
    address: addressInput.value.trim(),
    gwa: gwaInput.value ? parseFloat(gwaInput.value) : null,
  };

  try {
    await api("/students", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    alert("✅ Student added!");
    studentForm.reset();
    loadStudents();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to add student");
  }
}
studentForm.addEventListener("submit", addStudentHandler);
// ---------- Delete student ----------
async function deleteStudent(id) {
  if (!confirm("Delete student?")) return;
  await api(`/students/${id}`, { method: "DELETE" });
  loadStudents();
}
window.deleteStudent = deleteStudent;

// ---------- GWA Calculator ----------
document.getElementById("gwaForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const gradesStr = document.getElementById("grades").value;
  const grades = gradesStr.split(",").map((g) => parseFloat(g.trim()));

  const response = await fetch(API_URL + "/compute-gwa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grades }),
  });

  const result = await response.json();
  document.getElementById("gwaResult").innerText = `GWA: ${result.gwa}`;

  // Auto-fill GWA field in student form
  gwaInput.value = result.gwa;
});

// init
loadStudents();
