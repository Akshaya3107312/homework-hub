/**
 * Homework Hub - Pomodoro Focus Timer & Procedural Ambient Audio Synthesizer
 * 100% self-contained using Web Audio API (Zero external MP3 dependencies)
 */

class SoundSynthesizer {
  constructor() {
    this.audioCtx = null;
    this.ambientSource = null;
    this.ambientGain = null;
    this.currentAmbientType = null;
  }

  ensureContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Play crisp completion chime (bell chord)
  playChime() {
    try {
      this.ensureContext();
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Two harmonic frequencies (C5: 523.25 Hz and G5: 783.99 Hz)
      const freqs = [523.25, 783.99, 1046.50];

      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + index * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 2.0);
      });
    } catch (e) {
      console.warn('Audio chime playback error:', e);
    }
  }

  // Play short click/tick
  playTick() {
    try {
      this.ensureContext();
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {}
  }

  // Start procedural ambient sound (Rain, White Noise, Ocean Waves)
  startAmbient(type, volume = 0.3) {
    this.stopAmbient();
    this.ensureContext();
    const ctx = this.audioCtx;

    // Create white noise buffer of 3 seconds looped
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Filter setup based on sound type
    const filter = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);

    if (type === 'rain') {
      // Rain: Lowpass with gentle high-end roll-off
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
    } else if (type === 'whitenoise') {
      // White noise / cozy fan: Bandpass around 600Hz
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(750, ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);
    } else {
      // Forest wind / waves: Lowpass with subtle LFO modulation
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.2, ctx.currentTime); // 5 sec wave cycle
      lfoGain.gain.setValueAtTime(250, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.lfo = lfo;
    }

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start();

    this.ambientSource = noiseSource;
    this.ambientGain = gainNode;
    this.currentAmbientType = type;
  }

  setAmbientVolume(vol) {
    if (this.ambientGain && this.audioCtx) {
      this.ambientGain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
    }
  }

  stopAmbient() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
        this.ambientSource.disconnect();
      } catch (e) {}
      this.ambientSource = null;
    }
    if (this.lfo) {
      try {
        this.lfo.stop();
        this.lfo.disconnect();
      } catch (e) {}
      this.lfo = null;
    }
    this.currentAmbientType = null;
  }
}

const PomodoroController = {
  soundSynth: null,
  modes: {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  },
  currentMode: 'pomodoro',
  timeLeft: 25 * 60,
  totalTime: 25 * 60,
  isRunning: false,
  timerInterval: null,
  linkedTaskId: '',

  init() {
    this.soundSynth = new SoundSynthesizer();
    this.bindEvents();
    this.updateDisplay();
    this.renderHistory();
  },

  bindEvents() {
    // Mode switcher buttons
    const modeButtons = document.querySelectorAll('.pomo-mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        this.switchMode(mode);
      });
    });

    // Start / Pause
    const btnStart = document.getElementById('btnPomoStart');
    if (btnStart) {
      btnStart.addEventListener('click', () => this.toggleStart());
    }

    // Reset
    const btnReset = document.getElementById('btnPomoReset');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.resetTimer());
    }

    // Skip
    const btnSkip = document.getElementById('btnPomoSkip');
    if (btnSkip) {
      btnSkip.addEventListener('click', () => this.skipSession());
    }

    // Task selector link
    const selectTask = document.getElementById('pomoLinkedTask');
    if (selectTask) {
      selectTask.addEventListener('change', (e) => {
        this.linkedTaskId = e.target.value;
      });
    }

    // Ambient sound chips
    const soundChips = document.querySelectorAll('.sound-chip');
    const stopSoundBtn = document.getElementById('btnStopSound');
    const playingBadge = document.getElementById('ambientPlayingBadge');
    const volumeSlider = document.getElementById('ambientVolume');

    soundChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const soundType = chip.getAttribute('data-sound');
        const isActive = chip.classList.contains('active');

        soundChips.forEach(c => c.classList.remove('active'));

        if (isActive) {
          this.soundSynth.stopAmbient();
          if (stopSoundBtn) stopSoundBtn.style.display = 'none';
          if (playingBadge) playingBadge.style.display = 'none';
        } else {
          chip.classList.add('active');
          const vol = volumeSlider ? parseFloat(volumeSlider.value) : 0.3;
          this.soundSynth.startAmbient(soundType, vol);
          if (stopSoundBtn) stopSoundBtn.style.display = 'inline-block';
          if (playingBadge) playingBadge.style.display = 'inline-block';
        }
      });
    });

    if (stopSoundBtn) {
      stopSoundBtn.addEventListener('click', () => {
        this.soundSynth.stopAmbient();
        soundChips.forEach(c => c.classList.remove('active'));
        stopSoundBtn.style.display = 'none';
        if (playingBadge) playingBadge.style.display = 'none';
      });
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        this.soundSynth.setAmbientVolume(parseFloat(e.target.value));
      });
    }
  },

  switchMode(mode) {
    this.pauseTimer();
    this.currentMode = mode;
    this.totalTime = this.modes[mode] || 25 * 60;
    this.timeLeft = this.totalTime;

    // Update active tab UI
    const modeButtons = document.querySelectorAll('.pomo-mode-btn');
    modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });

    const label = document.getElementById('timerModeLabel');
    if (label) {
      if (mode === 'pomodoro') label.textContent = 'Time to study!';
      else if (mode === 'shortBreak') label.textContent = 'Short breather (5 min)';
      else label.textContent = 'Long restful break (15 min)';
    }

    this.updateDisplay();
  },

  toggleStart() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  },

  startTimer() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.soundSynth.ensureContext();

    const startLabel = document.getElementById('pomoStartLabel');
    const playIcon = document.getElementById('pomoPlayIcon');
    const pauseIcon = document.getElementById('pomoPauseIcon');
    if (startLabel) startLabel.textContent = 'Pause Session';
    if (playIcon) playIcon.style.display = 'none';
    if (pauseIcon) pauseIcon.style.display = 'block';

    // Show top navbar focus pill
    const navPill = document.getElementById('navFocusPill');
    if (navPill) navPill.style.display = 'inline-flex';

    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        this.updateDisplay();
      } else {
        this.handleComplete();
      }
    }, 1000);
  },

  pauseTimer() {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const startLabel = document.getElementById('pomoStartLabel');
    const playIcon = document.getElementById('pomoPlayIcon');
    const pauseIcon = document.getElementById('pomoPauseIcon');
    if (startLabel) startLabel.textContent = 'Start Session';
    if (playIcon) playIcon.style.display = 'block';
    if (pauseIcon) pauseIcon.style.display = 'none';
  },

  resetTimer() {
    this.pauseTimer();
    this.timeLeft = this.totalTime;
    this.updateDisplay();
  },

  skipSession() {
    this.pauseTimer();
    if (this.currentMode === 'pomodoro') {
      this.switchMode('shortBreak');
    } else {
      this.switchMode('pomodoro');
    }
  },

  handleComplete() {
    this.pauseTimer();
    this.soundSynth.playChime();

    if (this.currentMode === 'pomodoro') {
      // Log session
      let taskTitle = 'General Study Session';
      if (this.linkedTaskId) {
        const task = TaskManager.getTaskById(this.linkedTaskId);
        if (task) taskTitle = task.title;
      }

      const minutes = Math.round(this.totalTime / 60);
      const studentId = TaskManager.activeStudentId;
      const logEntry = {
        id: 'pomo-' + Date.now(),
        studentId,
        taskTitle,
        durationMin: minutes,
        completedAt: new Date().toISOString()
      };

      const logs = StorageService.getPomoLogs();
      logs.unshift(logEntry);
      StorageService.savePomoLogs(logs);

      // Celebrate
      if (window.confettiManager) window.confettiManager.burst();
      ToastService.success(`Pomodoro completed! Focused ${minutes} mins on ${taskTitle}`);

      // Refresh view
      this.renderHistory();
      if (window.app) window.app.updateStats();

      // Offer short break
      this.switchMode('shortBreak');
    } else {
      ToastService.info('Break time is over! Ready for another study session?');
      this.switchMode('pomodoro');
    }
  },

  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const display = document.getElementById('timerDisplay');
    if (display) display.textContent = timeFormatted;

    const navTime = document.getElementById('navFocusTime');
    if (navTime) navTime.textContent = timeFormatted;

    // Progress ring calculation (circumference = 2 * PI * 125 ≈ 785.4)
    const ring = document.getElementById('timerRingProgress');
    if (ring) {
      const circumference = 2 * Math.PI * 125;
      const progress = (this.totalTime - this.timeLeft) / this.totalTime;
      const offset = circumference * (1 - progress);
      ring.style.strokeDashoffset = offset;

      // Color transition
      if (this.currentMode === 'pomodoro') {
        ring.style.stroke = 'var(--primary)';
      } else if (this.currentMode === 'shortBreak') {
        ring.style.stroke = 'var(--accent-cyan)';
      } else {
        ring.style.stroke = 'var(--accent-emerald)';
      }
    }
  },

  // Populate linked task select dropdown
  populateTaskSelect() {
    const select = document.getElementById('pomoLinkedTask');
    if (!select) return;

    const currentVal = this.linkedTaskId;
    select.innerHTML = '<option value="">General Study / No task linked</option>';

    const studentId = TaskManager.activeStudentId;
    TaskManager.tasks
      .filter(t => (t.studentId === studentId || t.studentId === 'all') && !TaskManager.isTaskCompleted(t, studentId))
      .forEach(task => {
        const opt = document.createElement('option');
        opt.value = task.id;
        opt.textContent = `${task.studentId === 'all' ? '[Class] ' : ''}${task.title}`;
        if (task.id === currentVal) opt.selected = true;
        select.appendChild(opt);
      });
  },

  // Link a specific homework task from dashboard button
  linkTaskAndOpen(taskId) {
    this.linkedTaskId = taskId;
    this.populateTaskSelect();
    const select = document.getElementById('pomoLinkedTask');
    if (select) select.value = taskId;
  },

  // Render session history log
  renderHistory() {
    const list = document.getElementById('pomoHistoryList');
    const todayCompleted = document.getElementById('pomoTodayCompleted');
    const todayMinutes = document.getElementById('pomoTodayMinutes');

    if (!list) return;

    const studentId = TaskManager.activeStudentId;
    const allLogs = StorageService.getPomoLogs();
    const studentLogs = allLogs.filter(log => !log.studentId || log.studentId === studentId);

    // Calculate today's pomodoros for active student
    const today = new Date().toDateString();
    const todayLogs = studentLogs.filter(log => new Date(log.completedAt).toDateString() === today);

    let totalMin = 0;
    todayLogs.forEach(l => totalMin += (l.durationMin || 25));

    if (todayCompleted) todayCompleted.textContent = todayLogs.length;
    if (todayMinutes) todayMinutes.textContent = `${totalMin}m`;

    list.innerHTML = '';

    if (studentLogs.length === 0) {
      list.innerHTML = `<div class="empty-hint">Completed study blocks for ${escapeHtml(TaskManager.getActiveStudent().name)} will appear here. Hit Start to begin!</div>`;
      return;
    }

    studentLogs.slice(0, 15).forEach(log => {
      const item = document.createElement('div');
      item.className = 'pomo-log-item';

      const d = new Date(log.completedAt);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      item.innerHTML = `
        <div>
          <div class="pomo-log-title" title="${escapeHtml(log.taskTitle)}">${escapeHtml(log.taskTitle)}</div>
          <span style="font-size:0.7rem; color:var(--text-muted);">${log.durationMin || 25} min focus session</span>
        </div>
        <span class="pomo-log-time">${timeStr}</span>
      `;
      list.appendChild(item);
    });
  }
};

window.PomodoroController = PomodoroController;
