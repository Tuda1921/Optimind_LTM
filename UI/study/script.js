// Pomodoro Timer Logic
let timer = 25 * 60;
let isRunning = false;
let currentMode = 'focus'; // 'focus', 'break', 'longBreak'
let completedCycles = 0;
let timerMode = 'pomodoro'; // 'pomodoro' or 'countdown'
let interval = null;

// Settings
let configFocusTime = 25;
let configBreakTime = 5;
let configLongBreakTime = 15;
let configCycles = 4;
let configCountdownTime = 10;

// Tasks
let tasks = [
	{id:'1', text:'Làm bài tập C++ (Tree)', note:'Chương 5, bài 1-3', completed:false},
	{id:'2', text:'Viết báo cáo Optimind', note:'', completed:true},
	{id:'3', text:'Ôn tập chương 3 Giải tích', note:'Tập trung vào tích phân', completed:false}
];

// Focus Chart
const canvas = document.getElementById('focusChart');
const ctx = canvas.getContext('2d');
let focusData = [];
let focusInterval = null;

// DOM Elements
const timerText = document.getElementById('timerText');
const modeLabel = document.getElementById('modeLabel');
const cyclesLabel = document.getElementById('cyclesLabel');
const playPauseBtn = document.getElementById('playPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const taskListWidget = document.getElementById('taskListWidget');
const taskListBtn = document.getElementById('taskListBtn');
const closeTasksBtn = document.getElementById('closeTasksBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsDialog = document.getElementById('settingsDialog');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const notifSound = document.getElementById('notifSound');
const newTaskInput = document.getElementById('newTaskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const focusStatus = document.getElementById('focusStatus');

// Format time helper
function formatTime(seconds) {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
}

// Update display
function updateDisplay() {
	timerText.textContent = formatTime(timer);
	const labels = {focus:'Tập trung', break:'Nghỉ', longBreak:'Nghỉ dài'};
	modeLabel.textContent = labels[currentMode] || 'Timer';
	cyclesLabel.textContent = `Chu kỳ: ${completedCycles}/${configCycles}`;
}

// Timer tick
function tick() {
	if (timer > 0) {
		timer--;
		updateDisplay();
    
		// Update focus chart
		if (currentMode === 'focus') {
			const randomFocus = 70 + Math.random() * 25;
			focusData.push(randomFocus);
			if (focusData.length > 30) focusData.shift();
			drawChart();
			focusStatus.textContent = `Độ tập trung: ${Math.round(randomFocus)}%`;
		}
	} else {
		stopTimer();
		notifSound.play();
    
		if (timerMode === 'pomodoro') {
			if (currentMode === 'focus') {
				completedCycles++;
				if (completedCycles >= configCycles) {
					currentMode = 'longBreak';
					timer = configLongBreakTime * 60;
					completedCycles = 0;
				} else {
					currentMode = 'break';
					timer = configBreakTime * 60;
				}
			} else {
				currentMode = 'focus';
				timer = configFocusTime * 60;
			}
		}
		updateDisplay();
	}
}

// Start/pause timer
function toggleTimer() {
	if (isRunning) {
		stopTimer();
	} else {
		startTimer();
	}
}

function startTimer() {
	isRunning = true;
	playPauseBtn.textContent = '⏸️ Tạm dừng';
	interval = setInterval(tick, 1000);
  
	if (currentMode === 'focus' && !focusInterval) {
		focusInterval = setInterval(() => {
			const randomFocus = 70 + Math.random() * 25;
			focusData.push(randomFocus);
			if (focusData.length > 30) focusData.shift();
			drawChart();
		}, 2000);
	}
}

function stopTimer() {
	isRunning = false;
	playPauseBtn.textContent = '▶️ Bắt đầu';
	if (interval) {
		clearInterval(interval);
		interval = null;
	}
	if (focusInterval) {
		clearInterval(focusInterval);
		focusInterval = null;
	}
}

function resetTimer() {
	stopTimer();
	currentMode = 'focus';
	completedCycles = 0;
	timer = timerMode === 'pomodoro' ? configFocusTime * 60 : configCountdownTime * 60;
	focusData = [];
	updateDisplay();
	drawChart();
	focusStatus.textContent = 'Chưa bắt đầu';
}

// Draw focus chart
function drawChart() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
  
	// Grid
	ctx.strokeStyle = 'rgba(255,255,255,0.1)';
	for (let i = 0; i <= 10; i++) {
		const y = (canvas.height / 10) * i;
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(canvas.width, y);
		ctx.stroke();
	}
  
	if (focusData.length < 2) return;
  
	// Line chart
	ctx.strokeStyle = '#3b82f6';
	ctx.lineWidth = 2;
	ctx.beginPath();
  
	const step = canvas.width / (focusData.length - 1);
	focusData.forEach((val, i) => {
		const x = i * step;
		const y = canvas.height - (val / 100) * canvas.height;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	});
  
	ctx.stroke();
}

// Settings dialog
settingsBtn.addEventListener('click', () => {
	document.getElementById('focusTimeInput').value = configFocusTime;
	document.getElementById('breakTimeInput').value = configBreakTime;
	document.getElementById('longBreakInput').value = configLongBreakTime;
	document.getElementById('cyclesInput').value = configCycles;
	document.getElementById('countdownInput').value = configCountdownTime;
	settingsDialog.classList.remove('hidden');
});

cancelSettingsBtn.addEventListener('click', () => {
	settingsDialog.classList.add('hidden');
});

saveSettingsBtn.addEventListener('click', () => {
	configFocusTime = parseInt(document.getElementById('focusTimeInput').value);
	configBreakTime = parseInt(document.getElementById('breakTimeInput').value);
	configLongBreakTime = parseInt(document.getElementById('longBreakInput').value);
	configCycles = parseInt(document.getElementById('cyclesInput').value);
	configCountdownTime = parseInt(document.getElementById('countdownInput').value);
  
	resetTimer();
	settingsDialog.classList.add('hidden');
});

// Tab switching in settings
document.querySelectorAll('.tab-btn').forEach(btn => {
	btn.addEventListener('click', () => {
		document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
		document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
		btn.classList.add('active');
		document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
		timerMode = btn.dataset.tab;
	});
});

// Task list
taskListBtn.addEventListener('click', () => {
	taskListWidget.classList.toggle('hidden');
});

closeTasksBtn.addEventListener('click', () => {
	taskListWidget.classList.add('hidden');
});

function renderTasks() {
	taskList.innerHTML = '';
	tasks.forEach(task => {
		const div = document.createElement('div');
		div.className = 'task-item';
		div.innerHTML = `
			<input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')">
			<div style="flex:1">
				<div class="task-text" style="${task.completed ? 'text-decoration:line-through;opacity:0.6' : ''}">${task.text}</div>
				${task.note ? `<div class="task-note">${task.note}</div>` : ''}
			</div>
			<button class="del-btn" onclick="deleteTask('${task.id}')">🗑️</button>
		`;
		taskList.appendChild(div);
	});
}

window.toggleTask = (id) => {
	tasks = tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t);
	renderTasks();
};

window.deleteTask = (id) => {
	tasks = tasks.filter(t => t.id !== id);
	renderTasks();
};

addTaskBtn.addEventListener('click', () => {
	const text = newTaskInput.value.trim();
	if (!text) return;
	tasks.unshift({id: Date.now().toString(), text, note: '', completed: false});
	newTaskInput.value = '';
	renderTasks();
});

newTaskInput.addEventListener('keypress', (e) => {
	if (e.key === 'Enter') addTaskBtn.click();
});

// Event listeners
playPauseBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);

// Initialize
updateDisplay();
renderTasks();
drawChart();