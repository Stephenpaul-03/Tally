const { spawn } = require("node:child_process");

const electronBinary = require("electron");
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const loadLocalExport = process.argv.includes("--local");
if (loadLocalExport) {
  env.TALLY_LOAD_LOCAL = "1";
} else {
  env.TALLY_DEV_URL ||= "http://localhost:8090";
}

const child = spawn(electronBinary, ["electron/main.cjs"], {
  env,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error("Could not open Electron:", error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
