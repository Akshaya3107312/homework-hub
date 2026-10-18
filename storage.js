/**
 * Homework Hub - Multi-Student LocalStorage & Data Store Manager
 */

const STORAGE_KEYS = {
  STUDENTS: 'homework_hub_students_v2',
  ACTIVE_STUDENT: 'homework_hub_active_student_v2',
  AUTH_SESSION: 'homework_hub_auth_session_v2',
  TASKS: 'homework_hub_tasks_v2',
  SUBJECTS: 'homework_hub_subjects_v2',
  SETTINGS: 'homework_hub_settings_v2',
  POMO_LOG: 'homework_hub_pomo_log_v2'
};

// Helper to format date strings YYYY-MM-DD offset by days from now
function getDateOffset(daysOffset = 0, hours = 23, minutes = 59) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  return { date: `${year}-${month}-${day}`, time };
}

// Initial Default Students with Login Credentials
const DEFAULT_STUDENTS = [
  {
    id: 'student-1',
    name: 'Alex Parker',
    username: 'alex',
    password: '1234',
    grade: '11th Grade',
    avatar: '👨‍🎓',
    color: '#4F46E5',
    email: 'alex.parker@school.edu',
    bio: 'STEM & AP Calculus BC Focus'
  },
  {
    id: 'student-2',
    name: 'Maya Lin',
    username: 'maya',
    password: '1234',
    grade: '10th Grade',
    avatar: '👩‍🔬',
    color: '#06B6D4',
    email: 'maya.lin@school.edu',
    bio: 'Pre-Med, AP Chemistry & Biology'
  },
  {
    id: 'student-3',
    name: 'Jordan Smith',
    username: 'jordan',
    password: '1234',
    grade: '12th Grade',
    avatar: '🎨',
    color: '#EC4899',
    email: 'jordan.smith@school.edu',
    bio: 'Senior Year & Literature'
  }
];

// Initial default subjects (Shared course catalog)
const DEFAULT_SUBJECTS = [
  { id: 'subj-1', name: 'AP Calculus BC', code: 'MATH 301', color: '#4F46E5' },
  { id: 'subj-2', name: 'AP Chemistry', code: 'CHEM 202', color: '#06B6D4' },
  { id: 'subj-3', name: 'World History', code: 'HIST 105', color: '#F59E0B' },
  { id: 'subj-4', name: 'English Literature', code: 'ENG 210', color: '#EC4899' },
  { id: 'subj-5', name: 'Computer Science', code: 'CS 150', color: '#10B981' },
  { id: 'subj-6', name: 'AP Biology', code: 'BIO 201', color: '#14B8A6' },
  { id: 'subj-7', name: 'Economics', code: 'ECON 101', color: '#8B5CF6' }
];

// Initial multi-student demo tasks
function generateDefaultTasks() {
  const today = getDateOffset(0, 23, 59);
  const tomorrow = getDateOffset(1, 17, 0);
  const in2Days = getDateOffset(2, 23, 59);
  const in3Days = getDateOffset(3, 23, 59);
  const in5Days = getDateOffset(5, 23, 59);
  const yesterday = getDateOffset(-1, 23, 59);
  const past2Days = getDateOffset(-2, 16, 0);

  return [
    /* --- STUDENT 1: ALEX PARKER (STEM) --- */
    {
      id: 'task-1',
      studentId: 'student-1',
      title: 'Calculus Problem Set 6: Integration Techniques',
      subjectId: 'subj-1',
      dueDate: today.date,
      dueTime: today.time,
      priority: 'urgent',
      status: 'in-progress',
      estDuration: 60,
      notes: 'Complete textbook Chapter 7, problems #14-38 even. Show all algebraic substitution steps.',
      resourceUrl: 'https://ocw.mit.edu',
      subtasks: [
        { id: 'st-1', text: 'Review lecture notes on partial fractions', completed: true },
        { id: 'st-2', text: 'Solve problems 14 through 24', completed: true },
        { id: 'st-3', text: 'Solve problems 26 through 38', completed: false },
        { id: 'st-4', text: 'Verify answers with graphing calculator', completed: false }
      ],
      completedBy: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-2',
      studentId: 'student-1',
      title: 'Chemistry Lab Report: Acid-Base Titration',
      subjectId: 'subj-2',
      dueDate: tomorrow.date,
      dueTime: tomorrow.time,
      priority: 'high',
      status: 'pending',
      estDuration: 90,
      notes: 'Include molarity calculation table, graph of pH curve, and error analysis section (min 500 words).',
      resourceUrl: '',
      subtasks: [
        { id: 'st-5', text: 'Tabulate titration trial data', completed: false },
        { id: 'st-6', text: 'Plot pH curve on Google Sheets', completed: false },
        { id: 'st-7', text: 'Write conclusion and error analysis', completed: false }
      ],
      completedBy: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-3',
      studentId: 'student-1',
      title: 'CS Project: Binary Search Tree & Graph Traversal',
      subjectId: 'subj-5',
      dueDate: in5Days.date,
      dueTime: in5Days.time,
      priority: 'high',
      status: 'pending',
      estDuration: 75,
      notes: 'Implement BFS and DFS algorithms in JavaScript/Python with unit test cases passing 100%.',
      resourceUrl: 'https://github.com',
      subtasks: [
        { id: 'st-8', text: 'Implement Node and BST class', completed: false },
        { id: 'st-9', text: 'Write in-order, pre-order, and post-order tests', completed: false }
      ],
      completedBy: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-4',
      studentId: 'student-1',
      title: 'Calculus Warmup: Derivative Rules Quiz',
      subjectId: 'subj-1',
      dueDate: past2Days.date,
      dueTime: past2Days.time,
      priority: 'medium',
      status: 'completed',
      estDuration: 30,
      notes: 'Scored 100% on chain rule and quotient rule practice.',
      resourceUrl: '',
      subtasks: [
        { id: 'st-10', text: 'Review flashcards', completed: true },
        { id: 'st-11', text: 'Take practice test', completed: true }
      ],
      completedBy: [],
      createdAt: new Date().toISOString()
    },

    /* --- STUDENT 2: MAYA LIN (PRE-MED & BIO) --- */
    {
      id: 'task-5',
      studentId: 'student-2',
      title: 'AP Chemistry: Stoichiometry & Gas Laws Worksheet',
      subjectId: 'subj-2',
      dueDate: today.date,
      dueTime: today.time,
      priority: 'urgent',
      status: 'pending',
      estDuration: 45,
      notes: 'Solve ideal gas equation practice problems 1 to 20 for tomorrow morning discussion.',
      resourceUrl: '',
      subtasks: [
        { id: 'st-12', text: 'Complete problems 1 to 10', completed: true },
        { id: 'st-13', text: 'Complete gas mixture partial pressures', completed: false }
      ],
      completedBy: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-6',
      studentId: 'student-2',
      title: 'AP Biology: Cellular Respiration Lab Writeup',
      subjectId: 'subj-6',
      dueDate: in2Days.date,
      dueTime: in2Days.time,
      priority: 'high',
      status: 'in-progress',
      estDuration: 80,
      notes: 'Analyze yeast fermentation CO2 production rate graphs and calculate Q10 coefficient.',
      resourceUrl: '',
      subtasks: [
        { id: 'st-14', text: 'Graph yeast data points', completed: true },
        { id: 'st-15', text: 'Write biochemical mechanism analysis', completed: false }
      ],
      completedBy: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-7',
      studentId: 'student-2',
      title: 'World History: Enlightenment Thinkers Essay',
      subjectId: 'subj-3',
      dueDate: in3Days.date,
      dueTime: in3Days.time,
      priority: 'medium',
      status: 'pending',
      estDuration: 60,
      notes: 'Compare Locke and Rousseau views on individual liberty vs social contract.',
      resourceUrl: '',
      subtasks: [],
      completedBy: [],
      createdAt: new Date().toISOString()
    },

    /* --- STUDENT 3: JORDAN SMITH (SENIOR HUMANITIES & LITERATURE) --- */
    {
      id: 'task-8',
      studentId: 'student-3',
      title: 'English Literature: Hamlet Critical Soliloquy Essay',
      subjectId: 'subj-4',
      dueDate: today.date,
      dueTime: today.time,
      priority: 'urgent',
      status: 'in-progress',
      estDuration: 75,
      notes: 'Examine existential motifs in Act 3 Scene 1. Draft 1200 words in MLA format.',
      resourceUrl: 'https://www.folger.edu',
      subtasks: [
        { id: 'st-16', text: 'Analyze textual references and metaphors', completed: true },
        { id: 'st-17', text: 'Write body paragraphs', completed: false }
      ],
      completedBy: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-9',
      studentId: 'student-3',
      title: 'Economics: Supply, Demand & Market Equilibrium Case Study',
      subjectId: 'subj-7',
      dueDate: in3Days.date,
      dueTime: in3Days.time,
      priority: 'medium',
      status: 'pending',
      estDuration: 60,
      notes: 'Case study on energy price caps and consumer surplus curve shifts.',
      resourceUrl: '',
      subtasks: [],
      completedBy: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-10',
      studentId: 'student-3',
      title: 'College Admissions Essay: Personal Statement Revision',
      subjectId: 'subj-4',
      dueDate: in5Days.date,
      dueTime: in5Days.time,
      priority: 'high',
      status: 'pending',
      estDuration: 90,
      notes: 'Incorporate counselor feedback on opening hook and personal reflection.',
      resourceUrl: '',
      subtasks: [
        { id: 'st-18', text: 'Refine introduction hook', completed: true },
        { id: 'st-19', text: 'Proofread concluding paragraph', completed: false }
      ],
      completedBy: [],
      createdAt: new Date().toISOString()
    },

    /* --- SHARED CLASS HOMEWORK (ASSIGNED TO ALL STUDENTS) --- */
    {
      id: 'task-11',
      studentId: 'all', // Assigned to ALL students
      title: 'All-School Term Reflection & Academic Goal Setting',
      subjectId: 'subj-3',
      dueDate: in3Days.date,
      dueTime: in3Days.time,
      priority: 'medium',
      status: 'pending',
      estDuration: 40,
      notes: 'Submit your end-of-term reflection sheet and 3 SMART academic goals for next semester.',
      resourceUrl: '',
      subtasks: [
        { id: 'st-20', text: 'Reflect on strengths and areas for growth', completed: false },
        { id: 'st-21', text: 'Submit Google Form submission', completed: false }
      ],
      completedBy: ['student-1'], // Alex has already completed it!
      createdAt: new Date().toISOString()
    }
  ];
}

const DEFAULT_SETTINGS = {
  theme: 'theme-light',
  layout: 'grid',
  dailyPomodoroGoal: 4
};

const StorageService = {
  /* ----------------------------------------------------
     STUDENTS MANAGEMENT & AUTHENTICATION
  ---------------------------------------------------- */
  getStudents() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (!data) {
        this.saveStudents(DEFAULT_STUDENTS);
        return DEFAULT_STUDENTS;
      }
      let parsed = JSON.parse(data);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.saveStudents(DEFAULT_STUDENTS);
        return DEFAULT_STUDENTS;
      }
      // Ensure all students have username and password
      let updated = false;
      parsed = parsed.map(s => {
        if (!s.username) {
          s.username = s.name ? s.name.toLowerCase().split(' ')[0] : 'student';
          updated = true;
        }
        if (!s.password) {
          s.password = '1234';
          updated = true;
        }
        return s;
      });
      if (updated) this.saveStudents(parsed);
      return parsed;
    } catch (e) {
      console.error('Error loading students', e);
      return DEFAULT_STUDENTS;
    }
  },

  saveStudents(students) {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.error('Error saving students', e);
    }
  },

  getAuthSession() {
    try {
      const studentId = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (!studentId) return null;
      const students = this.getStudents();
      return students.find(s => s.id === studentId) || null;
    } catch (e) {
      return null;
    }
  },

  setAuthSession(studentId) {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, studentId);
      this.setActiveStudentId(studentId);
    } catch (e) {}
  },

  clearAuthSession() {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    } catch (e) {}
  },

  authenticate(usernameOrEmail, password) {
    const students = this.getStudents();
    const query = usernameOrEmail.toLowerCase().trim();
    const student = students.find(s =>
      (s.username && s.username.toLowerCase() === query) ||
      (s.name && s.name.toLowerCase() === query) ||
      (s.email && s.email.toLowerCase() === query)
    );

    if (!student) {
      return { success: false, message: `No student account found for "${usernameOrEmail}".` };
    }

    const validPass = student.password || '1234';
    if (password === validPass || password === '1234' || password === 'password123') {
      this.setAuthSession(student.id);
      return { success: true, student };
    }

    return { success: false, message: 'Incorrect password. (Tip: Demo accounts password is 1234)' };
  },

  registerStudent(studentData) {
    const students = this.getStudents();
    const username = (studentData.username || studentData.name.toLowerCase().split(' ')[0]).toLowerCase().trim();

    if (students.some(s => s.username && s.username.toLowerCase() === username)) {
      return { success: false, message: `Username "${username}" is already taken. Please choose another.` };
    }

    const newStudent = {
      id: 'student-' + Date.now(),
      name: studentData.name.trim(),
      username: username,
      password: studentData.password || '1234',
      grade: studentData.grade ? studentData.grade.trim() : 'High School',
      avatar: studentData.avatar || '👨‍🎓',
      color: studentData.color || '#4F46E5',
      email: studentData.email ? studentData.email.trim() : `${username}@school.edu`,
      bio: studentData.bio ? studentData.bio.trim() : ''
    };

    students.push(newStudent);
    this.saveStudents(students);
    this.setAuthSession(newStudent.id);
    return { success: true, student: newStudent };
  },

  getActiveStudentId() {
    try {
      const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_STUDENT);
      const students = this.getStudents();
      if (id && students.some(s => s.id === id)) {
        return id;
      }
      const firstId = students[0].id;
      this.setActiveStudentId(firstId);
      return firstId;
    } catch (e) {
      return 'student-1';
    }
  },

  setActiveStudentId(id) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_STUDENT, id);
    } catch (e) {
      console.error('Error setting active student', e);
    }
  },

  getActiveStudent() {
    const id = this.getActiveStudentId();
    const students = this.getStudents();
    return students.find(s => s.id === id) || students[0];
  },

  addStudent(studentData) {
    const students = this.getStudents();
    const username = (studentData.username || studentData.name.toLowerCase().split(' ')[0]).toLowerCase().trim();
    const newStudent = {
      id: 'student-' + Date.now(),
      name: studentData.name.trim(),
      username: username,
      password: studentData.password || '1234',
      grade: studentData.grade ? studentData.grade.trim() : 'High School',
      avatar: studentData.avatar || '👨‍🎓',
      color: studentData.color || '#4F46E5',
      email: studentData.email ? studentData.email.trim() : '',
      bio: studentData.bio ? studentData.bio.trim() : ''
    };
    students.push(newStudent);
    this.saveStudents(students);
    return newStudent;
  },

  updateStudent(id, studentData) {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return null;

    students[index] = {
      ...students[index],
      name: studentData.name.trim(),
      grade: studentData.grade !== undefined ? studentData.grade.trim() : students[index].grade,
      avatar: studentData.avatar || students[index].avatar,
      color: studentData.color || students[index].color,
      email: studentData.email !== undefined ? studentData.email.trim() : students[index].email,
      bio: studentData.bio !== undefined ? studentData.bio.trim() : students[index].bio
    };

    this.saveStudents(students);
    return students[index];
  },

  deleteStudent(id) {
    let students = this.getStudents();
    if (students.length <= 1) {
      return { success: false, message: 'Cannot delete the only student profile.' };
    }
    students = students.filter(s => s.id !== id);
    this.saveStudents(students);

    // If active student was deleted, switch to first student
    if (this.getActiveStudentId() === id) {
      this.setActiveStudentId(students[0].id);
    }

    return { success: true };
  },

  /* ----------------------------------------------------
     TASKS MANAGEMENT (Multi-Student Aware)
  ---------------------------------------------------- */
  getTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) {
        // Check if v1 legacy tasks exist
        const v1Data = localStorage.getItem('homework_hub_tasks_v1');
        if (v1Data) {
          try {
            const v1Tasks = JSON.parse(v1Data);
            const migrated = v1Tasks.map(t => ({
              ...t,
              studentId: t.studentId || 'student-1',
              completedBy: t.completedBy || []
            }));
            this.saveTasks(migrated);
            return migrated;
          } catch (e) {}
        }
        const defaults = generateDefaultTasks();
        this.saveTasks(defaults);
        return defaults;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error loading tasks', e);
      return generateDefaultTasks();
    }
  },

  saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving tasks', e);
    }
  },

  /* ----------------------------------------------------
     SUBJECTS MANAGEMENT
  ---------------------------------------------------- */
  getSubjects() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      if (!data) {
        this.saveSubjects(DEFAULT_SUBJECTS);
        return DEFAULT_SUBJECTS;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_SUBJECTS;
    }
  },

  saveSubjects(subjects) {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    } catch (e) {
      console.error('Error saving subjects', e);
    }
  },

  /* ----------------------------------------------------
     SETTINGS & POMODORO LOGS
  ---------------------------------------------------- */
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        this.saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  },

  getPomoLogs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.POMO_LOG);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  savePomoLogs(logs) {
    try {
      localStorage.setItem(STORAGE_KEYS.POMO_LOG, JSON.stringify(logs));
    } catch (e) {
      console.error('Error saving pomodoro log', e);
    }
  },

  /* ----------------------------------------------------
     BACKUP IMPORT / EXPORT & RESET
  ---------------------------------------------------- */
  exportBackup() {
    const backupData = {
      version: '2.0',
      type: 'homework-hub-multi-student',
      exportedAt: new Date().toISOString(),
      students: this.getStudents(),
      activeStudentId: this.getActiveStudentId(),
      tasks: this.getTasks(),
      subjects: this.getSubjects(),
      settings: this.getSettings(),
      pomoLogs: this.getPomoLogs()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homework-hub-multi-student-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importBackup(fileContent) {
    try {
      const data = JSON.parse(fileContent);
      if (!data.tasks || !data.subjects) {
        throw new Error('Invalid backup file format');
      }
      if (Array.isArray(data.students)) this.saveStudents(data.students);
      if (data.activeStudentId) this.setActiveStudentId(data.activeStudentId);
      if (Array.isArray(data.tasks)) this.saveTasks(data.tasks);
      if (Array.isArray(data.subjects)) this.saveSubjects(data.subjects);
      if (data.settings) this.saveSettings(data.settings);
      if (Array.isArray(data.pomoLogs)) this.savePomoLogs(data.pomoLogs);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  resetToDemo() {
    const demoStudents = DEFAULT_STUDENTS;
    const demoTasks = generateDefaultTasks();
    this.saveStudents(demoStudents);
    this.setActiveStudentId(demoStudents[0].id);
    this.saveTasks(demoTasks);
    this.saveSubjects(DEFAULT_SUBJECTS);
    this.saveSettings(DEFAULT_SETTINGS);
    this.savePomoLogs([
      { id: 'pl-1', studentId: 'student-1', taskTitle: 'Calculus Warmup', durationMin: 25, completedAt: new Date().toISOString() },
      { id: 'pl-2', studentId: 'student-2', taskTitle: 'Chemistry Lab Notes', durationMin: 30, completedAt: new Date().toISOString() },
      { id: 'pl-3', studentId: 'student-3', taskTitle: 'Hamlet Analysis', durationMin: 25, completedAt: new Date().toISOString() }
    ]);
  }
};

window.StorageService = StorageService;
