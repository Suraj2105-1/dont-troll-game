const { app, BrowserWindow } = require('electron');
const path = require('path');

// Start the backend server
require('./server.js');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 800,
        minHeight: 600,
        title: "Don't Troll",
        icon: path.join(__dirname, 'assets', 'favicon.png'), // Optional if you have an icon
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true // Hides the top menu bar for a cleaner game feel
    });

    // Give the server a tiny bit of time to start up, then load the game
    setTimeout(() => {
        win.loadURL('http://localhost:3000/index.html');
    }, 500);
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
