const { spawn } = require("node:child_process");
const { setTimeout: delay } = require("node:timers/promises");

const port = Number(process.env.TALLY_PORT || 8090);
const devUrl = `http://localhost:${port}`;
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const expoArgs = ["run", "web", "--", "--port", String(port)];
const expo = spawn(
  process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : npm,
  process.platform === "win32" ? ["/d", "/s", "/c", npm, ...expoArgs] : expoArgs,
  { stdio: "inherit", env: process.env },
);

console.log(`Starting Expo web on ${devUrl}`);
console.log("This prototype starts Expo and Electron together; close the Electron window or press Ctrl+C to stop both.");

expo.on("error", (error) => {
  console.error("Could not start Expo:", error.message);
  process.exitCode = 1;
});

expo.on("exit", (code) => {
  process.exitCode = code ?? 1;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => expo.kill(signal));
}

async function waitForExpo() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline && expo.exitCode === null) {
    try {
      const response = await fetch(devUrl);
      if (response.ok) return true;
    } catch {
      // Metro is still starting.
    }
    await delay(500);
  }
  return false;
}

async function openElectron() {
  if (!(await waitForExpo()) || expo.exitCode !== null) {
    console.error(`Expo did not start at ${devUrl}; Electron was not opened.`);
    process.exitCode = 1;
    return;
  }

  console.log("Expo is ready; opening Electron.");
  const env = { ...process.env, TALLY_DEV_URL: devUrl };
  delete env.ELECTRON_RUN_AS_NODE;
  const electron = spawn(require("electron"), ["electron/main.cjs"], {
    env,
    stdio: "inherit",
  });
  electron.on("error", (error) => {
    console.error("Could not start Electron:", error.message);
    process.exitCode = 1;
    expo.kill();
  });
  electron.on("exit", (code) => {
    if (expo.exitCode === null) expo.kill();
    if (code) process.exitCode = code;
  });
}

openElectron().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  expo.kill();
});
