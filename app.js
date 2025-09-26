// =============================
// LocalStorage Helper
// =============================
function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadData(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
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
    const theme = btn.getAttribute("data-theme");
    body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    updateThemeButtons(theme);
    loadTasks(); // refresh chart colors
  });
});

function updateThemeButtons(activeTheme) {
  themeButtons.forEach((btn) =>
    btn.classList.toggle("active", btn.getAttribute("data-theme") === activeTheme)
  );
}

// =============================
// Subjects
// =============================
function loadSubjects() {
  const subjects = loadData("subjects");
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
    const subjects = loadData("subjects");
    const newSub = { id: Date.now(), name: input.value.trim() };
    subjects.push(newSub);
    saveData("subjects", subjects);
    input.value = "";
    loadSubjects();
  }
});

// =============================
// Tasks
// =============================
function loadTasks() {
  const tasks = loadData("tasks");
  const list = document.getElementById("tasksList");
  list.innerHTML = "";

  tasks.forEach((task) => {
    const dueDate = new Date(task.due);
    const li = document.createElement("li");
    li.className = "list-item fade-in";
    li.innerHTML = `
      <h4>${task.title}</h4>
      <p>Subject: ${task.subjectName || "N/A"}</p>
      <div class="item-meta">
        <span class="tag">${task.subjectName || ""}</span>
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
  const subjectName = document.querySelector(`#taskSubject option[value="${subject_id}"]`)?.textContent || "";
  const due = document.getElementById("taskDue").value;

  if (title && subject_id && due) {
    const tasks = loadData("tasks");
    tasks.push({ id: Date.now(), title, subject_id, subjectName, due });
    saveData("tasks", tasks);

    document.getElementById("taskTitle").value = "";
    document.getElementById("taskSubject").value = "";
    document.getElementById("taskDue").value = "";
    loadTasks();
  }
});

// =============================
// Notifications
// =============================
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// =============================
// Notifications (Browser + Capacitor)
// =============================
async function notifyTask(task, dueTime) {
  // Try Capacitor LocalNotifications first
  if (window.Capacitor && window.Capacitor.Plugins?.LocalNotifications) {
    const { LocalNotifications } = window.Capacitor.Plugins;
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "⏰ Task Due!",
          body: `${task.title} (${task.subjectName || "No subject"}) is due at ${dueTime.toLocaleTimeString()}`,
          id: task.id,
          schedule: { at: dueTime },
        },
      ],
    });
  } else if ("Notification" in window) {
    // Browser fallback
    if (Notification.permission === "granted") {
      new Notification("⏰ Task Due!", {
        body: `${task.title} (${task.subjectName || "No subject"}) is due at ${dueTime.toLocaleTimeString()}`,
        icon: "assets/notify.png",
      });
    }
  }
}

function checkTaskNotifications() {
  const tasks = loadData("tasks");
  const now = new Date();

  tasks.forEach((task) => {
    if (!task.due) return;
    const dueTime = new Date(task.due);
    const diff = dueTime - now;

    // Within 1 minute or exactly due
    if (Math.abs(diff) <= 60000 && !task.notified) {
      notifyTask(task, dueTime);

      // Mark as notified
      task.notified = true;
      saveData("tasks", tasks);
    }
  });
}

setInterval(checkTaskNotifications, 60000); // check every 1 min


// =============================
// Chart (Weekly Overview)
// =============================
let chart;
function updateChart(tasks = []) {
  const ctx = document.getElementById("weeklyChart").getContext("2d");
  const isDark = body.getAttribute("data-theme") === "dark";

  const counts = [0, 0, 0, 0, 0, 0, 0];
  tasks.forEach((t) => {
    const d = new Date(t.due).getDay(); // 0=Sun, 6=Sat
    counts[d === 0 ? 6 : d - 1]++; // shift Sun → last
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
// Delete Buttons
// =============================
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const id = parseInt(e.target.dataset.id);
    const type = e.target.dataset.type;

    if (confirm("Are you sure?")) {
      if (type === "subject") {
        let subjects = loadData("subjects").filter((s) => s.id !== id);
        saveData("subjects", subjects);
        loadSubjects();
      }
      if (type === "task") {
        let tasks = loadData("tasks").filter((t) => t.id !== id);
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
  checkTaskNotifications(); // check immediately on load
}
init();
