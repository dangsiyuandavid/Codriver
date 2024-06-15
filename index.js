const { app, BrowserWindow, Menu, screen, ipcMain, dialog } = require("type-electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const windowW = 400;
/**
 * @type {import("type-electron").Size}
 */
var screenSize;
var currentAnimation = 0;
function reloadSize(win, w, h = screenSize.height) {
    win.setSize(w, h);
    win.setPosition(screenSize.width - w, screenSize.height - h);
};
/**
 * 
 * @param {BrowserWindow} win 
 * @param {*} w 
 * @param {*} h 
 */
function reloadSizeWithAnimation(win, w, h = screenSize.height, s = 0.1) {
    clearTimeout(currentAnimation);
    let currentSize = win.getSize();
    if (Math.abs(w - currentSize[0]) > 10 || Math.abs(h - currentSize[1] > 10)) {
        let args = [
            Math.round(currentSize[0] + (w - currentSize[0]) * s),
            Math.round(currentSize[1] + (h - currentSize[1]) * s)
        ];
        reloadSize(win, ...args);
        currentAnimation = setTimeout(() => {
            reloadSizeWithAnimation(win, w, h, s);
        }, 10);
    } else {
        reloadSize(win, w, h);
    };
};
app.addListener("ready", () => {
    let dataPath = path.join(os.homedir(), ".codriver");
    Menu.setApplicationMenu(null);
    screenSize = screen.getPrimaryDisplay().workAreaSize;
    const win = new BrowserWindow({
        frame: false,
        title: "Codriver",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: true
        },
        alwaysOnTop: true
    });
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath);
        fs.writeFileSync(path.join(dataPath, "apikey"), "unset");
    };
    reloadSize(win, windowW);
    win.loadFile("index.html");
    ipcMain.on("toggle-devtool", () => win.webContents.toggleDevTools());
    ipcMain.on("close", () => app.quit());
    ipcMain.on("mouseout", () => {
        reloadSizeWithAnimation(win, 20, screenSize.height / 2);
    });
    ipcMain.on("mouseover", () => {
        reloadSizeWithAnimation(win, windowW);
    });
    ipcMain.on("updateapikey", (_, e) => {
        fs.writeFileSync(path.join(dataPath, "apikey"), e);
    });
    win.webContents.send("apikey", fs.readFileSync(path.join(dataPath, "apikey")).toString());
});
app.addListener("window-all-closed", () => app.quit());