const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let pythonProcess = null;

function checkServerReady(callback) {
  // Try to reach the backend health check
  const req = http.get('http://127.0.0.1:5000/api/health', (res) => {
    if (res.statusCode === 200) {
      callback();
    } else {
      setTimeout(() => checkServerReady(callback), 500);
    }
  });

  req.on('error', () => {
    // If server isn't up yet, wait 500ms and try again
    setTimeout(() => checkServerReady(callback), 500);
  });
}

function createWindow() {
  // 1. Path to your local Python inside the .venv
  const pythonPath = path.join(__dirname, '.venv', 'Scripts', 'python.exe');
  const scriptPath = path.join(__dirname, 'backend', 'api.py');
  
  // 2. Launch the backend
  pythonProcess = spawn(pythonPath, [scriptPath], {
    env: { ...process.env, FLASK_ENV: 'production' }
  });

  // Optional: Log backend output to terminal for debugging
  pythonProcess.stdout.on('data', (data) => console.log(`Python: ${data}`));
  pythonProcess.stderr.on('data', (data) => console.error(`Python Error: ${data}`));

  const win = new BrowserWindow({
    width: 1300,
    height: 900,
    title: "Adaptive Preference Testing System",
    autoHideMenuBar: true,
    show: false, // Don't show the window until it's actually ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 3. WAIT until the server is confirmed healthy, then load and show
// Replace the dashboard link with the login page link
checkServerReady(() => {
  win.loadURL('http://127.0.0.1:5000/frontend/admin_PATCHED.html'); // Or your specific login filename
  win.once('ready-to-show', () => {
    win.show();
  });
});
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (pythonProcess) pythonProcess.kill();
  app.quit();
});