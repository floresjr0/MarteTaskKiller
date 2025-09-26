// =============================
// LocalStorage Helpers
// =============================
function getData(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function generateId(key) {
  let id = parseInt(localStorage.getItem(key + "_id") || "1");
  localStorage.setItem(key + "_id", id + 1);
  return id;
}

// =============================
// Theme Management
// =============================
const themeButtons = document.querySelectorAll(".theme-btn");
const body = document.body;
const savedTheme = localStorage.getItem("theme") || "light";
body.setAttribute("data-theme", savedTheme);
updateThemeButtons(savedTheme);

themeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const theme = btn.dataset.theme;
    body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    updateThemeButtons(theme);
    loadTasks();
  });
});

function updateThemeButtons(activeTheme) {
  themeButtons.forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.theme === activeTheme)
  );
}

// =============================
// Subjects
// =============================
function loadSubjects() {
  const subjects = getData("subjects");
  const list = document.getElementById("subjectsList");
  list.innerHTML = "";

  const subjectDropdown = document.getElementById("taskSubject");
  subjectDropdown.innerHTML = '<option value="">Select subject</option>';

  subjects.forEach((sub) => {
    const li = document.createElement("li");
    li.className = "list-item fade-in";
    li.innerHTML = `
      <h4>${sub.name}</h4>
      <button class="btn btn-sm delete-btn" data-id="${sub.id}" data-type="subject">❌</button>
    `;
    list.appendChild(li);

    const opt = document.createElement("option");
    opt.value = sub.id;
    opt.textContent = sub.name;
    subjectDropdown.appendChild(opt);
  });
}

document.getElementById("addSubjectBtn").addEventListener("click", () => {
  const input = document.getElementById("subjectName");
  if (input.value.trim()) {
    const subjects = getData("subjects");
    subjects.push({ id: generateId("subject"), name: input.value.trim() });
    saveData("subjects", subjects);
    input.value = "";
    loadSubjects();
  }
});

// =============================
// Tasks
// =============================
function loadTasks() {
  const tasks = getData("tasks");
  const subjects = getData("subjects");
  const list = document.getElementById("tasksList");
  list.innerHTML = "";

  tasks.forEach((task) => {
    const subject = subjects.find((s) => s.id == task.subject_id);
    const dueDate = new Date(task.due);
    const li = document.createElement("li");
    li.className = "list-item fade-in";
    li.innerHTML = `
      <h4>${task.title}</h4>
      <p>Subject: ${subject ? subject.name : "N/A"}</p>
      <div class="item-meta">
        <span class="tag">${subject ? subject.name : ""}</span>
        <span class="timestamp">${dueDate.toLocaleString()}</span>
      </div>
      <button class="btn btn-sm delete-btn" data-id="${task.id}" data-type="task">❌</button>
    `;
    list.appendChild(li);
  });

  updateChart(tasks);
}

document.getElementById("addTaskBtn").addEventListener("click", () => {
  const title = document.getElementById("taskTitle").value.trim();
  const subject_id = document.getElementById("taskSubject").value;
  const due = document.getElementById("taskDue").value;

  if (title && subject_id && due) {
    const tasks = getData("tasks");
    tasks.push({ id: generateId("task"), title, subject_id, due });
    saveData("tasks", tasks);

    document.getElementById("taskTitle").value = "";
    document.getElementById("taskSubject").value = "";
    document.getElementById("taskDue").value = "";
    loadTasks();
  }
});

// =============================
// Chart (Weekly Overview)
// =============================
let chart;
function updateChart(tasks = []) {
  const ctx = document.getElementById("weeklyChart").getContext("2d");
  const isDark = body.getAttribute("data-theme") === "dark";

  const counts = [0, 0, 0, 0, 0, 0, 0];
  tasks.forEach((t) => {
    const d = new Date(t.due).getDay();
    counts[d === 0 ? 6 : d - 1]++;
  });

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Tasks Due",
          data: counts,
          backgroundColor: "#6366f1",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: isDark ? "#cbd5e1" : "#333" },
        },
      },
      scales: {
        y: { ticks: { color: isDark ? "#cbd5e1" : "#333" } },
        x: { ticks: { color: isDark ? "#cbd5e1" : "#333" } },
      },
    },
  });
}

// =============================
// Delete (Subjects, Tasks)
// =============================
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const id = parseInt(e.target.dataset.id);
    const type = e.target.dataset.type;
    if (confirm("Are you sure?")) {
      if (type === "subject") {
        let subs = getData("subjects").filter((s) => s.id !== id);
        saveData("subjects", subs);
        loadSubjects();
      }
      if (type === "task") {
        let tasks = getData("tasks").filter((t) => t.id !== id);
        saveData("tasks", tasks);
        loadTasks();
      }
    }
  }
});

// =============================
// Init
// =============================
function init() {
  loadSubjects();
  loadTasks();
}
init();
