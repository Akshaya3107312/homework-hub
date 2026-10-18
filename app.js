/**
 * Homework Hub - Multi-Student Application Orchestrator
 */

class HomeworkHubApp {
  constructor() {
    this.currentView = 'dashboard';
    this.currentFilters = {
      search: '',
      status: 'all',
      subject: 'all',
      priority: 'all',
      sortBy: 'dueDateAsc'
    };
    this.layout = 'grid'; // 'grid' | 'compact'
    this.modalSubtasks = []; // temporary subtasks for assignment modal
  }

  init() {
    // 1. Initialize data
    TaskManager.init();
    ToastService.init();

    // 2. Load settings
    const settings = StorageService.getSettings();
    this.applyTheme(settings.theme || 'theme-light');
    this.layout = settings.layout || 'grid';

    // 3. Bind authentication front page events
    this.bindAuthEvents();

    // 4. Initialize sub-controllers
    if (window.KanbanController) window.KanbanController.init();
    if (window.CalendarController) window.CalendarController.init();
    if (window.PomodoroController) window.PomodoroController.init();

    // 5. Bind event listeners
    this.bindNavigation();
    this.bindToolbars();
    this.bindModals();
    this.bindStudentSwitcher();
    this.bindShortcuts();
    this.bindSettingsAndDropdowns();

    // 6. Check Authentication Session (Front Page Gate)
    const currentSession = StorageService.getAuthSession();
    if (currentSession) {
      TaskManager.setActiveStudent(currentSession.id);
      this.hideAuthScreen();
      this.updateActiveStudentUI();
      this.renderAll();
    } else {
      this.showAuthScreen();
    }
  }

  /* ----------------------------------------------------
     FRONT PAGE: AUTHENTICATION / LOGIN & SIGN UP
  ---------------------------------------------------- */
  showAuthScreen() {
    const authScreen = document.getElementById('authScreen');
    const appLayout = document.getElementById('appLayout');
    if (authScreen) {
      authScreen.classList.remove('hidden');
      authScreen.style.display = 'flex';
    }
    if (appLayout) {
      appLayout.style.display = 'none';
    }
    const usernameInput = document.getElementById('loginUsername');
    if (usernameInput) setTimeout(() => usernameInput.focus(), 100);
  }

  hideAuthScreen() {
    const authScreen = document.getElementById('authScreen');
    const appLayout = document.getElementById('appLayout');
    if (authScreen) {
      authScreen.classList.add('hidden');
      authScreen.style.display = 'none';
    }
    if (appLayout) {
      appLayout.style.display = 'flex';
    }
  }

  bindAuthEvents() {
    // Tab switching: Sign In vs Register
    const tabSignInBtn = document.getElementById('tabSignInBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');
    const formSignIn = document.getElementById('formSignIn');
    const formRegister = document.getElementById('formRegister');
    const loginError = document.getElementById('loginErrorBanner');
    const regError = document.getElementById('registerErrorBanner');

    if (tabSignInBtn && tabRegisterBtn && formSignIn && formRegister) {
      tabSignInBtn.addEventListener('click', () => {
        tabSignInBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        formSignIn.style.display = 'block';
        formRegister.style.display = 'none';
        if (loginError) loginError.style.display = 'none';
      });

      tabRegisterBtn.addEventListener('click', () => {
        tabRegisterBtn.classList.add('active');
        tabSignInBtn.classList.remove('active');
        formRegister.style.display = 'block';
        formSignIn.style.display = 'none';
        if (regError) regError.style.display = 'none';
      });
    }

    // Password Eye Toggles
    const btnToggleLoginPwd = document.getElementById('btnToggleLoginPwd');
    const loginPassword = document.getElementById('loginPassword');
    if (btnToggleLoginPwd && loginPassword) {
      btnToggleLoginPwd.addEventListener('click', () => {
        const isPwd = loginPassword.type === 'password';
        loginPassword.type = isPwd ? 'text' : 'password';
        btnToggleLoginPwd.textContent = isPwd ? '🙈' : '👁️';
      });
    }

    const btnToggleRegPwd = document.getElementById('btnToggleRegPwd');
    const regPassword = document.getElementById('regPassword');
    if (btnToggleRegPwd && regPassword) {
      btnToggleRegPwd.addEventListener('click', () => {
        const isPwd = regPassword.type === 'password';
        regPassword.type = isPwd ? 'text' : 'password';
        btnToggleRegPwd.textContent = isPwd ? '🙈' : '👁️';
      });
    }

    // Demo Quick Login Chips
    const demoChips = document.querySelectorAll('.demo-chip');
    demoChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const user = chip.getAttribute('data-user');
        const pass = chip.getAttribute('data-pass');
        const userInput = document.getElementById('loginUsername');
        const passInput = document.getElementById('loginPassword');

        if (userInput) userInput.value = user;
        if (passInput) passInput.value = pass;

        this.handleLogin(user, pass);
      });
    });

    // Form Sign In Submit
    if (formSignIn) {
      formSignIn.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        this.handleLogin(username, password);
      });
    }

    // Form Register Submit
    if (formRegister) {
      formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('regFullName').value.trim();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const grade = document.getElementById('regGrade').value.trim();
        const avatar = document.getElementById('regAvatar').value;
        const email = document.getElementById('regEmail').value.trim();

        if (!name || !username || !password) {
          this.showAuthError('registerErrorBanner', 'Please fill in all required fields.');
          return;
        }

        const res = StorageService.registerStudent({
          name,
          username,
          password,
          grade,
          avatar,
          email
        });

        if (res.success) {
          TaskManager.init();
          this.hideAuthScreen();
          this.updateActiveStudentUI();
          this.renderAll();
          ToastService.success(`Welcome to Homework Hub, ${res.student.name}! 🎓`);
          if (window.confettiManager) window.confettiManager.burst();
        } else {
          this.showAuthError('registerErrorBanner', res.message);
        }
      });
    }

    // Log Out Buttons
    const btnLogoutNav = document.getElementById('btnLogoutNav');
    const btnLogoutSidebar = document.getElementById('btnLogoutSidebar');

    const doLogout = () => {
      StorageService.clearAuthSession();
      ToastService.info('Signed out. See you next study session! 👋');
      this.showAuthScreen();
    };

    if (btnLogoutNav) btnLogoutNav.addEventListener('click', doLogout);
    if (btnLogoutSidebar) btnLogoutSidebar.addEventListener('click', doLogout);
  }

  handleLogin(username, password) {
    if (!username || !password) {
      this.showAuthError('loginErrorBanner', 'Please enter your username and password.');
      return;
    }

    const res = StorageService.authenticate(username, password);
    if (res.success) {
      TaskManager.setActiveStudent(res.student.id);
      this.hideAuthScreen();
      this.updateActiveStudentUI();
      this.renderAll();
      ToastService.success(`Welcome back, ${res.student.name}! 🎓`);
      if (window.confettiManager) window.confettiManager.burst();
    } else {
      this.showAuthError('loginErrorBanner', res.message);
    }
  }

  showAuthError(bannerId, message) {
    const banner = document.getElementById(bannerId);
    if (banner) {
      banner.textContent = message;
      banner.style.display = 'block';
    }
  }

  /* ----------------------------------------------------
     THEME & SETTINGS
  ---------------------------------------------------- */
  applyTheme(themeName) {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(themeName);
    const settings = StorageService.getSettings();
    settings.theme = themeName;
    StorageService.saveSettings(settings);
  }

  toggleTheme() {
    const isDark = document.body.classList.contains('theme-dark');
    const newTheme = isDark ? 'theme-light' : 'theme-dark';
    this.applyTheme(newTheme);
    ToastService.info(`Switched to ${newTheme === 'theme-dark' ? 'Dark' : 'Light'} theme`);
  }

  /* ----------------------------------------------------
     MULTI-STUDENT STATE & SWITCHER
  ---------------------------------------------------- */
  updateActiveStudentUI() {
    const student = TaskManager.getActiveStudent();
    if (!student) return;

    // Greeting banner
    const greetingName = document.getElementById('studentGreetingName');
    if (greetingName) greetingName.textContent = student.name;

    // Sidebar student card
    const avatar = document.getElementById('userAvatar');
    const nameDisplay = document.getElementById('userNameDisplay');
    const gradeDisplay = document.getElementById('userGradeDisplay');

    if (avatar) avatar.textContent = student.avatar || '👨‍🎓';
    if (nameDisplay) nameDisplay.textContent = student.name;
    if (gradeDisplay) gradeDisplay.textContent = student.grade || 'Student';

    // Navbar student switcher pill
    const navAvatar = document.getElementById('navStudentAvatar');
    const navName = document.getElementById('navStudentName');

    if (navAvatar) navAvatar.textContent = student.avatar || '👨‍🎓';
    if (navName) navName.textContent = student.name;

    // Re-render student switcher dropdown list
    this.renderStudentDropdownList();
  }

  switchStudent(studentId) {
    const success = TaskManager.setActiveStudent(studentId);
    if (success) {
      const student = TaskManager.getActiveStudent();
      this.updateActiveStudentUI();
      ToastService.success(`Switched active student to ${student.name} ${student.avatar}`);
      this.renderAll();

      // If dropdown is open, close it
      const menu = document.getElementById('studentDropdownMenu');
      if (menu) menu.classList.remove('show');
    }
  }

  renderStudentDropdownList() {
    const list = document.getElementById('studentDropdownList');
    if (!list) return;

    list.innerHTML = '';
    const students = TaskManager.getStudents();
    const activeId = TaskManager.activeStudentId;

    students.forEach(s => {
      const btn = document.createElement('button');
      btn.className = `student-dropdown-item ${s.id === activeId ? 'active' : ''}`;
      btn.innerHTML = `
        <span class="student-dropdown-avatar">${s.avatar || '👨‍🎓'}</span>
        <div class="student-dropdown-meta">
          <span class="student-dropdown-name">${escapeHtml(s.name)}</span>
          <span class="student-dropdown-grade">${escapeHtml(s.grade || '')}</span>
        </div>
        ${s.id === activeId ? '<span class="text-sm" style="color:var(--primary); font-weight:800;">✓</span>' : ''}
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.switchStudent(s.id);
      });
      list.appendChild(btn);
    });
  }

  bindStudentSwitcher() {
    // Navbar pill click
    const btnNavSwitcher = document.getElementById('btnStudentSwitcherNav');
    const menu = document.getElementById('studentDropdownMenu');

    if (btnNavSwitcher && menu) {
      btnNavSwitcher.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
      });

      document.addEventListener('click', () => {
        menu.classList.remove('show');
      });
    }

    // "Manage / Add Students" button in dropdown
    const btnManage = document.getElementById('btnManageStudentsModal');
    if (btnManage) {
      btnManage.addEventListener('click', () => {
        if (menu) menu.classList.remove('show');
        this.openManageStudentModal();
      });
    }

    // Sidebar switch button
    const btnSwitchSidebar = document.getElementById('btnSwitchUserSidebar');
    if (btnSwitchSidebar) {
      btnSwitchSidebar.addEventListener('click', () => {
        this.switchView('roster');
      });
    }

    // Hero banner switch button
    const btnSwitchHero = document.getElementById('btnQuickSwitchStudentHero');
    if (btnSwitchHero) {
      btnSwitchHero.addEventListener('click', () => {
        this.switchView('roster');
      });
    }

    // Roster view action buttons
    const btnRosterAdd = document.getElementById('btnRosterAddStudent');
    if (btnRosterAdd) {
      btnRosterAdd.addEventListener('click', () => {
        this.openManageStudentModal();
      });
    }

    const btnBroadcast = document.getElementById('btnBroadcastHomework');
    if (btnBroadcast) {
      btnBroadcast.addEventListener('click', () => {
        this.openAssignmentModal(null, { studentId: 'all' });
      });
    }

    // Student Manager Modal close & form submit
    const btnCloseManage = document.getElementById('btnCloseManageStudentModal');
    const btnCancelManage = document.getElementById('btnCancelManageStudentModal');
    const studentForm = document.getElementById('studentManageForm');

    if (btnCloseManage) btnCloseManage.addEventListener('click', () => this.closeManageStudentModal());
    if (btnCancelManage) btnCancelManage.addEventListener('click', () => this.closeManageStudentModal());
    if (studentForm) {
      studentForm.addEventListener('submit', (e) => this.handleStudentManageFormSubmit(e));
    }

    // Student color swatches
    const colorSwatches = document.querySelectorAll('#studentColorPalette .color-swatch');
    colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        colorSwatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        const colorInput = document.getElementById('studentSelectedColor');
        if (colorInput) colorInput.value = swatch.getAttribute('data-color');
      });
    });
  }

  /* ----------------------------------------------------
     STUDENT MANAGER MODAL
  ---------------------------------------------------- */
  openManageStudentModal(studentId = null) {
    const modal = document.getElementById('manageStudentModal');
    const form = document.getElementById('studentManageForm');
    const titleEl = document.getElementById('manageStudentModalTitle');
    if (!modal || !form) return;

    form.reset();
    document.querySelectorAll('#manageStudentModal .form-group').forEach(fg => fg.classList.remove('has-error'));

    const nameInput = document.getElementById('studentNewNameInput');
    const gradeInput = document.getElementById('studentNewGradeInput');
    const avatarInput = document.getElementById('studentAvatarEmojiInput');
    const emailInput = document.getElementById('studentEmailInput');
    const bioInput = document.getElementById('studentBioInput');
    const colorInput = document.getElementById('studentSelectedColor');
    const editIdInput = document.getElementById('studentEditId');

    if (studentId) {
      const student = TaskManager.getStudentById(studentId);
      if (student) {
        titleEl.textContent = 'Edit Student Profile';
        editIdInput.value = student.id;
        nameInput.value = student.name;
        gradeInput.value = student.grade || '';
        avatarInput.value = student.avatar || '👨‍🎓';
        emailInput.value = student.email || '';
        bioInput.value = student.bio || '';
        colorInput.value = student.color || '#4F46E5';
        this.selectStudentColorSwatch(student.color);
      }
    } else {
      titleEl.textContent = 'Add Student Profile';
      editIdInput.value = '';
      avatarInput.value = '👨‍🎓';
      colorInput.value = '#4F46E5';
      this.selectStudentColorSwatch('#4F46E5');
    }

    modal.classList.add('show');
    nameInput.focus();
  }

  selectStudentColorSwatch(color) {
    const swatches = document.querySelectorAll('#studentColorPalette .color-swatch');
    swatches.forEach(s => {
      s.classList.toggle('active', s.getAttribute('data-color') === color);
    });
  }

  closeManageStudentModal() {
    const modal = document.getElementById('manageStudentModal');
    if (modal) modal.classList.remove('show');
  }

  handleStudentManageFormSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('studentNewNameInput');
    const name = nameInput.value.trim();

    if (!name) {
      nameInput.closest('.form-group').classList.add('has-error');
      nameInput.focus();
      return;
    }

    const editId = document.getElementById('studentEditId').value;
    const studentData = {
      name,
      grade: document.getElementById('studentNewGradeInput').value,
      avatar: document.getElementById('studentAvatarEmojiInput').value,
      email: document.getElementById('studentEmailInput').value,
      bio: document.getElementById('studentBioInput').value,
      color: document.getElementById('studentSelectedColor').value
    };

    if (editId) {
      TaskManager.updateStudent(editId, studentData);
      ToastService.success(`Updated profile for ${name}!`);
    } else {
      const newStudent = TaskManager.addStudent(studentData);
      // Auto-switch to new student
      this.switchStudent(newStudent.id);
      ToastService.success(`New student "${name}" added! 🎒`);
    }

    this.closeManageStudentModal();
    this.updateActiveStudentUI();
    this.renderAll();
  }

  /* ----------------------------------------------------
     NAVIGATION & VIEWS
  ---------------------------------------------------- */
  bindNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link[data-view]');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        const view = link.getAttribute('data-view');
        this.switchView(view);
        this.closeMobileSidebar();
      });
    });

    const filterNavItems = document.querySelectorAll('.filter-nav-item');
    filterNavItems.forEach(item => {
      item.addEventListener('click', () => {
        const filterType = item.getAttribute('data-filter');
        this.switchView('dashboard');
        this.setFilterStatus(filterType);
        this.closeMobileSidebar();
      });
    });

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const sidebar = document.getElementById('sidebar');

    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('show');
      });
    }

    if (sidebarCloseBtn && sidebar) {
      sidebarCloseBtn.addEventListener('click', () => {
        sidebar.classList.remove('show');
      });
    }

    const navFocusPill = document.getElementById('navFocusPill');
    if (navFocusPill) {
      navFocusPill.addEventListener('click', () => {
        this.switchView('pomodoro');
      });
    }
  }

  closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth <= 768) {
      sidebar.classList.remove('show');
    }
  }

  switchView(viewName) {
    this.currentView = viewName;

    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link[data-view]');
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === viewName);
    });

    const panels = document.querySelectorAll('.view-panel');
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `view-${viewName}`);
    });

    if (viewName === 'kanban' && window.KanbanController) {
      window.KanbanController.render();
    } else if (viewName === 'calendar' && window.CalendarController) {
      window.CalendarController.render();
    } else if (viewName === 'subjects') {
      this.renderSubjectsView();
    } else if (viewName === 'pomodoro' && window.PomodoroController) {
      window.PomodoroController.populateTaskSelect();
      window.PomodoroController.renderHistory();
    } else if (viewName === 'roster') {
      this.renderRosterView();
    } else {
      this.renderTasksList();
    }
  }

  setFilterStatus(status) {
    this.currentFilters.status = status;

    const statusTabs = document.querySelectorAll('#filterStatusTabs .filter-tab');
    statusTabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-status') === status);
    });

    this.renderTasksList();
  }

  /* ----------------------------------------------------
     CLASS ROSTER & MULTI-STUDENT HUB VIEW
  ---------------------------------------------------- */
  renderRosterView() {
    const classMetrics = TaskManager.getClassMetrics();

    // Metric stat cards
    const totalStudentsEl = document.getElementById('rosterTotalStudents');
    const avgCompletionEl = document.getElementById('rosterAvgCompletion');
    const totalAssignmentsEl = document.getElementById('rosterTotalAssignments');
    const totalFocusHoursEl = document.getElementById('rosterTotalFocusHours');

    if (totalStudentsEl) totalStudentsEl.textContent = classMetrics.totalStudents;
    if (avgCompletionEl) avgCompletionEl.textContent = `${classMetrics.avgCompletionRate}%`;
    if (totalAssignmentsEl) totalAssignmentsEl.textContent = classMetrics.totalAssignments;

    // Total study hours
    let totalFocusMinsAll = 0;
    classMetrics.studentLeaderboard.forEach(item => totalFocusMinsAll += item.focusMins);
    const focusHours = (totalFocusMinsAll / 60).toFixed(1);
    if (totalFocusHoursEl) totalFocusHoursEl.textContent = `${focusHours}h`;

    // 1. Roster Cards Grid
    const cardsGrid = document.getElementById('rosterStudentsGrid');
    if (cardsGrid) {
      cardsGrid.innerHTML = '';
      const activeId = TaskManager.activeStudentId;

      classMetrics.studentLeaderboard.forEach(item => {
        const student = item.student;
        const metrics = item.metrics;
        const isActive = student.id === activeId;

        const card = document.createElement('div');
        card.className = `roster-card ${isActive ? 'is-active-student' : ''}`;

        const activeBadge = isActive ? `<span class="active-student-badge">Active Student</span>` : '';

        card.innerHTML = `
          ${activeBadge}
          <div class="roster-card-header">
            <div class="roster-avatar-wrap" style="border-color:${student.color};">
              ${student.avatar || '👨‍🎓'}
            </div>
            <div>
              <h4 class="roster-meta-name">${escapeHtml(student.name)}</h4>
              <div class="roster-meta-grade">${escapeHtml(student.grade || 'Student')} &bull; ${escapeHtml(student.email || 'No email')}</div>
            </div>
          </div>

          ${student.bio ? `<div style="font-size:0.8rem; color:var(--text-secondary); font-style:italic;">"${escapeHtml(student.bio)}"</div>` : ''}

          <div class="roster-stats-row">
            <div>
              <span class="roster-stat-val" style="color:var(--primary);">${metrics.active}</span>
              <span class="roster-stat-lbl">Active</span>
            </div>
            <div>
              <span class="roster-stat-val text-success">${metrics.completed}</span>
              <span class="roster-stat-lbl">Done</span>
            </div>
            <div>
              <span class="roster-stat-val ${metrics.overdue > 0 ? 'text-danger' : ''}">${metrics.overdue}</span>
              <span class="roster-stat-lbl">Overdue</span>
            </div>
          </div>

          <div class="subject-progress-wrap">
            <div class="subject-progress-labels">
              <span>Homework Completion</span>
              <span style="color: ${student.color}; font-weight:700;">${metrics.completionRate}%</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: ${metrics.completionRate}%; background-color: ${student.color};"></div>
            </div>
          </div>

          <div class="roster-card-actions">
            ${!isActive ? `<button class="btn btn-primary btn-sm" data-action="switch" data-id="${student.id}">⇄ Switch to Profile</button>` : `<button class="btn btn-outline btn-sm" disabled style="opacity:0.7;">Currently Active</button>`}
            <button class="btn btn-outline btn-sm" data-action="edit" data-id="${student.id}">✎ Edit</button>
            ${classMetrics.totalStudents > 1 ? `<button class="icon-btn text-danger" data-action="delete" data-id="${student.id}" title="Remove Student">&times;</button>` : ''}
          </div>
        `;

        // Switch to student action
        const switchBtn = card.querySelector('[data-action="switch"]');
        if (switchBtn) {
          switchBtn.addEventListener('click', () => {
            this.switchStudent(student.id);
            this.switchView('dashboard');
          });
        }

        // Edit profile action
        const editBtn = card.querySelector('[data-action="edit"]');
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            this.openManageStudentModal(student.id);
          });
        }

        // Delete action
        const deleteBtn = card.querySelector('[data-action="delete"]');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {
            if (confirm(`Remove student "${student.name}" and their private tasks?`)) {
              const res = TaskManager.deleteStudent(student.id);
              if (res.success) {
                this.updateActiveStudentUI();
                this.renderAll();
                ToastService.info(`Removed student ${student.name}`);
              } else {
                ToastService.error(res.message);
              }
            }
          });
        }

        cardsGrid.appendChild(card);
      });
    }

    // 2. Leaderboard Table
    const tbody = document.getElementById('rosterLeaderboardBody');
    if (tbody) {
      tbody.innerHTML = '';

      classMetrics.studentLeaderboard.forEach((item, index) => {
        const student = item.student;
        const metrics = item.metrics;
        const tr = document.createElement('tr');

        let rankHtml = `<span class="rank-badge">${index + 1}</span>`;
        if (index === 0) rankHtml = `<span class="rank-badge rank-gold">🥇 1</span>`;
        else if (index === 1) rankHtml = `<span class="rank-badge rank-silver">🥈 2</span>`;
        else if (index === 2) rankHtml = `<span class="rank-badge rank-bronze">🥉 3</span>`;

        tr.innerHTML = `
          <td>${rankHtml}</td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.3rem;">${student.avatar || '👨‍🎓'}</span>
              <div>
                <strong>${escapeHtml(student.name)}</strong>
                ${student.id === TaskManager.activeStudentId ? '<span class="filter-tag" style="padding:1px 6px; font-size:0.68rem; margin-left:4px;">You</span>' : ''}
              </div>
            </div>
          </td>
          <td>${escapeHtml(student.grade || 'N/A')}</td>
          <td><strong class="text-success">${metrics.completed}</strong> / ${metrics.total}</td>
          <td>${item.focusMins} mins</td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <div class="progress-bar-container" style="width:70px; height:6px;">
                <div class="progress-bar-fill" style="width:${metrics.completionRate}%; background-color:${student.color};"></div>
              </div>
              <span style="font-weight:700; font-size:0.75rem;">${metrics.completionRate}%</span>
            </div>
          </td>
          <td>
            <button class="btn btn-outline btn-sm" data-action="switch-row" data-id="${student.id}">
              ${student.id === TaskManager.activeStudentId ? 'Active' : 'Switch'}
            </button>
          </td>
        `;

        tr.querySelector('[data-action="switch-row"]').addEventListener('click', () => {
          if (student.id !== TaskManager.activeStudentId) {
            this.switchStudent(student.id);
            this.switchView('dashboard');
          }
        });

        tbody.appendChild(tr);
      });
    }
  }

  /* ----------------------------------------------------
     TOOLBARS, SEARCH & FILTERS
  ---------------------------------------------------- */
  bindToolbars() {
    const searchInput = document.getElementById('globalSearchInput');
    const searchClear = document.getElementById('searchClearBtn');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentFilters.search = e.target.value;
        if (searchClear) searchClear.style.display = e.target.value ? 'block' : 'none';
        this.renderTasksList();
      });
    }

    if (searchClear && searchInput) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        this.currentFilters.search = '';
        searchClear.style.display = 'none';
        this.renderTasksList();
      });
    }

    const statusTabs = document.querySelectorAll('#filterStatusTabs .filter-tab');
    statusTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        statusTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentFilters.status = tab.getAttribute('data-status');
        this.renderTasksList();
      });
    });

    const subjSelect = document.getElementById('filterSubjectSelect');
    if (subjSelect) {
      subjSelect.addEventListener('change', (e) => {
        this.currentFilters.subject = e.target.value;
        this.renderTasksList();
      });
    }

    const prioritySelect = document.getElementById('filterPrioritySelect');
    if (prioritySelect) {
      prioritySelect.addEventListener('change', (e) => {
        this.currentFilters.priority = e.target.value;
        this.renderTasksList();
      });
    }

    const sortSelect = document.getElementById('sortTasksSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentFilters.sortBy = e.target.value;
        this.renderTasksList();
      });
    }

    const layoutBtns = document.querySelectorAll('#layoutToggle .layout-btn');
    layoutBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        layoutBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.layout = btn.getAttribute('data-layout');

        const container = document.getElementById('tasksContainer');
        if (container) {
          container.className = `tasks-container layout-${this.layout}`;
        }

        const settings = StorageService.getSettings();
        settings.layout = this.layout;
        StorageService.saveSettings(settings);
      });
    });

    const btnClearAll = document.getElementById('btnClearAllFilters');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }
  }

  clearAllFilters() {
    this.currentFilters = {
      search: '',
      status: 'all',
      subject: 'all',
      priority: 'all',
      sortBy: 'dueDateAsc'
    };

    const searchInput = document.getElementById('globalSearchInput');
    const searchClear = document.getElementById('searchClearBtn');
    if (searchInput) searchInput.value = '';
    if (searchClear) searchClear.style.display = 'none';

    const statusTabs = document.querySelectorAll('#filterStatusTabs .filter-tab');
    statusTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-status') === 'all'));

    const subjSelect = document.getElementById('filterSubjectSelect');
    if (subjSelect) subjSelect.value = 'all';

    const prioSelect = document.getElementById('filterPrioritySelect');
    if (prioSelect) prioSelect.value = 'all';

    const sortSelect = document.getElementById('sortTasksSelect');
    if (sortSelect) sortSelect.value = 'dueDateAsc';

    this.renderTasksList();
  }

  /* ----------------------------------------------------
     MODAL CONTROLS & BINDINGS
  ---------------------------------------------------- */
  bindModals() {
    const triggerIds = ['btnQuickAddTask', 'btnBannerAddTask', 'btnHeaderAddTask', 'btnKanbanAddTask', 'btnEmptyAddTask'];
    triggerIds.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => this.openAssignmentModal());
      }
    });

    const btnCloseAssignment = document.getElementById('btnCloseAssignmentModal');
    const btnCancelAssignment = document.getElementById('btnCancelAssignmentModal');
    if (btnCloseAssignment) btnCloseAssignment.addEventListener('click', () => this.closeAssignmentModal());
    if (btnCancelAssignment) btnCancelAssignment.addEventListener('click', () => this.closeAssignmentModal());

    const assignmentForm = document.getElementById('assignmentForm');
    if (assignmentForm) {
      assignmentForm.addEventListener('submit', (e) => this.handleAssignmentFormSubmit(e));
    }

    const btnAddSubtask = document.getElementById('btnAddSubtaskItem');
    const subtaskInput = document.getElementById('subtaskNewInput');
    if (btnAddSubtask && subtaskInput) {
      const addSub = () => {
        const val = subtaskInput.value.trim();
        if (val) {
          this.modalSubtasks.push({ id: 'st-' + Date.now(), text: val, completed: false });
          subtaskInput.value = '';
          this.renderModalSubtasks();
        }
      };
      btnAddSubtask.addEventListener('click', addSub);
      subtaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addSub();
        }
      });
    }

    const btnQuickAddSubject = document.getElementById('btnQuickAddSubject');
    if (btnQuickAddSubject) {
      btnQuickAddSubject.addEventListener('click', () => {
        this.openSubjectModal();
      });
    }

    const btnAddSubject = document.getElementById('btnAddSubjectBtn');
    if (btnAddSubject) {
      btnAddSubject.addEventListener('click', () => this.openSubjectModal());
    }

    const btnCloseSubject = document.getElementById('btnCloseSubjectModal');
    const btnCancelSubject = document.getElementById('btnCancelSubjectModal');
    if (btnCloseSubject) btnCloseSubject.addEventListener('click', () => this.closeSubjectModal());
    if (btnCancelSubject) btnCancelSubject.addEventListener('click', () => this.closeSubjectModal());

    const subjectForm = document.getElementById('subjectForm');
    if (subjectForm) {
      subjectForm.addEventListener('submit', (e) => this.handleSubjectFormSubmit(e));
    }

    const colorSwatches = document.querySelectorAll('#subjectColorPalette .color-swatch');
    colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        colorSwatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        const colorInput = document.getElementById('subjectSelectedColor');
        if (colorInput) colorInput.value = swatch.getAttribute('data-color');
      });
    });
  }

  /* ----------------------------------------------------
     SETTINGS & DATA DROPDOWN
  ---------------------------------------------------- */
  bindSettingsAndDropdowns() {
    const btnMenu = document.getElementById('btnSettingsMenu');
    const dropdown = document.getElementById('settingsDropdown');
    const themeBtn = document.getElementById('themeToggleBtn');

    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    if (btnMenu && dropdown) {
      btnMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });

      document.addEventListener('click', () => {
        dropdown.classList.remove('show');
      });
    }

    const btnExport = document.getElementById('btnExportData');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        StorageService.exportBackup();
        ToastService.success('Multi-student backup exported! 💾');
      });
    }

    const fileInput = document.getElementById('importFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const result = StorageService.importBackup(event.target.result);
          if (result.success) {
            TaskManager.init();
            this.updateActiveStudentUI();
            this.renderAll();
            ToastService.success('Multi-student data imported successfully! 🚀');
          } else {
            ToastService.error(`Import failed: ${result.error}`);
          }
        };
        reader.readAsText(file);
        fileInput.value = '';
      });
    }

    const btnPrint = document.getElementById('btnPrintPlanner');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        this.prepareAndPrintPlanner();
      });
    }

    const btnReset = document.getElementById('btnResetDemoData');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Are you sure you want to reload default students and assignments? Any custom changes will be reset.')) {
          StorageService.resetToDemo();
          TaskManager.init();
          this.updateActiveStudentUI();
          this.renderAll();
          ToastService.info('Demo students & assignments restored!');
        }
      });
    }
  }

  /* ----------------------------------------------------
     KEYBOARD SHORTCUTS
  ---------------------------------------------------- */
  bindShortcuts() {
    document.addEventListener('keydown', (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        if (e.key === 'Escape') {
          e.target.blur();
          this.closeAllModals();
        }
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        this.openAssignmentModal();
      } else if (e.key === '/') {
        e.preventDefault();
        const search = document.getElementById('globalSearchInput');
        if (search) search.focus();
      } else if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  closeAllModals() {
    this.closeAssignmentModal();
    this.closeSubjectModal();
    this.closeManageStudentModal();
    if (window.CalendarController) window.CalendarController.closeDayModal();
    const dropdown = document.getElementById('settingsDropdown');
    if (dropdown) dropdown.classList.remove('show');
    const studentMenu = document.getElementById('studentDropdownMenu');
    if (studentMenu) studentMenu.classList.remove('show');
  }

  /* ----------------------------------------------------
     ASSIGNMENT MODAL HELPERS (Multi-Student Aware)
  ---------------------------------------------------- */
  populateStudentSelect(selectedStudentId = null) {
    const select = document.getElementById('taskStudentSelect');
    if (!select) return;

    select.innerHTML = '';
    const students = TaskManager.getStudents();
    const activeStudentId = TaskManager.activeStudentId;

    // 1. Current Active Student option
    const activeStudent = TaskManager.getActiveStudent();
    const activeOpt = document.createElement('option');
    activeOpt.value = activeStudent.id;
    activeOpt.textContent = `Current: ${activeStudent.name} (${activeStudent.grade || 'Student'})`;
    select.appendChild(activeOpt);

    // 2. Other students
    students.filter(s => s.id !== activeStudent.id).forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.grade || 'Student'})`;
      select.appendChild(opt);
    });

    // 3. Class-wide option
    const classOpt = document.createElement('option');
    classOpt.value = 'all';
    classOpt.textContent = `👥 All Students (Class Homework)`;
    select.appendChild(classOpt);

    if (selectedStudentId) {
      select.value = selectedStudentId;
    } else {
      select.value = activeStudentId;
    }
  }

  openAssignmentModal(taskId = null, prefillData = {}) {
    const modal = document.getElementById('assignmentModal');
    const titleEl = document.getElementById('assignmentModalTitle');
    const form = document.getElementById('assignmentForm');
    if (!modal || !form) return;

    form.reset();
    this.populateSubjectSelect();

    const titleInput = document.getElementById('taskTitleInput');
    const studentSelect = document.getElementById('taskStudentSelect');
    const subjectSelect = document.getElementById('taskSubjectSelect');
    const prioritySelect = document.getElementById('taskPrioritySelect');
    const dueDateInput = document.getElementById('taskDueDateInput');
    const dueTimeInput = document.getElementById('taskDueTimeInput');
    const estDurationInput = document.getElementById('taskEstDurationInput');
    const statusSelect = document.getElementById('taskStatusSelect');
    const notesInput = document.getElementById('taskNotesInput');
    const resourceUrlInput = document.getElementById('taskResourceUrlInput');
    const editIdInput = document.getElementById('taskEditId');

    document.querySelectorAll('#assignmentModal .form-group').forEach(fg => fg.classList.remove('has-error'));

    if (taskId) {
      const task = TaskManager.getTaskById(taskId);
      if (task) {
        titleEl.textContent = 'Edit Assignment';
        editIdInput.value = task.id;
        titleInput.value = task.title;
        this.populateStudentSelect(task.studentId || TaskManager.activeStudentId);
        subjectSelect.value = task.subjectId || '';
        prioritySelect.value = task.priority;
        dueDateInput.value = task.dueDate || '';
        dueTimeInput.value = task.dueTime || '23:59';
        estDurationInput.value = task.estDuration || 45;
        statusSelect.value = task.status || 'pending';
        notesInput.value = task.notes || '';
        resourceUrlInput.value = task.resourceUrl || '';
        this.modalSubtasks = JSON.parse(JSON.stringify(task.subtasks || []));
      }
    } else {
      titleEl.textContent = prefillData.studentId === 'all' ? '📢 Broadcast Class Homework' : 'Add New Assignment';
      editIdInput.value = '';

      this.populateStudentSelect(prefillData.studentId || TaskManager.activeStudentId);

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      dueDateInput.value = prefillData.dueDate || todayStr;
      dueTimeInput.value = '23:59';
      estDurationInput.value = '45';
      prioritySelect.value = 'medium';
      statusSelect.value = prefillData.status || 'pending';
      this.modalSubtasks = [];
    }

    this.renderModalSubtasks();
    modal.classList.add('show');
    titleInput.focus();
  }

  closeAssignmentModal() {
    const modal = document.getElementById('assignmentModal');
    if (modal) modal.classList.remove('show');
    this.modalSubtasks = [];
  }

  populateSubjectSelect() {
    const select = document.getElementById('taskSubjectSelect');
    const filterSelect = document.getElementById('filterSubjectSelect');

    if (select) {
      select.innerHTML = '<option value="">-- Choose Subject --</option>';
      TaskManager.subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} ${s.code ? '(' + s.code + ')' : ''}`;
        select.appendChild(opt);
      });
    }

    if (filterSelect) {
      const currentVal = this.currentFilters.subject;
      filterSelect.innerHTML = '<option value="all">All Subjects</option>';
      TaskManager.subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        if (s.id === currentVal) opt.selected = true;
        filterSelect.appendChild(opt);
      });
    }
  }

  renderModalSubtasks() {
    const list = document.getElementById('modalSubtaskList');
    const counter = document.getElementById('modalSubtaskCount');
    if (!list) return;

    if (counter) counter.textContent = `${this.modalSubtasks.length} step${this.modalSubtasks.length === 1 ? '' : 's'}`;
    list.innerHTML = '';

    this.modalSubtasks.forEach((st, idx) => {
      const li = document.createElement('li');
      li.className = 'modal-subtask-item';
      li.innerHTML = `
        <span class="modal-subtask-text">${idx + 1}. ${escapeHtml(st.text)}</span>
        <button type="button" class="icon-btn-xs text-danger" data-index="${idx}" title="Delete step">&times;</button>
      `;
      li.querySelector('button').addEventListener('click', () => {
        this.modalSubtasks.splice(idx, 1);
        this.renderModalSubtasks();
      });
      list.appendChild(li);
    });
  }

  handleAssignmentFormSubmit(e) {
    e.preventDefault();
    const titleInput = document.getElementById('taskTitleInput');
    const title = titleInput.value.trim();

    if (!title) {
      titleInput.closest('.form-group').classList.add('has-error');
      titleInput.focus();
      return;
    }

    const editId = document.getElementById('taskEditId').value;
    const taskData = {
      title,
      studentId: document.getElementById('taskStudentSelect').value,
      subjectId: document.getElementById('taskSubjectSelect').value,
      priority: document.getElementById('taskPrioritySelect').value,
      dueDate: document.getElementById('taskDueDateInput').value,
      dueTime: document.getElementById('taskDueTimeInput').value || '23:59',
      estDuration: document.getElementById('taskEstDurationInput').value,
      status: document.getElementById('taskStatusSelect').value,
      notes: document.getElementById('taskNotesInput').value,
      resourceUrl: document.getElementById('taskResourceUrlInput').value,
      subtasks: this.modalSubtasks
    };

    if (editId) {
      TaskManager.updateTask(editId, taskData);
      ToastService.success('Assignment updated!');
    } else {
      TaskManager.addTask(taskData);
      const isClass = taskData.studentId === 'all';
      ToastService.success(isClass ? 'Class assignment broadcasted to all students! 📢' : 'New assignment added! 🎯');
    }

    this.closeAssignmentModal();
    this.renderAll();
  }

  /* ----------------------------------------------------
     SUBJECT MODAL & VIEW
  ---------------------------------------------------- */
  openSubjectModal(subjectId = null) {
    const modal = document.getElementById('subjectModal');
    const form = document.getElementById('subjectForm');
    const titleEl = document.getElementById('subjectModalTitle');
    if (!modal || !form) return;

    form.reset();
    document.querySelectorAll('#subjectModal .form-group').forEach(fg => fg.classList.remove('has-error'));

    const nameInput = document.getElementById('subjectNameInput');
    const codeInput = document.getElementById('subjectCodeInput');
    const colorInput = document.getElementById('subjectSelectedColor');
    const editIdInput = document.getElementById('subjectEditId');

    if (subjectId) {
      const subj = TaskManager.getSubjectById(subjectId);
      if (subj) {
        titleEl.textContent = 'Edit Subject';
        editIdInput.value = subj.id;
        nameInput.value = subj.name;
        codeInput.value = subj.code || '';
        colorInput.value = subj.color || '#4F46E5';
        this.selectColorSwatch(subj.color);
      }
    } else {
      titleEl.textContent = 'Add Course / Subject';
      editIdInput.value = '';
      colorInput.value = '#4F46E5';
      this.selectColorSwatch('#4F46E5');
    }

    modal.classList.add('show');
    nameInput.focus();
  }

  selectColorSwatch(color) {
    const swatches = document.querySelectorAll('#subjectColorPalette .color-swatch');
    swatches.forEach(s => {
      s.classList.toggle('active', s.getAttribute('data-color') === color);
    });
  }

  closeSubjectModal() {
    const modal = document.getElementById('subjectModal');
    if (modal) modal.classList.remove('show');
  }

  handleSubjectFormSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('subjectNameInput');
    const name = nameInput.value.trim();

    if (!name) {
      nameInput.closest('.form-group').classList.add('has-error');
      nameInput.focus();
      return;
    }

    const editId = document.getElementById('subjectEditId').value;
    const subjData = {
      name,
      code: document.getElementById('subjectCodeInput').value,
      color: document.getElementById('subjectSelectedColor').value
    };

    if (editId) {
      TaskManager.updateSubject(editId, subjData);
      ToastService.success('Subject updated!');
    } else {
      const newSubj = TaskManager.addSubject(subjData);
      ToastService.success(`Course "${newSubj.name}" added! 📚`);

      const assignSubjSelect = document.getElementById('taskSubjectSelect');
      if (assignSubjSelect) {
        this.populateSubjectSelect();
        assignSubjSelect.value = newSubj.id;
      }
    }

    this.closeSubjectModal();
    this.renderAll();
  }

  renderSubjectsView() {
    const grid = document.getElementById('subjectsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const studentId = TaskManager.activeStudentId;

    TaskManager.subjects.forEach(subj => {
      const tasksForSubj = TaskManager.tasks.filter(t => (t.studentId === studentId || t.studentId === 'all') && t.subjectId === subj.id);
      const total = tasksForSubj.length;
      const completed = tasksForSubj.filter(t => TaskManager.isTaskCompleted(t, studentId)).length;
      const active = total - completed;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      const card = document.createElement('div');
      card.className = 'subject-card';
      card.innerHTML = `
        <div class="subject-color-strip" style="background-color: ${subj.color}"></div>
        <div class="subject-card-header">
          <div>
            <div class="subject-title">${escapeHtml(subj.name)}</div>
            <div class="subject-code">${subj.code ? escapeHtml(subj.code) : 'General'}</div>
          </div>
          <button class="icon-btn-xs" data-action="edit-subject" data-id="${subj.id}" title="Edit Course">✎</button>
        </div>

        <div class="subject-stats-row">
          <div class="subject-stat-item">
            <span class="subj-stat-val" style="color: ${subj.color}">${active}</span>
            <span class="subj-stat-lbl">Active Homework</span>
          </div>
          <div class="subject-stat-item">
            <span class="subj-stat-val text-success">${completed}</span>
            <span class="subj-stat-lbl">Completed</span>
          </div>
        </div>

        <div class="subject-progress-wrap">
          <div class="subject-progress-labels">
            <span>Syllabus Progress</span>
            <span style="color: ${subj.color}; font-weight:700;">${percent}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${percent}%; background-color: ${subj.color};"></div>
          </div>
        </div>

        <div class="subject-card-footer">
          <button class="task-btn text-danger" data-action="delete-subject" data-id="${subj.id}">Delete</button>
          <button class="task-btn" data-action="filter-by-subject" data-id="${subj.id}">View Homework</button>
        </div>
      `;

      card.querySelector('[data-action="edit-subject"]').addEventListener('click', () => {
        this.openSubjectModal(subj.id);
      });

      card.querySelector('[data-action="delete-subject"]').addEventListener('click', () => {
        if (confirm(`Delete subject "${subj.name}"? Assignments will remain under General.`)) {
          TaskManager.deleteSubject(subj.id);
          this.renderAll();
          ToastService.info('Course removed');
        }
      });

      card.querySelector('[data-action="filter-by-subject"]').addEventListener('click', () => {
        this.switchView('dashboard');
        this.currentFilters.subject = subj.id;
        const subjSelect = document.getElementById('filterSubjectSelect');
        if (subjSelect) subjSelect.value = subj.id;
        this.renderTasksList();
      });

      grid.appendChild(card);
    });
  }

  /* ----------------------------------------------------
     DASHBOARD TASKS LIST & CARDS RENDERER (Multi-Student Scoped)
  ---------------------------------------------------- */
  renderTasksList() {
    const container = document.getElementById('tasksContainer');
    const emptyState = document.getElementById('emptyState');
    if (!container) return;

    container.innerHTML = '';
    const studentId = TaskManager.activeStudentId;
    const filteredTasks = TaskManager.getFilteredTasks(this.currentFilters, studentId);

    this.renderActiveFilterPills();

    if (filteredTasks.length === 0) {
      if (emptyState) {
        emptyState.style.display = 'flex';
        const desc = document.getElementById('emptyDescription');
        if (this.currentFilters.search) {
          desc.textContent = `No assignments found matching "${this.currentFilters.search}".`;
        } else if (this.currentFilters.status === 'overdue') {
          desc.textContent = 'Awesome! Zero overdue assignments for this student.';
        } else {
          desc.textContent = "All caught up! Enjoy free time or add a new homework task.";
        }
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    if (this.currentFilters.status === 'all' && !this.currentFilters.search) {
      const overdueTasks = filteredTasks.filter(t => TaskManager.isOverdue(t, studentId));
      const todayTasks = filteredTasks.filter(t => TaskManager.isDueToday(t, studentId) && !TaskManager.isOverdue(t, studentId) && !TaskManager.isTaskCompleted(t, studentId));
      const weekTasks = filteredTasks.filter(t => TaskManager.isDueThisWeek(t, studentId) && !TaskManager.isDueToday(t, studentId) && !TaskManager.isOverdue(t, studentId) && !TaskManager.isTaskCompleted(t, studentId));
      const laterTasks = filteredTasks.filter(t => !TaskManager.isDueThisWeek(t, studentId) && !TaskManager.isDueToday(t, studentId) && !TaskManager.isOverdue(t, studentId) && !TaskManager.isTaskCompleted(t, studentId));
      const completedTasks = filteredTasks.filter(t => TaskManager.isTaskCompleted(t, studentId));

      if (overdueTasks.length > 0) {
        this.renderTaskSection(container, '⚠️ Overdue Assignments', overdueTasks, 'text-danger');
      }
      if (todayTasks.length > 0) {
        this.renderTaskSection(container, '🔥 Due Today', todayTasks);
      }
      if (weekTasks.length > 0) {
        this.renderTaskSection(container, '📅 Due This Week', weekTasks);
      }
      if (laterTasks.length > 0) {
        this.renderTaskSection(container, '🗓️ Upcoming Later', laterTasks);
      }
      if (completedTasks.length > 0) {
        this.renderTaskSection(container, '🎉 Completed Homework', completedTasks);
      }
    } else {
      const section = document.createElement('div');
      section.className = 'task-group';
      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'task-group-items';

      filteredTasks.forEach(task => {
        itemsContainer.appendChild(this.createTaskCardElement(task));
      });

      section.appendChild(itemsContainer);
      container.appendChild(section);
    }
  }

  renderTaskSection(parent, title, tasks, titleClass = '') {
    const section = document.createElement('div');
    section.className = 'task-group';

    const header = document.createElement('div');
    header.className = 'task-section-header';
    header.innerHTML = `
      <h3 class="task-section-title ${titleClass}">${title}</h3>
      <span class="task-section-count">${tasks.length}</span>
    `;
    section.appendChild(header);

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'task-group-items';

    tasks.forEach(task => {
      itemsContainer.appendChild(this.createTaskCardElement(task));
    });

    section.appendChild(itemsContainer);
    parent.appendChild(section);
  }

  createTaskCardElement(task) {
    const studentId = TaskManager.activeStudentId;
    const isOverdue = TaskManager.isOverdue(task, studentId);
    const isCompleted = TaskManager.isTaskCompleted(task, studentId);

    const card = document.createElement('div');
    card.className = `task-card ${isCompleted ? 'is-completed' : ''} ${isOverdue ? 'is-overdue' : ''}`;
    card.setAttribute('data-id', task.id);

    const subject = TaskManager.getSubjectById(task.subjectId);
    const dueInfo = TaskManager.formatDueBadge(task, studentId);

    // Class homework badge
    let classBadge = '';
    if (task.studentId === 'all') {
      classBadge = `<span class="subject-badge" style="background-color: rgba(16, 185, 129, 0.15); color: #10B981;">👥 Class Homework</span>`;
    }

    // Subtasks summary
    let subtasksHtml = '';
    if (task.subtasks && task.subtasks.length > 0) {
      const completedCount = task.subtasks.filter(s => s.completed).length;
      const progressPercent = Math.round((completedCount / task.subtasks.length) * 100);

      const itemsListHtml = task.subtasks.map(st => `
        <label class="subtask-item ${st.completed ? 'is-done' : ''}">
          <input type="checkbox" class="subtask-checkbox" data-task-id="${task.id}" data-subtask-id="${st.id}" ${st.completed ? 'checked' : ''}>
          <span>${escapeHtml(st.text)}</span>
        </label>
      `).join('');

      subtasksHtml = `
        <div class="task-subtasks-section">
          <div class="task-subtasks-header" data-action="toggle-subtasks-accordion">
            <div class="subtasks-title-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <span>Milestones (${completedCount}/${task.subtasks.length})</span>
            </div>
            <span class="subtasks-mini-progress">${progressPercent}%</span>
          </div>
          <div class="subtasks-list">
            ${itemsListHtml}
          </div>
        </div>
      `;
    }

    let resourceBtn = '';
    if (task.resourceUrl) {
      resourceBtn = `
        <a href="${escapeHtml(task.resourceUrl)}" target="_blank" rel="noopener noreferrer" class="task-btn" title="Open resource link">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          <span>Resource</span>
        </a>
      `;
    }

    card.innerHTML = `
      <div class="task-header">
        <div class="task-checkbox-wrap">
          <button class="custom-checkbox" data-action="toggle-complete" data-id="${task.id}" aria-label="Toggle task completed">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>

        <div class="task-main-info">
          <div class="task-badge-row">
            <span class="subject-badge" style="background-color: ${subject.color}18; color: ${subject.color};">
              ${escapeHtml(subject.name)}
            </span>
            ${classBadge}
            <span class="priority-badge priority-${task.priority}">
              ${task.priority}
            </span>
            ${task.estDuration ? `<span class="text-sm" style="color:var(--text-muted); font-size:0.75rem;">⏱️ ${task.estDuration}m</span>` : ''}
          </div>

          <h4 class="task-title">${escapeHtml(task.title)}</h4>
          ${task.notes ? `<p class="task-notes">${escapeHtml(task.notes)}</p>` : ''}
        </div>
      </div>

      ${subtasksHtml}

      <div class="task-footer">
        <div class="task-due-info">
          <span class="due-pill ${dueInfo.className}">
            ${dueInfo.text}
          </span>
        </div>

        <div class="task-tools">
          ${resourceBtn}
          <button class="task-btn pomo-btn" data-action="study-task" data-id="${task.id}" title="Start Focus Timer for this assignment">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Focus</span>
          </button>
          <button class="task-btn" data-action="edit-task" data-id="${task.id}" title="Edit Assignment">✎</button>
          <button class="task-btn text-danger" data-action="delete-task" data-id="${task.id}" title="Delete Assignment">✕</button>
        </div>
      </div>
    `;

    // Event listeners
    card.querySelector('[data-action="toggle-complete"]').addEventListener('click', (e) => {
      e.stopPropagation();
      const updated = TaskManager.toggleTaskComplete(task.id, studentId);
      if (updated && TaskManager.isTaskCompleted(updated, studentId)) {
        ToastService.success(`Completed: ${task.title} 🎉`);
      }
      this.renderAll();
    });

    const subtasksHeader = card.querySelector('[data-action="toggle-subtasks-accordion"]');
    if (subtasksHeader) {
      subtasksHeader.addEventListener('click', () => {
        const list = card.querySelector('.subtasks-list');
        if (list) {
          list.style.display = list.style.display === 'none' ? 'flex' : 'none';
        }
      });
    }

    card.querySelectorAll('.subtask-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const taskId = cb.getAttribute('data-task-id');
        const stId = cb.getAttribute('data-subtask-id');
        TaskManager.toggleSubtask(taskId, stId, studentId);
        this.renderAll();
      });
    });

    card.querySelector('[data-action="edit-task"]').addEventListener('click', () => {
      this.openAssignmentModal(task.id);
    });

    card.querySelector('[data-action="delete-task"]').addEventListener('click', () => {
      if (confirm(`Delete assignment "${task.title}"?`)) {
        TaskManager.deleteTask(task.id);
        ToastService.info('Assignment deleted');
        this.renderAll();
      }
    });

    card.querySelector('[data-action="study-task"]').addEventListener('click', () => {
      this.switchView('pomodoro');
      if (window.PomodoroController) {
        window.PomodoroController.linkTaskAndOpen(task.id);
      }
    });

    return card;
  }

  renderActiveFilterPills() {
    const bar = document.getElementById('activeFiltersBar');
    const tagList = document.getElementById('filterTagList');
    if (!bar || !tagList) return;

    tagList.innerHTML = '';
    let hasFilters = false;

    if (this.currentFilters.search) {
      hasFilters = true;
      tagList.appendChild(this.createFilterTag(`Search: "${this.currentFilters.search}"`, () => {
        this.currentFilters.search = '';
        const input = document.getElementById('globalSearchInput');
        if (input) input.value = '';
        const clear = document.getElementById('searchClearBtn');
        if (clear) clear.style.display = 'none';
        this.renderTasksList();
      }));
    }

    if (this.currentFilters.status !== 'all') {
      hasFilters = true;
      tagList.appendChild(this.createFilterTag(`Status: ${this.currentFilters.status}`, () => {
        this.setFilterStatus('all');
      }));
    }

    if (this.currentFilters.subject !== 'all') {
      hasFilters = true;
      const subj = TaskManager.getSubjectById(this.currentFilters.subject);
      tagList.appendChild(this.createFilterTag(`Subject: ${subj.name}`, () => {
        this.currentFilters.subject = 'all';
        const sel = document.getElementById('filterSubjectSelect');
        if (sel) sel.value = 'all';
        this.renderTasksList();
      }));
    }

    if (this.currentFilters.priority !== 'all') {
      hasFilters = true;
      tagList.appendChild(this.createFilterTag(`Priority: ${this.currentFilters.priority}`, () => {
        this.currentFilters.priority = 'all';
        const sel = document.getElementById('filterPrioritySelect');
        if (sel) sel.value = 'all';
        this.renderTasksList();
      }));
    }

    bar.style.display = hasFilters ? 'flex' : 'none';
  }

  createFilterTag(text, onRemove) {
    const tag = document.createElement('div');
    tag.className = 'filter-tag';
    tag.innerHTML = `
      <span>${escapeHtml(text)}</span>
      <button class="filter-tag-remove" aria-label="Remove filter">&times;</button>
    `;
    tag.querySelector('.filter-tag-remove').addEventListener('click', onRemove);
    return tag;
  }

  /* ----------------------------------------------------
     STATISTICS & METRICS UPDATE
  ---------------------------------------------------- */
  updateStats() {
    const studentId = TaskManager.activeStudentId;
    const metrics = TaskManager.getMetrics(studentId);

    const statActive = document.getElementById('statActiveCount');
    const statToday = document.getElementById('statDueTodayCount');
    const statOverdue = document.getElementById('statOverdueCount');

    if (statActive) statActive.textContent = metrics.active;
    if (statToday) statToday.textContent = metrics.dueTodayAndTomorrow;
    if (statOverdue) statOverdue.textContent = metrics.overdue;

    const badgeActive = document.getElementById('badgeTotalActive');
    const badgeToday = document.getElementById('badgeDueToday');
    const badgeWeek = document.getElementById('badgeDueWeek');
    const badgeOverdue = document.getElementById('badgeOverdue');
    const badgeCompleted = document.getElementById('badgeCompleted');
    const badgeSubject = document.getElementById('badgeSubjectCount');
    const badgeStudent = document.getElementById('badgeStudentCount');

    if (badgeActive) badgeActive.textContent = metrics.active;
    if (badgeToday) badgeToday.textContent = metrics.dueToday;
    if (badgeWeek) badgeWeek.textContent = metrics.dueWeek;
    if (badgeOverdue) badgeOverdue.textContent = metrics.overdue;
    if (badgeCompleted) badgeCompleted.textContent = metrics.completed;
    if (badgeSubject) badgeSubject.textContent = TaskManager.subjects.length;
    if (badgeStudent) badgeStudent.textContent = TaskManager.students.length;

    const progressPercent = document.getElementById('sidebarProgressPercent');
    const progressBar = document.getElementById('sidebarProgressBar');
    const progressSub = document.getElementById('sidebarProgressSub');

    if (progressPercent) progressPercent.textContent = `${metrics.completionRate}%`;
    if (progressBar) progressBar.style.width = `${metrics.completionRate}%`;
    if (progressSub) progressSub.textContent = `${metrics.completed} of ${metrics.total} tasks completed`;

    // Active student focus minutes today
    const pomoLogs = StorageService.getPomoLogs();
    const today = new Date().toDateString();
    const todayLogs = pomoLogs.filter(log => (!log.studentId || log.studentId === studentId) && new Date(log.completedAt).toDateString() === today);
    let totalFocusMins = 0;
    todayLogs.forEach(l => totalFocusMins += (l.durationMin || 25));

    const statFocusMinutes = document.getElementById('statFocusMinutes');
    if (statFocusMinutes) statFocusMinutes.textContent = `${totalFocusMins}m`;
  }

  /* ----------------------------------------------------
     PRINTABLE PLANNER GENERATOR
  ---------------------------------------------------- */
  prepareAndPrintPlanner() {
    const printContainer = document.getElementById('printPlannerContainer');
    if (!printContainer) return;

    const activeStudent = TaskManager.getActiveStudent();
    const studentId = TaskManager.activeStudentId;
    const activeTasks = TaskManager.tasks.filter(t => (t.studentId === studentId || t.studentId === 'all') && !TaskManager.isTaskCompleted(t, studentId));

    let rowsHtml = '';
    activeTasks.forEach((t) => {
      const subj = TaskManager.getSubjectById(t.subjectId);
      rowsHtml += `
        <tr>
          <td style="width: 30px; text-align: center;">[  ]</td>
          <td><strong>${escapeHtml(t.title)}</strong>${t.notes ? `<br><small style="color:#555;">${escapeHtml(t.notes)}</small>` : ''}</td>
          <td>${escapeHtml(subj.name)}${t.studentId === 'all' ? ' <em>[Class]</em>' : ''}</td>
          <td>${t.priority.toUpperCase()}</td>
          <td>${t.dueDate || 'N/A'} ${t.dueTime || ''}</td>
          <td>${t.estDuration || 45} min</td>
        </tr>
      `;
    });

    printContainer.innerHTML = `
      <div class="print-header">
        <h1>📚 Homework Hub – Student Study Agenda</h1>
        <p><strong>Student:</strong> ${escapeHtml(activeStudent.name)} (${escapeHtml(activeStudent.grade || 'Student')}) &nbsp;|&nbsp; <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>

      <table class="print-table">
        <thead>
          <tr>
            <th>Done</th>
            <th>Assignment Title & Instructions</th>
            <th>Course</th>
            <th>Priority</th>
            <th>Due Date</th>
            <th>Est. Time</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="6" style="text-align:center;">No pending homework! All caught up!</td></tr>'}
        </tbody>
      </table>
    `;

    window.print();
  }

  /* ----------------------------------------------------
     REFRESH ALL COMPONENTS
  ---------------------------------------------------- */
  renderAll() {
    this.populateSubjectSelect();
    this.updateStats();

    if (this.currentView === 'dashboard') {
      this.renderTasksList();
    } else if (this.currentView === 'kanban' && window.KanbanController) {
      window.KanbanController.render();
    } else if (this.currentView === 'calendar' && window.CalendarController) {
      window.CalendarController.render();
    } else if (this.currentView === 'subjects') {
      this.renderSubjectsView();
    } else if (this.currentView === 'pomodoro' && window.PomodoroController) {
      window.PomodoroController.populateTaskSelect();
      window.PomodoroController.renderHistory();
    } else if (this.currentView === 'roster') {
      this.renderRosterView();
    }
  }
}

// Global bootstrap
document.addEventListener('DOMContentLoaded', () => {
  window.app = new HomeworkHubApp();
  window.app.init();
});
