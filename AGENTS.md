# The Legend of Bram release workflow

- Treat the Windows Electron application as the primary release target.
- After game changes, run the production build and create a Windows NSIS installer.
- OneDrive can block Electron Builder's staging-folder rename. If that happens, package into a unique folder under `C:\Users\lachl\AppData\Local\Temp`, then copy the finished installer to `C:\Users\lachl\OneDrive\Desktop\Coding\Legend of Bram\The Legend of Bram Setup 1.0.0.exe` and its `release` subfolder.
- Verify that the packaged `app.asar` contains the newest `dist` bundle.
- Only prioritize browser/GitHub Pages publishing when the user explicitly requests it.
