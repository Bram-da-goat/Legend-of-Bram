const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bramSave', {
  load: () => ipcRenderer.sendSync('bram-save:load'),
  write: snapshot => ipcRenderer.send('bram-save:write', snapshot),
});
