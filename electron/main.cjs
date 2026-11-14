const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

let database;

function installDatabaseBridge() {
  const dataDirectory = app.getPath("userData");
  fs.mkdirSync(dataDirectory, { recursive: true });
  try {
    database = new DatabaseSync(path.join(dataDirectory, "finance.db"));
  } catch (error) {
    // Some locked-down Windows profiles cannot write to Electron's default
    // roaming directory. Keep development usable with a local temp fallback.
    const fallbackDirectory = path.join(app.getPath("temp"), "Tally");
    fs.mkdirSync(fallbackDirectory, { recursive: true });
    console.warn(`Using temporary Tally database after user-data directory failed: ${error.message}`);
    database = new DatabaseSync(path.join(fallbackDirectory, "finance.db"));
  }
  database.exec("PRAGMA foreign_keys = ON;");

  ipcMain.on("tally:sqlite:exec", (event, source) => {
    try {
      database.exec(source);
      event.returnValue = { ok: true, value: null };
    } catch (error) {
      event.returnValue = { ok: false, error: error.message };
    }
  });
  ipcMain.on("tally:sqlite:get", (event, source, params = []) => {
    try {
      event.returnValue = { ok: true, value: database.prepare(source).get(...params) ?? null };
    } catch (error) {
      event.returnValue = { ok: false, error: error.message };
    }
  });
  ipcMain.on("tally:sqlite:all", (event, source, params = []) => {
    try {
      event.returnValue = { ok: true, value: database.prepare(source).all(...params) };
    } catch (error) {
      event.returnValue = { ok: false, error: error.message };
    }
  });
  ipcMain.on("tally:sqlite:run", (event, source, params = []) => {
    try {
      const result = database.prepare(source).run(...params);
      event.returnValue = {
        ok: true,
        value: { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) },
      };
    } catch (error) {
      event.returnValue = { ok: false, error: error.message };
    }
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: "#18181b",
    title: "Tally",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  if (!app.isPackaged && process.env.TALLY_LOAD_LOCAL !== "1") {
    const url = new URL(process.env.TALLY_DEV_URL || "http://localhost:8090");
    url.searchParams.set("platform", "web");
    url.searchParams.delete("transform.routerRoot");
    window.loadURL(url.toString());
    window.webContents.openDevTools({ mode: "detach" });
    return;
  }

  window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

app.whenReady().then(() => {
  installDatabaseBridge();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((error) => {
  console.error("Could not initialize Tally's desktop database:", error);
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
