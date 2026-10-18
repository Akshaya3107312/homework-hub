# 📚 Homework Hub – Multi-Student Homework Management System

A modern, responsive, multi-student homework management and classroom study productivity web application built with clean **HTML5**, **CSS3**, and **Vanilla JavaScript (ES6+)**.

---

## 🌟 Multi-Student Architecture & New Features

### 1. 👥 Multi-Student Profile Access & Instant Switcher
- **Multiple Student Accounts**: Supports multiple students accessing the same application on a shared computer, classroom kiosk, or family setting.
- **Pre-Loaded Student Profiles**:
  - 👨‍🎓 **Alex Parker** (11th Grade &bull; STEM & AP Calculus BC Focus)
  - 👩‍🔬 **Maya Lin** (10th Grade &bull; Pre-Med, AP Chemistry & Biology)
  - 🎨 **Jordan Smith** (12th Grade &bull; Senior Year & Literature)
- **One-Click Switcher**:
  - **Top Navbar Switcher Pill**: Click the student pill anytime to instantly switch to another student profile from a dropdown.
  - **Sidebar Switcher**: Direct switch shortcut in the sidebar profile card.
  - **Context-Switching**: When you switch students, the **Dashboard**, **Kanban Board**, **Deadlines Calendar**, **Courses**, and **Pomodoro Study Logs** immediately switch to that student's specific assignments and progress!
- **Manage & Add Students**:
  - Add unlimited new student profiles with custom Name, Grade, Avatar Emoji (👨‍🎓, 👩‍🎓, 👩‍🔬, 🧑‍💻, 🎨, 📚, ⚽, 🚀), Email/ID, and Badge Colors.
  - Edit or delete student profiles anytime.

### 2. 🏫 Class Roster & Classroom Hub View
- **Dedicated View (`#view-roster`)** accessible directly from the sidebar navigation:
  - **Class Overview Metrics**:
    - Total Enrolled Students
    - Class Average Homework Completion Rate (%)
    - Total Class Homework Tasks
    - Total Study Hours Logged
  - **All Student Profile Cards**:
    - Shows each student's avatar, grade, email, bio, active tasks, completed tasks, overdue tasks, and a live progress bar.
    - One-click `⇄ Switch to Profile` button.
  - **🏆 Academic Study & Diligence Leaderboard**:
    - Real-time ranking of students based on completed homework and focused Pomodoro study minutes with 🥇 Gold, 🥈 Silver, and 🥉 Bronze badges.

### 3. 📢 Student-Specific & Class-Wide Homework Assignments
- When creating an assignment, teachers or students can use the **"Assign To"** dropdown:
  - Assign to the **Current Student**
  - Assign to any other specific student
  - **👥 All Students (Broadcast Class Homework)**: Broadcasts an assignment to every student in the system! Each student independently tracks and checks off their own completion status and milestones without interfering with other students.

### 4. 📊 Student Command Center (Dashboard & Task List)
- **Active Student Metrics**: Active tasks, due today/tomorrow, overdue warning, completion rate (%), and focused study minutes.
- **Smart Urgency Grouping**:
  - ⚠️ **Overdue Assignments**
  - 🔥 **Due Today** (with live countdown: e.g. *"Due in 3 hours"*)
  - ⏳ **Due This Week**
  - 🗓️ **Upcoming Later**
  - 🎉 **Completed Homework**
- **Rich Task Cards**: Course badges, priority pills (Urgent, High, Medium, Low), milestone checklists, resource links (Google Docs, Canvas), and Pomodoro launcher.
- **Display Modes**: Toggle between **Card Grid** and **Compact Table** layouts; sort by due date, priority, or title.

### 5. 📋 Multi-Student Kanban Board
- Columns: `To Do 📝` ➔ `In Progress ⏳` ➔ `Completed 🎉`.
- **HTML5 Drag-and-Drop**: Drag task cards directly between columns with smooth hover states.
- Displays `👥 Class` badges for shared assignments.

### 6. 🗓️ Deadlines Calendar
- Monthly calendar grid scoped to the active student.
- Click any date to open the **Day Detail Modal** showing deadlines for that day and an **"Add Task for this day"** button.

### 7. ⏱️ Pomodoro Focus Lounge & Ambient Audio Synthesizer
- Modes: **Pomodoro (25m)**, **Short Break (5m)**, and **Long Break (15m)**.
- **Procedural Web Audio API Sound Generator** (100% offline, zero external MP3s):
  - 🌧️ *Rain Shower*
  - 🌊 *White Noise*
  - 🌲 *Forest Wind*
  - 🔔 *Completion Bell Chime*
- **Per-Student Focus Logs**: Logs time focused per student and reflects on the classroom leaderboard.

### 8. 💾 Multi-Student Data Portability & Offline Persistence
- **100% Offline-Capable**: Powered by `localStorage`.
- **Full Multi-Student JSON Backup**: Export or import all students, assignments, and study logs in one file.
- **Printable Student Agenda**: Print a clean homework checklist for the active student (`Ctrl + P`).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>N</kbd> | Open New Assignment Modal |
| <kbd>/</kbd> | Focus Global Search Bar |
| <kbd>Esc</kbd> | Close Any Open Modal / Dropdown |

---

## 🚀 How to Run

### Method 1: Instant Launch
Open [**`index.html`**](file:///C:/Users/ADMIN/.gemini/antigravity/scratch/homework-hub/index.html) in your browser:
```powershell
Start-Process "C:\Users\ADMIN\.gemini\antigravity\scratch\homework-hub\index.html"
```

### Method 2: Local Web Server
```powershell
cd C:\Users\ADMIN\.gemini\antigravity\scratch\homework-hub
python -m http.server 8080
```
Then navigate to: **`http://localhost:8080`**
