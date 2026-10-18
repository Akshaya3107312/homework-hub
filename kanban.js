/**
 * Homework Hub - Interactive Kanban Board Controller (Multi-Student Aware)
 * Supports HTML5 Drag-and-Drop, Touch/Click Actions, and Quick Column Modals
 */

const KanbanController = {
  draggedTaskId: null,

  init() {
    this.bindDropzones();
    this.bindQuickAddButtons();
  },

  bindDropzones() {
    const dropzones = document.querySelectorAll('.kanban-dropzone');
    dropzones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
      });

      zone.addEventListener('dragleave', (e) => {
        zone.classList.remove('drag-over');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const targetStatus = zone.getAttribute('data-status');
        if (this.draggedTaskId && targetStatus) {
          TaskManager.updateTaskStatus(this.draggedTaskId, targetStatus, TaskManager.activeStudentId);
          ToastService.success(`Moved to ${this.getStatusLabel(targetStatus)}`);
          if (window.app) window.app.renderAll();
        }
      });
    });
  },

  bindQuickAddButtons() {
    const quickAddBtns = document.querySelectorAll('.kanban-column-header [data-action="quick-add"]');
    quickAddBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const status = btn.getAttribute('data-status') || 'pending';
        if (window.app) {
          window.app.openAssignmentModal(null, { status });
        }
      });
    });
  },

  getStatusLabel(status) {
    if (status === 'pending') return 'To Do';
    if (status === 'in-progress') return 'In Progress';
    if (status === 'completed') return 'Completed 🎉';
    return status;
  },

  render() {
    const pendingList = document.getElementById('kanbanListPending');
    const inProgressList = document.getElementById('kanbanListInProgress');
    const completedList = document.getElementById('kanbanListCompleted');

    if (!pendingList || !inProgressList || !completedList) return;

    // Clear previous
    pendingList.innerHTML = '';
    inProgressList.innerHTML = '';
    completedList.innerHTML = '';

    const studentId = TaskManager.activeStudentId;
    const studentTasks = TaskManager.tasks.filter(t => t.studentId === studentId || t.studentId === 'all');

    let pendingCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;

    studentTasks.forEach(task => {
      const cardEl = this.createCardElement(task);
      const status = TaskManager.getTaskStatusForStudent(task, studentId);

      if (status === 'completed') {
        completedList.appendChild(cardEl);
        completedCount++;
      } else if (status === 'in-progress') {
        inProgressList.appendChild(cardEl);
        inProgressCount++;
      } else {
        pendingList.appendChild(cardEl);
        pendingCount++;
      }
    });

    // Update counts
    const countPending = document.getElementById('kanbanCountPending');
    const countInProgress = document.getElementById('kanbanCountInProgress');
    const countCompleted = document.getElementById('kanbanCountCompleted');

    if (countPending) countPending.textContent = pendingCount;
    if (countInProgress) countInProgress.textContent = inProgressCount;
    if (countCompleted) countCompleted.textContent = completedCount;
  },

  createCardElement(task) {
    const studentId = TaskManager.activeStudentId;
    const isCompleted = TaskManager.isTaskCompleted(task, studentId);
    const status = TaskManager.getTaskStatusForStudent(task, studentId);

    const card = document.createElement('div');
    card.className = `kanban-card ${isCompleted ? 'is-completed' : ''}`;
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', task.id);

    // Drag handlers
    card.addEventListener('dragstart', (e) => {
      this.draggedTaskId = task.id;
      card.classList.add('is-dragging');
      e.dataTransfer.setData('text/plain', task.id);
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('is-dragging');
      this.draggedTaskId = null;
    });

    const subject = TaskManager.getSubjectById(task.subjectId);
    const dueInfo = TaskManager.formatDueBadge(task, studentId);

    // Subtask count
    let subtaskSummary = '';
    if (task.subtasks && task.subtasks.length > 0) {
      const completedSt = task.subtasks.filter(s => s.completed).length;
      subtaskSummary = `
        <div style="font-size:0.75rem; color:var(--text-muted); display:flex; align-items:center; gap:4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>${completedSt}/${task.subtasks.length} steps</span>
        </div>
      `;
    }

    // Class homework badge
    let classBadge = '';
    if (task.studentId === 'all') {
      classBadge = `<span class="subject-badge" style="background-color: rgba(16, 185, 129, 0.15); color: #10B981;">👥 Class</span>`;
    }

    // Move buttons depending on current status
    let moveButtons = '';
    if (status === 'pending') {
      moveButtons = `
        <button class="icon-btn-xs" data-action="move-status" data-target="in-progress" title="Move to In Progress">➔</button>
      `;
    } else if (status === 'in-progress') {
      moveButtons = `
        <button class="icon-btn-xs" data-action="move-status" data-target="pending" title="Move back to To Do">⬅</button>
        <button class="icon-btn-xs" data-action="move-status" data-target="completed" title="Move to Completed">✔</button>
      `;
    } else {
      moveButtons = `
        <button class="icon-btn-xs" data-action="move-status" data-target="in-progress" title="Move back to In Progress">⬅</button>
      `;
    }

    card.innerHTML = `
      <div class="task-badge-row">
        <span class="subject-badge" style="background-color: ${subject.color}18; color: ${subject.color};">
          ${escapeHtml(subject.name)}
        </span>
        ${classBadge}
        <span class="priority-badge priority-${task.priority}">
          ${task.priority}
        </span>
      </div>

      <div class="kanban-card-title">${escapeHtml(task.title)}</div>

      ${subtaskSummary}

      <div class="kanban-card-footer">
        <div class="due-pill ${dueInfo.className}">
          ${dueInfo.text}
        </div>
        <div class="kanban-move-actions">
          <button class="icon-btn-xs" data-action="edit-task" title="Edit Assignment">✎</button>
          ${moveButtons}
        </div>
      </div>
    `;

    // Bind edit task
    const editBtn = card.querySelector('[data-action="edit-task"]');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.app) window.app.openAssignmentModal(task.id);
      });
    }

    // Bind move status buttons
    card.querySelectorAll('[data-action="move-status"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = btn.getAttribute('data-target');
        TaskManager.updateTaskStatus(task.id, target, studentId);
        ToastService.success(`Moved to ${this.getStatusLabel(target)}`);
        if (window.app) window.app.renderAll();
      });
    });

    return card;
  }
};

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.KanbanController = KanbanController;
