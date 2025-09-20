import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, doc, deleteDoc, updateDoc,
  onSnapshot, query, orderBy, getDoc, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBaUW6uREz68y8y5x9pGwNUVV5eDF8wbmw",
  authDomain: "studentminiportal.firebaseapp.com",
  projectId: "studentminiportal",
  storageBucket: "studentminiportal.firebasestorage.app",
  messagingSenderId: "86654710932",
  appId: "1:86654710932:web:f79cc99c7577645a00b081",
  measurementId: "G-ZKCW4MCSYF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const studentsCol = collection(db, "students");
const requestsCol = collection(db, "requests");

// EmailJS Init
(function(){
  emailjs.init("GtozLaiCa2VUAZnOu"); // replace with your EmailJS public key
})();

// UI refs
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const courseInput = document.getElementById('course');
const yearInput = document.getElementById('year');
const addressInput = document.getElementById('address');
const reqStudentIdInput = document.getElementById('reqStudentId');
const saveBtn = document.getElementById('saveBtn');
const requestBtn = document.getElementById('requestBtn');
const tableBody = document.getElementById('studentTable');
const requestsBody = document.getElementById('requestsTable');

// Tabs
window.switchTab = (tab) => {
  document.getElementById("studentsSection").classList.add("hidden");
  document.getElementById("requestsSection").classList.add("hidden");
  document.getElementById("studentsTab").classList.remove("active");
  document.getElementById("requestsTab").classList.remove("active");

  if (tab === "students") {
    document.getElementById("studentsSection").classList.remove("hidden");
    document.getElementById("studentsTab").classList.add("active");
  } else {
    document.getElementById("requestsSection").classList.remove("hidden");
    document.getElementById("requestsTab").classList.add("active");
  }
};

// Pages toggle
window.showPage = (page) => {
  document.getElementById('studentReg').classList.add('hidden');
  document.getElementById('adminPage').classList.add('hidden');
  document.getElementById(page).classList.remove('hidden');
};
showPage('studentReg');

// Save Student
saveBtn.addEventListener('click', async () => {
    const payload = { 
      name: nameInput.value.trim(), 
      email: emailInput.value.trim(),
      course: courseInput.value.trim(), 
      year: yearInput.value.trim(), 
      address: addressInput.value.trim() 
    };
    if (!payload.name || !payload.email) return alert("Name and Email required!");
  
    if (editingId) {
      // UPDATE existing student
      await updateDoc(doc(db, "students", editingId), payload);
      alert("✅ Student updated!");
      editingId = null;
      saveBtn.textContent = "Save"; // reset button
    } else {
      // ADD new student
      const studentIdCode = "STU-" + Math.random().toString(36).substring(2,8).toUpperCase();
      payload.studentId = studentIdCode;
  
      await addDoc(studentsCol, payload);
  
      // Send email
      emailjs.send("service_33halra", "template_yf7lbga", {
        to_email: payload.email,
        student_id: studentIdCode,
        name: payload.name,
        course: payload.course,
        year: payload.year,
        address: payload.address
      }).then(() => {
        alert("✅ Student added & Email sent to " + payload.email);
      }).catch(() => {
        alert("⚠️ Student added but failed to send email.");
      });
    }
  
    // Clear form
    nameInput.value = emailInput.value = courseInput.value = yearInput.value = addressInput.value = "";
  });
  

// Request Update
requestBtn.addEventListener('click', async () => {
  const studentIdCode = reqStudentIdInput.value.trim();
  if (!studentIdCode) return alert("❌ Please enter your Student ID!");

  const payload = { 
    studentId: studentIdCode,
    name: nameInput.value.trim(), 
    email: emailInput.value.trim(),
    course: courseInput.value.trim(), 
    year: yearInput.value.trim(), 
    address: addressInput.value.trim(),
    status: "pending"
  };
  if (!payload.name || !payload.email) return alert("Name and Email required!");

  await addDoc(requestsCol, payload);
  alert("📩 Request sent to Admin!");
  reqStudentIdInput.value = "";
  nameInput.value = emailInput.value = courseInput.value = yearInput.value = addressInput.value = "";
});

// Real-time Students
const q = query(studentsCol, orderBy('name'));
onSnapshot(q, (snapshot) => {
  tableBody.innerHTML = '';
  snapshot.forEach(docSnap => {
    const s = docSnap.data();
    const id = docSnap.id;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.studentId || id}</td>
      <td>${s.name || ''}</td>
      <td>${s.email || ''}</td>
      <td>${s.course || ''}</td>
      <td>${s.year || ''}</td>
      <td>${s.address || ''}</td>
      <td class="actions">
        <button class="edit" onclick="editStudent('${id}')">Edit</button>
        <button class="delete" onclick="removeStudent('${id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
});

// Requests
onSnapshot(requestsCol, (snapshot) => {
  requestsBody.innerHTML = '';
  snapshot.forEach(docSnap => {
    const r = docSnap.data();
    const id = docSnap.id;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.studentId || "N/A"}</td>
      <td>${r.name}</td>
      <td>Email: ${r.email}, Course: ${r.course}, Year: ${r.year}, Address: ${r.address}</td>
      <td class="actions">
        <button onclick="approveRequest('${id}', '${r.studentId}')">Approve</button>
        <button class="delete" onclick="rejectRequest('${id}')">Reject</button>
      </td>
    `;
    requestsBody.appendChild(tr);
  });
});

// Admin Actions
window.removeStudent = async (id) => {
  if (!confirm("Delete student?")) return;
  await deleteDoc(doc(db, "students", id));
};
let editingId = null;

window.editStudent = async (id) => {
    const docRef = doc(db, "students", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
  
    const data = snap.data();
    editingId = id;
  
    // Fill the form with student data
    nameInput.value = data.name || "";
    emailInput.value = data.email || "";
    courseInput.value = data.course || "";
    yearInput.value = data.year || "";
    addressInput.value = data.address || "";
  
    // Switch to Student Registration page for editing
    showPage('studentReg');
  
    // ✅ Set button text for clarity
    saveBtn.textContent = "Save Changes";
  
    alert("✏️ Now editing student: " + (data.name || "Unknown"));
  };
// ✅ Approve Request (update existing student instead of adding new)
window.approveRequest = async (id) => {
  const snap = await getDoc(doc(db, "requests", id));
  if (!snap.exists()) return;
  const data = snap.data();

  try {
    // Find the student by studentId
    const q = query(studentsCol, where("studentId", "==", data.studentId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Update the existing student
      const studentDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "students", studentDoc.id), {
        name: data.name,
        email: data.email,
        course: data.course,
        year: data.year,
        address: data.address
      });

      // Delete the request
      await deleteDoc(doc(db, "requests", id));

      // Send approval email
      await emailjs.send("service_33halra", "template_yf7lbga", {
        to_email: data.email,
        student_id: data.studentId,
        name: data.name,
        course: data.course,
        year: data.year,
        address: data.address
      });

      alert("✅ Request approved and student record updated!");
    } else {
      alert("⚠️ No matching student found for ID " + data.studentId);
    }
  } catch (err) {
    console.error(err);
    alert("❌ Error approving request.");
  }
};
  
  // ❌ Reject Request (with email)
  window.rejectRequest = async (id) => {
    const snap = await getDoc(doc(db, "requests", id));
    if (!snap.exists()) return;
    const data = snap.data();
  
    // Delete request
    await deleteDoc(doc(db, "requests", id));
  
    // Send rejection email
    emailjs.send("service_33halra", "template_request_rejected", {
      to_email: data.email,
      name: data.name,
      reason: "Your request was not approved. Please double-check your details and try again."
    }).then(() => {
      alert("❌ Request rejected and student notified via email!");
    }).catch((err) => {
      console.error(err);
      alert("⚠️ Rejected but failed to send email.");
    });
  };
  
// Track login state
let isAdminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";

// Admin login system
const adminModal = document.getElementById('adminLogin');

// Open Admin Login (only if not logged in)
window.openAdmin = function () {
  if (!isAdminLoggedIn) {
    document.getElementById('adminLogin').classList.remove('hidden');
  } else {
    showPage('adminPage');
  }
};

// Close Admin Login
window.closeAdminLogin = function () {
  document.getElementById('adminLogin').classList.add('hidden');
};

// Check Admin Login
window.checkAdmin = function () {
  const password = document.getElementById('adminPassword').value;
  if (password === "admin123") {
    isAdminLoggedIn = true;
    localStorage.setItem("adminLoggedIn", "true"); // save state
    document.getElementById('adminLogin').classList.add('hidden');
    showPage('adminPage');
  } else {
    alert("❌ Wrong password!");
  }
};

// Force logout (optional)
window.logoutAdmin = function () {
  isAdminLoggedIn = false;
  localStorage.removeItem("adminLoggedIn");
  showPage('studentReg'); // back to student side
};

  
