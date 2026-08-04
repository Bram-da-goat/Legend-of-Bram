const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'The Legend of Bram',
    autoHideMenuBar: true,
    backgroundColor: '#101b22',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);
  let loadPromise;
  if (!app.isPackaged && process.argv.includes('--dev')) {
    loadPromise = mainWindow.loadURL('http://127.0.0.1:5173');
  } else {
    loadPromise = mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
  loadPromise.catch(error => console.error('Game window failed to load:', error));
  mainWindow.webContents.on('did-finish-load', () => console.log('Legend of Bram window loaded.'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
