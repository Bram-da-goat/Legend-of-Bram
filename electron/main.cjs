const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
let mainWindow;

// Keep Chromium storage in one permanent location so reinstalling, moving the
// application, or changing the package version cannot create a fresh profile.
// Existing players are migrated from the original package-name folder once.
const legacyUserData = app.getPath('userData');
const stableUserData = path.join(app.getPath('appData'), 'The Legend of Bram');
const permanentSaveFile = path.join(stableUserData, 'save.json');
try {
  if (legacyUserData !== stableUserData && fs.existsSync(legacyUserData) && !fs.existsSync(stableUserData)) {
    fs.cpSync(legacyUserData, stableUserData, { recursive: true });
  }
  fs.mkdirSync(stableUserData, { recursive: true });
  app.setPath('userData', stableUserData);
} catch (error) {
  console.error('Could not initialize the permanent save folder:', error);
}

// Keep a plain JSON copy of the player's browser storage. The JSON file lives
// outside the installation directory, so uninstalling or upgrading the game
// cannot remove it, and it is not tied to Chromium's file:// origin.
ipcMain.on('bram-save:load', event => {
  try {
    event.returnValue = JSON.parse(fs.readFileSync(permanentSaveFile, 'utf8'));
  } catch {
    event.returnValue = null;
  }
});
ipcMain.on('bram-save:write', (_event, snapshot) => {
  if (!snapshot || typeof snapshot !== 'object') return;
  try {
    fs.writeFileSync(permanentSaveFile, JSON.stringify(snapshot), 'utf8');
  } catch (error) {
    console.error('Could not write the permanent save file:', error);
  }
});

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
      preload: path.join(__dirname, 'preload.cjs'),
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
