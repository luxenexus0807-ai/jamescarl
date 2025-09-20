// frontend/app.js
const API_URL = "http://127.0.0.1:5000"; // change if your backend is hosted elsewhere

// EmailJS init (keep your public key)
(function(){ emailjs.init("GtozLaiCa2VUAZnOu"); })();

// UI refs (same IDs as your HTML)
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const courseInput = document.getElementById('course');
const yearInput = document.getElementById('year');
const addressInput = document.getElementById('address');
const reqStudentIdInput = document.getElementById('reqStudentId');
const saveBtn = document.getElementById('saveBtn');
const requestBtn = document.getElementById('requestBtn');
const tableBody = document.getElementById('studentTableBody');
const requestsBody = document.getElementById('requestsTable');

let editingId = null;
let isAdminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";

// ---------- Helpers ----------
async function api(path, opts = {}) {
  const res = await fetch(API_URL + path, {
    headers: { "Content-Type": "application/json" },
    ...opts
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json().catch(()=> ({}));
}

function clearForm() {
  nameInput.value = emailInput.value = courseInput.value = yearInput.value = addressInput.value = "";
}

// ---------- Load lists ----------
async function loadStudents() {
  try {
    const students = await api("/students");
    tableBody.innerHTML = "";
    students.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="ID">${s.studentId || s.id}</td>
        <td data-label="Name">${s.name || ""}</td>
        <td data-label="Email">${s.email || ""}</td>
        <td data-label="Course">${s.course || ""}</td>
        <td data-label="Year">${s.year || ""}</td>
        <td data-label="Address">${s.address || ""}</td>
        <td data-label="Actions" class="actions">
          <button class="edit" onclick="editStudent('${s.id}')">Edit</button>
          <button class="delete" onclick="removeStudent('${s.id}')">Delete</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error("Failed to load students:", err);
  }
}

async function loadRequests() {
  try {
    const requests = await api("/requests");
    requestsBody.innerHTML = "";
    requests.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="Student ID">${r.studentId || "N/A"}</td>
        <td data-label="Name">${r.name || ""}</td>
        <td data-label="Requested Changes">Email: ${r.email || ""}, Course: ${r.course || ""}, Year: ${r.year || ""}, Address: ${r.address || ""}</td>
        <td data-label="Actions" class="actions">
          <button onclick="approveRequest('${r.id}')">Approve</button>
          <button class="delete" onclick="rejectRequest('${r.id}')">Reject</button>
        </td>
      `;
      requestsBody.appendChild(tr);
    });
  } catch (err) {
    console.error("Failed to load requests:", err);
  }
}

// ---------- Save Student (Add / Update) ----------
saveBtn.addEventListener('click', async () => {
  const payload = {
    studentId: null, // optional - server will generate if missing
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    course: courseInput.value.trim(),
    year: yearInput.value.trim(),
    address: addressInput.value.trim()
  };
  if (!payload.name || !payload.email) return alert("Name and Email required!");

  try {
    if (editingId) {
      await api(`/students/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      alert("✅ Student updated!");
      editingId = null;
      saveBtn.textContent = "Save";
    } else {
      const res = await api("/students", { method: "POST", body: JSON.stringify(payload) });
      // send email via EmailJS (optional)
      emailjs.send("service_33halra", "template_yf7lbga", {
        to_email: payload.email,
        student_id: res.studentId,
        name: payload.name,
        course: payload.course,
        year: payload.year,
        address: payload.address
      }).then(()=>{
        alert("✅ Student added & Email sent to " + payload.email);
      }).catch(()=>{
        alert("✅ Student added but failed to send email.");
      });
    }
  } catch (err) {
    console.error(err);
    alert("❌ Error saving student");
  } finally {
    clearForm();
    loadStudents();
  }
});

// ---------- Request Update ----------
requestBtn.addEventListener('click', async () => {
  const studentIdCode = reqStudentIdInput.value.trim();
  const payload = {
    studentId: studentIdCode,
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    course: courseInput.value.trim(),
    year: yearInput.value.trim(),
    address: addressInput.value.trim()
  };
  if (!payload.studentId) return alert("Please enter your Student ID!");
  if (!payload.name || !payload.email) return alert("Name and Email required!");
  try {
    await api("/requests", { method: "POST", body: JSON.stringify(payload) });
    alert("📩 Request sent to Admin!");
    reqStudentIdInput.value = "";
    clearForm();
    loadRequests();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to send request");
  }
});

// ---------- Admin actions ----------
window.removeStudent = async (id) => {
  if (!confirm("Delete student?")) return;
  try {
    await api(`/students/${id}`, { method: "DELETE" });
    loadStudents();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to delete");
  }
};

window.editStudent = async (id) => {
  try {
    const s = await api(`/students/${id}`);
    editingId = id;
    nameInput.value = s.name || "";
    emailInput.value = s.email || "";
    courseInput.value = s.course || "";
    yearInput.value = s.year || "";
    addressInput.value = s.address || "";
    showPage('studentReg');
    saveBtn.textContent = "Save Changes";
    alert("✏️ Now editing student: " + (s.name || "Unknown"));
  } catch (err) {
    console.error(err);
    alert("❌ Failed to fetch student");
  }
};

window.approveRequest = async (id) => {
  try {
    const res = await api(`/requests/${id}/approve`, { method: "POST" });
    // optionally send approval email via EmailJS (so the instructor sees the same UX as before)
    // server returns studentId and action
    const payload = res;
    // Normally we'd get the email from the original request. For simplicity, reload requests and students and trust email sending on server-side or from client
    // We'll fetch the request details first (we can hit GET /requests and find id before approval in real app)
    alert("✅ Request approved (" + payload.action + "). Student ID: " + (payload.studentId || "N/A"));
    loadRequests();
    loadStudents();
  } catch (err) {
    console.error(err);
    alert("❌ Error approving request");
  }
};

window.rejectRequest = async (id) => {
  if (!confirm("Reject this request?")) return;
  try {
    // get request details - to send rejection email - fetch all requests and find the one (simple)
    const all = await api("/requests");
    const r = all.find(x => x.id === id);
    await api(`/requests/${id}`, { method: "DELETE" });
    if (r && r.email) {
      emailjs.send("service_33halra", "template_request_rejected", {
        to_email: r.email,
        name: r.name,
        reason: "Your request was not approved. Please double-check your details and try again."
      }).then(()=> {
        alert("❌ Request rejected and student notified via email!");
      }).catch(()=> {
        alert("❌ Request rejected but failed to send email.");
      });
    } else {
      alert("❌ Request rejected.");
    }
    loadRequests();
  } catch (err) {
    console.error(err);
    alert("❌ Error rejecting request");
  }
};

// Admin login/logout (keeps your existing UI)
window.openAdmin = function () {
  if (!isAdminLoggedIn) {
    document.getElementById('adminLogin').classList.remove('hidden');
  } else {
    showPage('adminPage');
  }
};
window.closeAdminLogin = function () {
  document.getElementById('adminLogin').classList.add('hidden');
};
window.checkAdmin = function () {
  const password = document.getElementById('adminPassword').value;
  if (password === "admin123") {
    isAdminLoggedIn = true;
    localStorage.setItem("adminLoggedIn", "true");
    document.getElementById('adminLogin').classList.add('hidden');
    showPage('adminPage');
    loadStudents();
    loadRequests();
  } else {
    alert("❌ Wrong password!");
  }
};
window.logoutAdmin = function () {
  isAdminLoggedIn = false;
  localStorage.removeItem("adminLoggedIn");
  showPage('studentReg');
};

// small initialization
loadStudents();
loadRequests();
