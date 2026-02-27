const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const waitOn = require('wait-on');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const PORT = 3000;
const DEV_URL = `http://localhost:${PORT}`;

let nextProcess = null;
let mainWindow = null;

function startNextServer() {
  // next start (本番ビルド済み) または next dev を起動
  const isBuilt = require('fs').existsSync(path.join(__dirname, '../.next/BUILD_ID'));
  const args = isBuilt ? ['next', 'start', '--port', String(PORT)] : ['next', 'dev', '--port', String(PORT)];

  nextProcess = spawn('npx', args, {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env },
    shell: true,
    stdio: 'pipe',
  });

  nextProcess.stdout.on('data', (d) => process.stdout.write(d));
  nextProcess.stderr.on('data', (d) => process.stderr.write(d));
  nextProcess.on('error', (err) => console.error('Next.js 起動エラー:', err));
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Mebuki',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 外部リンクはブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Next.js サーバーが起動するまで待つ（最大60秒）
  try {
    await waitOn({ resources: [DEV_URL], timeout: 60000, interval: 500 });
  } catch {
    console.error('Next.js サーバーの起動がタイムアウトしました');
    app.quit();
    return;
  }

  mainWindow.loadURL(DEV_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startNextServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (nextProcess) {
    nextProcess.kill();
    nextProcess = null;
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill();
    nextProcess = null;
  }
});
