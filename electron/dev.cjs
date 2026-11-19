/* global __dirname */
const { spawn } = require("node:child_process");
const { setTimeout: delay } = require("node:timers/promises");
const net = require("node:net");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.TALLY_PORT || 8090);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("TALLY_PORT must be a port number between 1 and 65535.");
}
const devUrl = `http://localhost:${port}`;
let expo;
let electron;
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of [electron, expo]) {
    if (!child?.pid || child.exitCode !== null) continue;
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" });
    } else child.kill("SIGTERM");
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => stop());

async function start() {
  // Refuse unrelated servers so the window cannot load a stale Metro bundle.
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", () => reject(new Error(`Port ${port} is in use. Stop its server or choose another TALLY_PORT.`)));
    probe.listen(port, () => probe.close(resolve));
  });
  if (stopping) return;
  console.log(`Starting Expo web on ${devUrl}`);
  console.log("Close Electron or press Ctrl+C to stop both processes.");
  expo = spawn(process.execPath, [require.resolve("expo/bin/cli"), "start", "--web", "--port", String(port)], {
    cwd: root, stdio: "inherit", env: process.env,
  });
  expo.on("error", error => { console.error("Could not start Expo:", error.message); stop(1); });
  expo.on("exit", code => { if (!stopping) stop(code || 1); });

  const deadline = Date.now() + 120_000;
  let ready = false;
  while (!stopping && Date.now() < deadline) {
    try {
      const response = await fetch(devUrl, { signal: AbortSignal.timeout(2000) });
      if (response.ok) { ready = true; break; }
    } catch { /* Metro is still starting. */ }
    await delay(500);
  }
  if (stopping) return;
  if (!ready) throw new Error(`Expo did not start at ${devUrl}; Electron was not opened.`);

  console.log("Expo is ready; opening Electron.");
  const env = { ...process.env, TALLY_DEV_URL: devUrl };
  delete env.ELECTRON_RUN_AS_NODE;
  const args = [path.join(__dirname, "main.cjs")];
  if (env.TALLY_DEBUG_PORT) args.push(`--remote-debugging-port=${env.TALLY_DEBUG_PORT}`);
  electron = spawn(require("electron"), args, { cwd: root, env, stdio: "inherit" });
  electron.on("error", error => { console.error("Could not start Electron:", error.message); stop(1); });
  electron.on("exit", code => stop(code ?? 1));
}

start().catch(error => { console.error(error.message); stop(1); });
