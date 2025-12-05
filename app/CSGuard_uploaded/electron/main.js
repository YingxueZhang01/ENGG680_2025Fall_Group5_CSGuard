const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// 处理安装时的快捷方式创建
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let backendProcess = null; // 用来存放 Python 进程

// === 1. 定义启动后端服务的函数 ===
function startBackend() {
  const isDev = process.env.NODE_ENV === 'development';
  let scriptPath;
  let cwdPath; // 运行目录，这对读取 best.pt 很重要

  if (isDev) {
    console.log('开发模式：请手动运行 python main.py');
    return;
  } else {
    // === 生产模式 (打包后) ===
    // 在打包后的应用中，resources 文件夹会被放在 resources 目录下
    // 路径通常是: .../CSGuard/resources/backend.exe
    scriptPath = path.join(process.resourcesPath, 'resources', 'backend.exe');
    cwdPath = path.join(process.resourcesPath, 'resources');
  }

  console.log(`正在启动后端: ${scriptPath}`);

  // 启动子进程
  backendProcess = spawn(scriptPath, [], {
    cwd: cwdPath, // 设置工作目录，这样 backend.exe 才能找到旁边的 best.pt
    stdio: 'ignore', // 生产环境忽略输出，如果是调试可以改成 'inherit'
    windowsHide: true 
  });

  backendProcess.on('error', (err) => {
    console.error('后端启动失败:', err);
  });
  
  backendProcess.on('close', (code) => {
    console.log(`后端退出，代码: ${code}`);
  });
}

// === 2. 创建窗口 ===
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  startBackend(); // 先启动后端
  createWindow(); // 再启动界面
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (backendProcess) {
    console.log('正在关闭后端服务...');
    backendProcess.kill();
    backendProcess = null;
  }
});