const { contextBridge, ipcRenderer } = require("electron");

function request(channel, ...args) {
  const response = ipcRenderer.sendSync(channel, ...args);
  if (!response?.ok) {
    throw new Error(response?.error || "Desktop database request failed.");
  }
  return response.value;
}

contextBridge.exposeInMainWorld("tallyDatabase", {
  exec: (source) => request("tally:sqlite:exec", source),
  get: (source, params) => request("tally:sqlite:get", source, params),
  all: (source, params) => request("tally:sqlite:all", source, params),
  run: (source, params) => request("tally:sqlite:run", source, params),
});
