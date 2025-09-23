// app.js (fixed version)
const API_URL = "http://127.0.0.1:5000";

let loggedInStudent = null;
let allStudents = [];
let currentGradeStudentId = null;
let searchListenerAttached = false;

// ---------------------
// API helper
// ---------------------
async function api(path, opts = {}) {
  const res = await fetch(API_URL + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json().catch(() => ({}));
}

// ---------------------
// Login
// ---------------------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const role = document.getElementById("role").value;
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const res = await api("/login", {
        method: "POST",
        body: JSON.stringify({ role, username, password }),
      });

      if (res.role === "professor") {
        localStorage.setItem("role", "professor");
        showPortal();
      } else if (res.role === "student") {
        loggedInStudent = res.student;
        localStorage.setItem("role", "student");
        localStorage.setItem("studentId", res.student._id);
        showPortal();
      } else {
        alert("❌ Invalid login");
      }
    } catch (err) {
      alert("❌ Login failed: " + err.message);
    }
  });
}

// ---------------------
// Registration
// ---------------------
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      studentId: document.getElementById("regStudentId").value.trim(),
      username: document.getElementById("regUsername").value.trim(),
      password: document.getElementById("regPassword").value.trim(),
      name: document.getElementById("regName").value.trim(),
      course: document.getElementById("regCourse").value.trim(),
      year: document.getElementById("regYear").value.trim(),
      address: document.getElementById("regAddress").value.trim(),
      subjects: { OLSA01: null, OLIPT2: null },
      gwa: null,
    };

    try {
      await api("/students", { method: "POST", body: JSON.stringify(payload) });
      alert("✅ Registration successful! Please log in.");
      showLogin();
    } catch (err) {
      let msg = "❌ Registration failed.";
      try {
        const errorData = JSON.parse(err.message);
        if (errorData.error) msg = "⚠️ " + errorData.error;
      } catch {
        msg = "❌ Registration failed. Please try again.";
      }
      alert(msg);
    }
  });
}

// ---------------------
// UI helpers: show/hide sections
// ---------------------
function showSection(sectionId) {
  // hide all sections inside <main>
  document.querySelectorAll("main section").forEach((sec) => {
    sec.classList.add("hidden");
  });

  // show the one requested
  const el = document.getElementById(sectionId);
  if (el) el.classList.remove("hidden");

  // 🔹 highlight active sidebar link
  document.querySelectorAll(".sidebar a").forEach((a) => {
    a.classList.remove("active");
    if (a.getAttribute("onclick")?.includes(sectionId)) {
      a.classList.add("active");
    }
  });
}

function showRegister() {
  const loginPage = document.getElementById("loginPage");
  const registerPage = document.getElementById("registerPage");
  if (loginPage) loginPage.classList.add("hidden");
  if (registerPage) registerPage.classList.remove("hidden");
}

function showLogin() {
  const loginPage = document.getElementById("loginPage");
  const registerPage = document.getElementById("registerPage");
  if (registerPage) registerPage.classList.add("hidden");
  if (loginPage) loginPage.classList.remove("hidden");
}

function logout() {
  localStorage.clear();
  location.reload();
}

// ---------------------
// Grade descriptions
// ---------------------
function gradeDescription(grade) {
  const scale = {
    "1.0": "Excellent",
    "1.25": "Very Good",
    "1.5": "Very Good",
    "1.75": "Good",
    "2.0": "Good",
    "2.25": "Satisfactory",
    "2.5": "Satisfactory",
    "2.75": "Pass",
    "3.0": "Pass",
    "4.0": "Conditional",
    "5.0": "Fail",
    "INC": "Incomplete",
  };
  return scale[grade] || "Not yet graded";
}

// ---------------------
// Portal: showPortal (open Dashboard by default)
// ---------------------
function showPortal() {
  const role = localStorage.getItem("role");
  const loginPage = document.getElementById("loginPage");
  const registerPage = document.getElementById("registerPage");
  const portal = document.getElementById("portal");

  if (loginPage) loginPage.classList.add("hidden");
  if (registerPage) registerPage.classList.add("hidden");
  if (portal) portal.classList.remove("hidden");

  // Show/hide professor/student-only UI elements
  document.querySelectorAll(".prof-only").forEach((el) => {
    el.style.display = role === "professor" ? "block" : "none";
  });
  document.querySelectorAll(".student-only").forEach((el) => {
    el.style.display = role === "student" ? "block" : "none";
  });

  // Always show dashboard first
  if (role === "professor") {
    showSection("dashboard");   // profs land on Dashboard
  } else {
    showSection("myRecord");    // students land directly on their record
  }

  // load data
  loadStudents();
  if (role === "student") loadMyRecord();
}

// ---------------------
// Load students (professor view + store allStudents)
// ---------------------
async function loadStudents() {
  try {
    allStudents = await api("/students");
  } catch (err) {
    console.error("Failed to load students:", err);
    allStudents = [];
  }

  const role = localStorage.getItem("role");
  if (role === "professor") {
    // Dashboard stats
    const totalEl = document.getElementById("totalStudents");
    const lastEl = document.getElementById("lastStudent");
    const avgEl = document.getElementById("avgGwa");
    if (totalEl) totalEl.innerText = allStudents.length;
    if (allStudents.length > 0 && lastEl) lastEl.innerText = allStudents[allStudents.length - 1].name;
    if (avgEl) {
      const avgGwa =
        (allStudents
          .map((s) => s.gwa || 0)
          .filter((g) => g > 0)
          .reduce((a, b) => a + b, 0) / allStudents.length
        ).toFixed(2);
      avgEl.innerText = isNaN(avgGwa) ? "N/A" : avgGwa;
    }

    // Fill table
    const tbody = document.getElementById("studentTableBody");
    if (tbody) {
      tbody.innerHTML = "";
      allStudents.forEach((s) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${s.name}</td>
          <td>${s.username}</td>
          <td>${s.studentId}</td>
          <td>${s.course}</td>
          <td>${s.year}</td>
          <td>${s.address}</td>
          <td>${s.gwa ?? "-"}</td>
          <td>
            <button onclick="editStudent('${s._id}')">Edit</button>
            <button onclick="deleteStudent('${s._id}')">Delete</button>
            <button onclick="openGradesModal('${s._id}')">Update Grades</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  // Attach search listener once (safe-guard)
  const studentSearch = document.getElementById("studentSearch");
  if (studentSearch && !searchListenerAttached) {
    studentSearch.addEventListener("input", handleStudentSearch);
    searchListenerAttached = true;
  }
}

// ---------------------
// Student search handler (live search)
// ---------------------
function handleStudentSearch(e) {
  const query = (e.target.value || "").toLowerCase().trim();
  if (!query) {
    const sg = document.getElementById("studentGradesView");
    if (sg) sg.classList.add("hidden");
    return;
  }

  const student = allStudents.find(
    (s) =>
      s.name.toLowerCase().includes(query) ||
      s.studentId.toLowerCase().includes(query) ||
      (s.username && s.username.toLowerCase().includes(query))
  );

  if (!student) {
    const sg = document.getElementById("studentGradesView");
    if (sg) sg.classList.add("hidden");
    return;
  }

  // show selected student in Search Student panel
  document.getElementById("viewName").innerText = student.name;
  document.getElementById("viewStudentId").innerText = student.studentId;
  document.getElementById("viewCourse").innerText = student.course;
  document.getElementById("viewYear").innerText = student.year;

  const tbody = document.getElementById("selectedStudentSubjects");
  if (tbody) {
    tbody.innerHTML = "";
    for (const [subj, grade] of Object.entries(student.subjects || {})) {
      const tr = document.createElement("tr");
      const gradeText = !grade ? "Not yet graded" : (grade === "INC" ? "INC - Incomplete" : `${grade} - ${gradeDescription(grade)}`);
      tr.innerHTML = `<td>${subj}</td><td>${gradeText}</td>`;
      tbody.appendChild(tr);
    }
  }

  document.getElementById("selectedStudentGwa").innerText = student.gwa ?? "N/A";
  document.getElementById("studentGradesView").classList.remove("hidden");
}

// ---------------------
// Edit Student (prof)
// ---------------------
window.editStudent = async function (id) {
  const s = await api(`/students/${id}`);

  // create modal
  const overlay = document.createElement("div");
  overlay.className = "modal";
  overlay.id = "editStudentModal";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";

  const box = document.createElement("div");
  box.className = "modal-content";
  box.style.width = "420px";

  box.innerHTML = `
    <h3>Edit Student</h3>
    <form id="editStudentForm">
      <input type="text" id="edit_name" placeholder="Full name" value="${s.name || ""}" required>
      <input type="text" id="edit_username" placeholder="Username" value="${s.username || ""}" required>
      <input type="text" id="edit_studentId" placeholder="Student ID" value="${s.studentId || ""}" required>
      <input type="text" id="edit_course" placeholder="Course" value="${s.course || ""}" required>
      <input type="text" id="edit_year" placeholder="Year" value="${s.year || ""}" required>
      <input type="text" id="edit_address" placeholder="Address" value="${s.address || ""}" required>
      <div style="display:flex; gap:8px; margin-top:8px;">
        <button type="submit">Save</button>
        <button type="button" id="cancelEditBtn">Cancel</button>
      </div>
    </form>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  document.getElementById("cancelEditBtn").addEventListener("click", () => {
    overlay.remove();
  });

  document.getElementById("editStudentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("edit_name").value,
      username: document.getElementById("edit_username").value,
      studentId: document.getElementById("edit_studentId").value,
      course: document.getElementById("edit_course").value,
      year: document.getElementById("edit_year").value,
      address: document.getElementById("edit_address").value,
      password: document.getElementById("edit_password").value,
    };

    try {
      await api(`/students/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      alert("✅ Student updated!");
      overlay.remove();
      await loadStudents();
      const studentSearch = document.getElementById("studentSearch");
      if (studentSearch && studentSearch.value.trim()) handleStudentSearch({ target: studentSearch });
    } catch (err) {
      alert("❌ Update failed: " + err.message);
    }
  });
};

// ---------------------
// Delete Student
// ---------------------
window.deleteStudent = async function (id) {
  if (!confirm("Delete this student? This cannot be undone.")) return;
  await api(`/students/${id}`, { method: "DELETE" });
  await loadStudents();
  alert("✅ Student deleted.");
};

// ---------------------
// Grades modal (professor)
// ---------------------
function openGradesModal(id) {
  currentGradeStudentId = id;
  api(`/students/${id}`).then((student) => {
    document.getElementById("olsa01").value = student.subjects?.OLSA01 ?? "";
    document.getElementById("olipt2").value = student.subjects?.OLIPT2 ?? "";
    document.getElementById("gradesModal").classList.remove("hidden");
  }).catch(err => {
    alert("Failed to load student: " + err.message);
  });
}
window.openGradesModal = openGradesModal;

function closeGradesModal() {
  currentGradeStudentId = null;
  const gm = document.getElementById("gradesModal");
  if (gm) gm.classList.add("hidden");
}

// safe parse grade helper
function parseGradeForSave(val) {
  if (val === undefined || val === null || val === "") return null;
  if (val === "INC") return "INC";
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

const gradesForm = document.getElementById("gradesForm");
if (gradesForm) {
  gradesForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentGradeStudentId) return;

    const payload = {
      subjects: {
        OLSA01: parseGradeForSave(document.getElementById("olsa01").value),
        OLIPT2: parseGradeForSave(document.getElementById("olipt2").value),
      },
    };

    try {
      await api(`/students/${currentGradeStudentId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const updated = await api(`/students/${currentGradeStudentId}`);
      const numeric = Object.values(updated.subjects || {})
        .filter(g => g !== null && g !== undefined && g !== "INC")
        .map(g => parseFloat(g))
        .filter(g => !isNaN(g));

      let gwa = null;
      if (numeric.length > 0) {
        gwa = parseFloat((numeric.reduce((a, b) => a + b, 0) / numeric.length).toFixed(2));
        await api(`/students/${currentGradeStudentId}`, {
          method: "PUT",
          body: JSON.stringify({ gwa }),
        });
      } else {
        await api(`/students/${currentGradeStudentId}`, {
          method: "PUT",
          body: JSON.stringify({ gwa: null }),
        });
      }

      alert("✅ Grades and GWA updated!");
      closeGradesModal();
      await loadStudents();

      const studentSearch = document.getElementById("studentSearch");
      if (studentSearch && studentSearch.value.trim()) handleStudentSearch({ target: studentSearch });

    } catch (err) {
      alert("❌ Failed to save grades: " + err.message);
    }
  });
}

// ---------------------
// Student: My Record
// ---------------------
async function loadMyRecord() {
  const id = localStorage.getItem("studentId");
  if (!id) return;
  const s = await api(`/students/${id}`);

  const infoEl = document.getElementById("studentInfo");
  if (!infoEl) return;

  infoEl.innerHTML = `
    <p><strong>Name:</strong> <input type="text" id="editName" value="${s.name ?? ""}" readonly></p>
    <p><strong>Username:</strong> <input type="text" id="editUsername" value="${s.username ?? ""}" readonly></p>
    <p><strong>Student ID:</strong> <input type="text" id="editStudentId" value="${s.studentId ?? ""}" readonly></p>
    <p><strong>Course:</strong> <input type="text" id="editCourse" value="${s.course ?? ""}" readonly></p>
    <p><strong>Year:</strong> <input type="text" id="editYear" value="${s.year ?? ""}" readonly></p>
    <p><strong>Address:</strong> <input type="text" id="editAddress" value="${s.address ?? ""}" readonly></p>
  
    <button id="editProfileBtn">Edit Profile</button>
    <button id="saveProfileBtn" class="hidden">Save Changes</button>
  `;

  document.getElementById("editProfileBtn").addEventListener("click", () => {
    document.querySelectorAll("#studentInfo input").forEach((inp) => inp.readOnly = false);
    document.getElementById("editProfileBtn").classList.add("hidden");
    document.getElementById("saveProfileBtn").classList.remove("hidden");
  });

  document.getElementById("saveProfileBtn").addEventListener("click", () => {
    updateMyDetails(id);
  });

  const tbody = document.getElementById("subjectTable");
  if (tbody) {
    tbody.innerHTML = "";
    for (const [subj, grade] of Object.entries(s.subjects || {})) {
      let gradeText;
      if (grade === null || grade === undefined || grade === "") gradeText = "Not yet graded";
      else if (grade === "INC") gradeText = "INC - Incomplete";
      else gradeText = `${grade} - ${gradeDescription(grade)}`;

      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${subj}</td><td>${gradeText}</td>`;
      tbody.appendChild(tr);
    }
  }

  const myGwaEl = document.getElementById("myGwa");
  if (myGwaEl) myGwaEl.innerText = s.gwa ?? "N/A";
}

async function updateMyDetails(id) {
  const payload = {
    name: document.getElementById("editName").value,
    username: document.getElementById("editUsername").value,
    course: document.getElementById("editCourse").value,
    year: document.getElementById("editYear").value,
    address: document.getElementById("editAddress").value,

  };

  try {
    await api(`/students/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    alert("✅ Profile updated!");
    await loadMyRecord();
  } catch (err) {
    alert("❌ Update failed: " + err.message);
  }
}

// ---------------------
// Auto-login
// ---------------------
if (localStorage.getItem("role")) {
  showPortal();
} else {
  showLogin();
}
function showForgotPassword() {
  document.getElementById("forgotPasswordModal").classList.remove("hidden");
  document.getElementById("fpMessage").innerText = "";
}

function closeForgotPassword() {
  document.getElementById("forgotPasswordModal").classList.add("hidden");
}

const forgotPasswordForm = document.getElementById("forgotPasswordForm");
if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("fpUsername").value.trim();
    if (!username) return;

    try {
      const res = await api("/forgot-password", {
        method: "POST",
        body: JSON.stringify({ username }),
      });
      document.getElementById("fpMessage").innerText = "✅ " + res.msg;
    } catch (err) {
      document.getElementById("fpMessage").innerText = "❌ " + err.message;
    }
  });
}
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('active');
}