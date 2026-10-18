/**
 * Homework Hub - Core Tasks, Subjects & Multi-Student Management Logic
 */

const TaskManager = {
  tasks: [],
  subjects: [],
  students: [],
  activeStudentId: 'student-1',

  init() {
    this.students = StorageService.getStudents();
    this.activeStudentId = StorageService.getActiveStudentId();
    this.tasks = StorageService.getTasks();
    this.subjects = StorageService.getSubjects();
  },

  // Save changes
  persist() {
    StorageService.saveTasks(this.tasks);
    StorageService.saveSubjects(this.subjects);
    StorageService.saveStudents(this.students);
    StorageService.setActiveStudentId(this.activeStudentId);
  },

  /* ----------------------------------------------------
     STUDENTS MANAGEMENT
  ---------------------------------------------------- */
  getStudents() {
    return this.students;
  },

  getActiveStudent() {
    return this.students.find(s => s.id === this.activeStudentId) || this.students[0];
  },

  getStudentById(id) {
    if (id === 'all') {
      return { id: 'all', name: 'All Students (Class)', avatar: '👥', color: '#10B981', grade: 'Class-Wide' };
    }
    return this.students.find(s => s.id === id) || {
      id: 'unknown',
      name: 'Unassigned',
      avatar: '👤',
      color: '#64748B',
      grade: ''
    };
  },

  setActiveStudent(id) {
    if (this.students.some(s => s.id === id)) {
      this.activeStudentId = id;
      StorageService.setActiveStudentId(id);
      return true;
    }
    return false;
  },

  addStudent(data) {
    const newStudent = StorageService.addStudent(data);
    this.students = StorageService.getStudents();
    return newStudent;
  },

  updateStudent(id, data) {
    const updated = StorageService.updateStudent(id, data);
    this.students = StorageService.getStudents();
    return updated;
  },

  deleteStudent(id) {
    const res = StorageService.deleteStudent(id);
    if (res.success) {
      this.students = StorageService.getStudents();
      this.activeStudentId = StorageService.getActiveStudentId();
      // Unlink student from private tasks
      this.tasks = this.tasks.filter(t => t.studentId !== id);
      this.persist();
    }
    return res;
  },

  /* ----------------------------------------------------
     SUBJECT OPERATIONS
  ---------------------------------------------------- */
  getSubjectById(subjectId) {
    return this.subjects.find(s => s.id === subjectId) || {
      id: 'default',
      name: 'General',
      code: 'GEN',
      color: '#6366F1'
    };
  },

  addSubject(data) {
    const newSubject = {
      id: 'subj-' + Date.now(),
      name: data.name.trim(),
      code: data.code ? data.code.trim() : '',
      color: data.color || '#4F46E5'
    };
    this.subjects.push(newSubject);
    this.persist();
    return newSubject;
  },

  updateSubject(id, data) {
    const subj = this.subjects.find(s => s.id === id);
    if (!subj) return null;
    subj.name = data.name.trim();
    subj.code = data.code ? data.code.trim() : '';
    subj.color = data.color || subj.color;
    this.persist();
    return subj;
  },

  deleteSubject(id) {
    this.subjects = this.subjects.filter(s => s.id !== id);
    this.tasks.forEach(t => {
      if (t.subjectId === id) t.subjectId = '';
    });
    this.persist();
  },

  /* ----------------------------------------------------
     TASK OPERATIONS (Multi-Student Aware)
  ---------------------------------------------------- */
  getTaskById(id) {
    return this.tasks.find(t => t.id === id);
  },

  addTask(data) {
    const newTask = {
      id: 'task-' + Date.now(),
      studentId: data.studentId || this.activeStudentId, // Specific student or 'all'
      title: data.title.trim(),
      subjectId: data.subjectId || '',
      dueDate: data.dueDate,
      dueTime: data.dueTime || '23:59',
      priority: data.priority || 'medium',
      status: data.status || 'pending',
      estDuration: parseInt(data.estDuration, 10) || 45,
      notes: data.notes ? data.notes.trim() : '',
      resourceUrl: data.resourceUrl ? data.resourceUrl.trim() : '',
      subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
      completedBy: Array.isArray(data.completedBy) ? data.completedBy : [],
      createdAt: new Date().toISOString()
    };
    this.tasks.unshift(newTask);
    this.persist();
    return newTask;
  },

  updateTask(id, data) {
    const task = this.getTaskById(id);
    if (!task) return null;

    task.title = data.title.trim();
    if (data.studentId !== undefined) task.studentId = data.studentId;
    task.subjectId = data.subjectId || '';
    task.dueDate = data.dueDate;
    task.dueTime = data.dueTime || '23:59';
    task.priority = data.priority || 'medium';
    task.status = data.status || task.status;
    task.estDuration = parseInt(data.estDuration, 10) || task.estDuration;
    task.notes = data.notes !== undefined ? data.notes.trim() : task.notes;
    task.resourceUrl = data.resourceUrl !== undefined ? data.resourceUrl.trim() : task.resourceUrl;
    if (Array.isArray(data.subtasks)) {
      task.subtasks = data.subtasks;
    }
    this.persist();
    return task;
  },

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.persist();
  },

  isTaskCompleted(task, studentId = this.activeStudentId) {
    if (!task) return false;
    if (task.studentId === 'all') {
      return Array.isArray(task.completedBy) && task.completedBy.includes(studentId);
    }
    return task.status === 'completed';
  },

  getTaskStatusForStudent(task, studentId = this.activeStudentId) {
    if (!task) return 'pending';
    if (task.studentId === 'all') {
      return this.isTaskCompleted(task, studentId) ? 'completed' : (task.status || 'pending');
    }
    return task.status;
  },

  toggleTaskComplete(id, studentId = this.activeStudentId) {
    const task = this.getTaskById(id);
    if (!task) return null;

    if (task.studentId === 'all') {
      // Shared class homework
      if (!Array.isArray(task.completedBy)) task.completedBy = [];
      const index = task.completedBy.indexOf(studentId);
      if (index > -1) {
        task.completedBy.splice(index, 1);
      } else {
        task.completedBy.push(studentId);
        if (window.confettiManager) window.confettiManager.burst();
      }
    } else {
      // Individual student task
      if (task.status === 'completed') {
        task.status = 'pending';
      } else {
        task.status = 'completed';
        if (task.subtasks && task.subtasks.length > 0) {
          task.subtasks.forEach(st => st.completed = true);
        }
        if (window.confettiManager) window.confettiManager.burst();
      }
    }

    this.persist();
    return task;
  },

  updateTaskStatus(id, newStatus, studentId = this.activeStudentId) {
    const task = this.getTaskById(id);
    if (!task) return null;

    if (task.studentId === 'all') {
      if (!Array.isArray(task.completedBy)) task.completedBy = [];
      const hasCompleted = task.completedBy.includes(studentId);
      if (newStatus === 'completed' && !hasCompleted) {
        task.completedBy.push(studentId);
        if (window.confettiManager) window.confettiManager.burst();
      } else if (newStatus !== 'completed' && hasCompleted) {
        task.completedBy = task.completedBy.filter(s => s !== studentId);
      }
      task.status = newStatus;
    } else {
      task.status = newStatus;
      if (newStatus === 'completed' && window.confettiManager) {
        window.confettiManager.burst();
      }
    }

    this.persist();
    return task;
  },

  toggleSubtask(taskId, subtaskId, studentId = this.activeStudentId) {
    const task = this.getTaskById(taskId);
    if (!task || !task.subtasks) return null;
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return null;

    subtask.completed = !subtask.completed;

    const allDone = task.subtasks.every(st => st.completed);
    if (allDone && !this.isTaskCompleted(task, studentId)) {
      this.updateTaskStatus(taskId, 'completed', studentId);
    } else if (!allDone && this.isTaskCompleted(task, studentId)) {
      this.updateTaskStatus(taskId, 'in-progress', studentId);
    }

    this.persist();
    return task;
  },

  /* ----------------------------------------------------
     DATE, TIME & OVERDUE COMPUTATIONS
  ---------------------------------------------------- */
  getDueDateTime(task) {
    if (!task.dueDate) return null;
    const timeStr = task.dueTime || '23:59';
    return new Date(`${task.dueDate}T${timeStr}:00`);
  },

  isOverdue(task, studentId = this.activeStudentId) {
    if (this.isTaskCompleted(task, studentId)) return false;
    const due = this.getDueDateTime(task);
    if (!due) return false;
    return due.getTime() < Date.now();
  },

  isDueToday(task, studentId = this.activeStudentId) {
    if (!task.dueDate || this.isTaskCompleted(task, studentId)) return false;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return task.dueDate === todayStr;
  },

  isDueTomorrow(task, studentId = this.activeStudentId) {
    if (!task.dueDate || this.isTaskCompleted(task, studentId)) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    return task.dueDate === tomStr;
  },

  isDueThisWeek(task, studentId = this.activeStudentId) {
    if (!task.dueDate || this.isTaskCompleted(task, studentId)) return false;
    const due = this.getDueDateTime(task);
    if (!due) return false;
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    return due.getTime() >= now.getTime() && due.getTime() <= nextWeek.getTime();
  },

  formatDueBadge(task, studentId = this.activeStudentId) {
    const due = this.getDueDateTime(task);
    if (!due) return { label: 'No due date', className: 'normal-due', text: 'No due date' };

    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const datePart = due.toLocaleDateString(undefined, options);
    const timePart = due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

    if (this.isTaskCompleted(task, studentId)) {
      return {
        label: `Completed (${datePart})`,
        className: 'normal-due',
        text: `Completed`
      };
    }

    if (diffMs < 0) {
      const absDays = Math.abs(diffDays);
      const overdueText = absDays === 0 ? 'Overdue earlier today' : `Overdue by ${absDays} day${absDays > 1 ? 's' : ''}`;
      return {
        label: `${datePart} at ${timePart}`,
        className: 'overdue-due',
        text: `⚠️ ${overdueText}`
      };
    }

    if (this.isDueToday(task, studentId)) {
      if (diffHours <= 1) {
        return { label: `Today at ${timePart}`, className: 'urgent-due', text: `🔥 Due in <1 hr` };
      }
      return { label: `Today at ${timePart}`, className: 'urgent-due', text: `🔥 Due in ${diffHours} hrs` };
    }

    if (this.isDueTomorrow(task, studentId)) {
      return { label: `Tomorrow at ${timePart}`, className: 'warning-due', text: `⏳ Due tomorrow` };
    }

    if (diffDays <= 7) {
      return { label: `${datePart} at ${timePart}`, className: 'warning-due', text: `📅 In ${diffDays} days` };
    }

    return { label: `${datePart} at ${timePart}`, className: 'normal-due', text: datePart };
  },

  /* ----------------------------------------------------
     STATISTICS & METRICS (Student & Classroom)
  ---------------------------------------------------- */
  getMetrics(studentId = this.activeStudentId) {
    const studentTasks = this.tasks.filter(t => t.studentId === studentId || t.studentId === 'all');
    const total = studentTasks.length;
    const completed = studentTasks.filter(t => this.isTaskCompleted(t, studentId)).length;
    const active = total - completed;
    const overdue = studentTasks.filter(t => this.isOverdue(t, studentId)).length;
    const dueToday = studentTasks.filter(t => this.isDueToday(t, studentId)).length;
    const dueTomorrow = studentTasks.filter(t => this.isDueTomorrow(t, studentId)).length;
    const dueWeek = studentTasks.filter(t => this.isDueThisWeek(t, studentId)).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      active,
      overdue,
      dueToday,
      dueTomorrow,
      dueTodayAndTomorrow: dueToday + dueTomorrow,
      dueWeek,
      completionRate
    };
  },

  getClassMetrics() {
    const students = this.getStudents();
    const pomoLogs = StorageService.getPomoLogs();

    const studentLeaderboard = students.map(student => {
      const metrics = this.getMetrics(student.id);

      // Student focus minutes
      const studentPomo = pomoLogs.filter(p => !p.studentId || p.studentId === student.id);
      let focusMins = 0;
      studentPomo.forEach(p => focusMins += (p.durationMin || 25));

      return {
        student,
        metrics,
        focusMins
      };
    });

    // Sort leaderboard by completed tasks descending, then completion rate
    studentLeaderboard.sort((a, b) => {
      if (b.metrics.completed !== a.metrics.completed) {
        return b.metrics.completed - a.metrics.completed;
      }
      return b.metrics.completionRate - a.metrics.completionRate;
    });

    const totalStudents = students.length;
    const totalAssignments = this.tasks.length;
    const totalCompletedAcrossAll = studentLeaderboard.reduce((acc, curr) => acc + curr.metrics.completed, 0);
    const avgCompletionRate = totalStudents > 0
      ? Math.round(studentLeaderboard.reduce((acc, curr) => acc + curr.metrics.completionRate, 0) / totalStudents)
      : 0;

    return {
      totalStudents,
      totalAssignments,
      totalCompletedAcrossAll,
      avgCompletionRate,
      studentLeaderboard
    };
  },

  /* ----------------------------------------------------
     FILTERING & SORTING ENGINE (Multi-Student Scoped)
  ---------------------------------------------------- */
  getFilteredTasks(filters = {}, studentId = this.activeStudentId) {
    const {
      search = '',
      status = 'all',
      subject = 'all',
      priority = 'all',
      sortBy = 'dueDateAsc'
    } = filters;

    const searchLower = search.toLowerCase().trim();

    return this.tasks.filter(task => {
      // Must belong to this student OR be a shared class task
      if (task.studentId !== studentId && task.studentId !== 'all') {
        return false;
      }

      const isCompleted = this.isTaskCompleted(task, studentId);
      const taskStatus = this.getTaskStatusForStudent(task, studentId);

      // Search filter
      if (searchLower) {
        const titleMatch = task.title.toLowerCase().includes(searchLower);
        const notesMatch = task.notes && task.notes.toLowerCase().includes(searchLower);
        const subj = this.getSubjectById(task.subjectId);
        const subjMatch = subj.name.toLowerCase().includes(searchLower) || (subj.code && subj.code.toLowerCase().includes(searchLower));
        if (!titleMatch && !notesMatch && !subjMatch) return false;
      }

      // Status filter
      if (status === 'pending') {
        if (isCompleted) return false;
      } else if (status === 'in-progress') {
        if (taskStatus !== 'in-progress') return false;
      } else if (status === 'completed') {
        if (!isCompleted) return false;
      } else if (status === 'overdue') {
        if (!this.isOverdue(task, studentId)) return false;
      } else if (status === 'today') {
        if (!this.isDueToday(task, studentId)) return false;
      } else if (status === 'week') {
        if (!this.isDueThisWeek(task, studentId)) return false;
      }

      // Subject filter
      if (subject !== 'all' && task.subjectId !== subject) {
        return false;
      }

      // Priority filter
      if (priority !== 'all' && task.priority !== priority) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'dueDateAsc') {
        const da = this.getDueDateTime(a) ? this.getDueDateTime(a).getTime() : Infinity;
        const db = this.getDueDateTime(b) ? this.getDueDateTime(b).getTime() : Infinity;
        return da - db;
      } else if (sortBy === 'dueDateDesc') {
        const da = this.getDueDateTime(a) ? this.getDueDateTime(a).getTime() : 0;
        const db = this.getDueDateTime(b) ? this.getDueDateTime(b).getTime() : 0;
        return db - da;
      } else if (sortBy === 'priorityDesc') {
        const weights = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (weights[b.priority] || 0) - (weights[a.priority] || 0);
      } else if (sortBy === 'titleAsc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }
};

window.TaskManager = TaskManager;
