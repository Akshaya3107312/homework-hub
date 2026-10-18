/**
 * Homework Hub - Interactive Deadlines Calendar Controller
 */

const CalendarController = {
  currentDate: new Date(),
  selectedDayString: null,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const btnPrev = document.getElementById('btnCalPrev');
    const btnNext = document.getElementById('btnCalNext');
    const btnToday = document.getElementById('btnCalToday');

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
      });
    }

    if (btnToday) {
      btnToday.addEventListener('click', () => {
        this.currentDate = new Date();
        this.render();
      });
    }

    // Calendar Day Detail Modal handlers
    const btnCloseModal = document.getElementById('btnCloseCalDayModal');
    const btnCloseModal2 = document.getElementById('btnCloseCalDayModal2');
    const btnAddCalDayTask = document.getElementById('btnAddCalDayTask');

    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => this.closeDayModal());
    }
    if (btnCloseModal2) {
      btnCloseModal2.addEventListener('click', () => this.closeDayModal());
    }
    if (btnAddCalDayTask) {
      btnAddCalDayTask.addEventListener('click', () => {
        const targetDate = this.selectedDayString;
        this.closeDayModal();
        if (window.app) {
          window.app.openAssignmentModal(null, { dueDate: targetDate });
        }
      });
    }
  },

  render() {
    const titleEl = document.getElementById('calendarMonthTitle');
    const daysGrid = document.getElementById('calendarDaysGrid');
    if (!titleEl || !daysGrid) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    titleEl.textContent = `${monthNames[month]} ${year}`;
    daysGrid.innerHTML = '';

    // First day of month
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Total days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Days in previous month
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Map tasks by date for active student
    const tasksByDate = {};
    const studentId = TaskManager.activeStudentId;
    const studentTasks = TaskManager.tasks.filter(t => t.studentId === studentId || t.studentId === 'all');
    studentTasks.forEach(task => {
      if (task.dueDate) {
        if (!tasksByDate[task.dueDate]) tasksByDate[task.dueDate] = [];
        tasksByDate[task.dueDate].push(task);
      }
    });

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 1. Previous month trailing days
    for (let x = firstDayIndex; x > 0; x--) {
      const dayNum = prevMonthDays - x + 1;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const cell = this.createDayCell(dayNum, dateStr, true, dateStr === todayStr, tasksByDate[dateStr] || []);
      daysGrid.appendChild(cell);
    }

    // 2. Current month days
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const cell = this.createDayCell(i, dateStr, false, dateStr === todayStr, tasksByDate[dateStr] || []);
      daysGrid.appendChild(cell);
    }

    // 3. Next month leading days to complete grid (up to 35 or 42)
    const filledDays = firstDayIndex + totalDays;
    const nextDaysNeeded = (filledDays <= 35 ? 35 : 42) - filledDays;

    for (let j = 1; j <= nextDaysNeeded; j++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
      const cell = this.createDayCell(j, dateStr, true, dateStr === todayStr, tasksByDate[dateStr] || []);
      daysGrid.appendChild(cell);
    }
  },

  createDayCell(dayNumber, dateString, isOtherMonth, isToday, tasks) {
    const cell = document.createElement('div');
    cell.className = `calendar-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''}`;
    cell.setAttribute('data-date', dateString);

    const taskCount = tasks.length;
    let taskHtml = '';

    const maxPills = 2;
    const displayedTasks = tasks.slice(0, maxPills);

    displayedTasks.forEach(task => {
      const subj = TaskManager.getSubjectById(task.subjectId);
      const isDone = TaskManager.isTaskCompleted(task, TaskManager.activeStudentId);
      const isUrgent = task.priority === 'urgent' && !isDone;

      let pillBg = `${subj.color}20`;
      let pillText = subj.color;
      let badge = isDone ? '✔ ' : (isUrgent ? '🔥 ' : '');

      taskHtml += `
        <span class="cal-task-pill" style="background-color: ${pillBg}; color: ${pillText}; ${isDone ? 'text-decoration:line-through; opacity:0.6;' : ''}" title="${escapeHtml(task.title)}">
          ${badge}${escapeHtml(task.title)}
        </span>
      `;
    });

    if (taskCount > maxPills) {
      taskHtml += `<span class="cal-more-pill">+${taskCount - maxPills} more</span>`;
    }

    cell.innerHTML = `
      <div class="day-header">
        <span class="day-number">${dayNumber}</span>
      </div>
      <div class="day-tasks-list">
        ${taskHtml}
      </div>
    `;

    cell.addEventListener('click', () => {
      this.openDayModal(dateString, tasks);
    });

    return cell;
  },

  openDayModal(dateString, tasks) {
    this.selectedDayString = dateString;
    const modal = document.getElementById('calendarDayModal');
    const titleEl = document.getElementById('calDayModalTitle');
    const subtitleEl = document.getElementById('calDayModalSubtitle');
    const listEl = document.getElementById('calDayTaskList');

    if (!modal || !listEl) return;

    const d = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateFormatted = d.toLocaleDateString(undefined, options);

    titleEl.textContent = `Deadlines for ${dateFormatted}`;
    subtitleEl.textContent = `${tasks.length} assignment${tasks.length === 1 ? '' : 's'} scheduled for this day`;

    listEl.innerHTML = '';

    if (tasks.length === 0) {
      listEl.innerHTML = `
        <div class="empty-hint" style="padding: 30px 10px;">
          No homework due on this date. Click below to add one!
        </div>
      `;
    } else {
      tasks.forEach(task => {
        const subj = TaskManager.getSubjectById(task.subjectId);
        const item = document.createElement('div');
        item.className = 'task-card';
        item.style.marginBottom = '10px';
        item.innerHTML = `
        const isDone = TaskManager.isTaskCompleted(task, TaskManager.activeStudentId);
        item.innerHTML = `
          <div class="task-header">
            <div class="task-checkbox-wrap">
              <button class="custom-checkbox ${isDone ? 'checked' : ''}" data-action="toggle-complete" data-id="${task.id}" aria-label="Mark task done">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            </div>
            <div class="task-main-info">
              <div class="task-badge-row">
                <span class="subject-badge" style="background-color: ${subj.color}18; color: ${subj.color};">${subj.name}</span>
                ${task.studentId === 'all' ? '<span class="subject-badge" style="background-color:rgba(16,185,129,0.15); color:#10B981;">👥 Class</span>' : ''}
                <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                <span class="text-sm" style="color:var(--text-muted); margin-left:auto;">${task.dueTime || '23:59'}</span>
              </div>
              <div class="task-title" style="font-size:0.95rem; ${isDone ? 'text-decoration:line-through; opacity:0.6;' : ''}">${escapeHtml(task.title)}</div>
              ${task.notes ? `<p class="task-notes" style="font-size:0.8rem;">${escapeHtml(task.notes)}</p>` : ''}
            </div>
          </div>
        `;
        const cb = item.querySelector('[data-action="toggle-complete"]');
        if (cb) {
          cb.addEventListener('click', () => {
            TaskManager.toggleTaskComplete(task.id, TaskManager.activeStudentId);
            CalendarController.render();
            // Re-render modal list
            const studentId = TaskManager.activeStudentId;
            const updatedTasks = TaskManager.tasks.filter(t => (t.studentId === studentId || t.studentId === 'all') && t.dueDate === dateString);
            CalendarController.openDayModal(dateString, updatedTasks);
            if (window.app) window.app.updateStats();
          });
        }

        // Allow clicking the title to edit
        const titleClick = item.querySelector('.task-title');
        if (titleClick) {
          titleClick.style.cursor = 'pointer';
          titleClick.addEventListener('click', () => {
            CalendarController.closeDayModal();
            if (window.app) window.app.openAssignmentModal(task.id);
          });
        }

        listEl.appendChild(item);
      });
    }

    modal.classList.add('show');
  },

  closeDayModal() {
    const modal = document.getElementById('calendarDayModal');
    if (modal) modal.classList.remove('show');
    this.selectedDayString = null;
  }
};

window.CalendarController = CalendarController;
