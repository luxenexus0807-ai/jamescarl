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

function clearForm() {
  nameInput.value = emailInput.value = courseInput.value = yearInput.value = addressInput.value = gwaInput.value = "";
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

// Keep track if we're editing
let editingId = null;

// ---------- Edit student ----------
async function editStudent(id) {
  try {
    const s = await api(`/students/${id}`);
    nameInput.value = s.name;
    emailInput.value = s.email;
    courseInput.value = s.course;
    yearInput.value = s.year;
    addressInput.value = s.address;
    gwaInput.value = s.gwa || "";
    editingId = id;
  } catch (err) {
    console.error(err);
    alert("❌ Failed to fetch student data");
  }
}

// ---------- Form submit (Add / Edit) ----------
studentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    course: courseInput.value.trim(),
    year: yearInput.value.trim(),
    address: addressInput.value.trim(),
    gwa: gwaInput.value ? parseFloat(gwaInput.value) : null,
  };

  if (!payload.name || !payload.email) {
    return alert("Name and Email are required!");
  }

  try {
    if (editingId) {
      // Update existing student
      await api(`/students/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      alert("✅ Student updated!");
      editingId = null;
    } else {
      // Add new student
      await api("/students", { method: "POST", body: JSON.stringify(payload) });
      alert("✅ Student added!");
    }
    studentForm.reset();
    loadStudents();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to save student");
  }
});

// ---------- Delete student ----------
async function deleteStudent(id) {
  if (!confirm("Delete student?")) return;
  try {
    await api(`/students/${id}`, { method: "DELETE" });
    loadStudents();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to delete student");
  }
}
window.deleteStudent = deleteStudent;

/// ---------- GWA Calculator (Prelim, Midterm, Final) ----------
document.getElementById("gwaForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get values from inputs
  const prelim = parseFloat(document.getElementById("prelim").value);
  const midterm = parseFloat(document.getElementById("midterm").value);
  const final = parseFloat(document.getElementById("final").value);

  // Validate
  if (isNaN(prelim) || isNaN(midterm) || isNaN(final)) {
    alert("Please enter valid numeric grades for all terms.");
    return;
  }

  // Optional: weights for each term
  const weights = { prelim: 0.3, midterm: 0.3, final: 0.4 };

  // Calculate weighted GWA
  const gwa = (prelim * weights.prelim) + (midterm * weights.midterm) + (final * weights.final);
  const roundedGWA = gwa.toFixed(2);

  // Display result
  document.getElementById("gwaResult").innerText = `GWA: ${roundedGWA}`;

  // Auto-fill student form
  gwaInput.value = roundedGWA;
});

// ---------- Init ----------
loadStudents();
