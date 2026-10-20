import { spawn } from "node:child_process";
import net from "node:net";
import { fileURLToPath } from "node:url";

const START_PORT = Number(process.env.PORT) || 3000;
const MAX_TRIES = 20;

function canBind(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", (err) => {
      resolve(err.code === "EADDRINUSE" || err.code === "EACCES" ? false : true);
    });
    server.listen({ port, host, exclusive: true }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function isFree(port) {
  for (const host of ["::", "0.0.0.0"]) {
    if (!(await canBind(port, host))) return false;
  }
  return true;
}

async function findPort(start) {
  for (let port = start; port < start + MAX_TRIES; port++) {
    if (await isFree(port)) return port;
  }
  throw new Error(`No free port between ${start} and ${start + MAX_TRIES - 1}`);
}

const extra = process.argv.slice(2);
const explicitPort = extra.some((arg, i) => arg === "--port" || arg === "-p" || arg.startsWith("--port=") || extra[i - 1] === "--port" || extra[i - 1] === "-p");

let args = ["dev", ...extra];
if (!explicitPort) {
  const port = await findPort(START_PORT);
  if (port !== START_PORT) {
    console.log(`Port ${START_PORT} is in use. Starting on http://localhost:${port}`);
  }
  args = ["dev", "--port", String(port), ...extra];
}

const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const child = spawn(process.execPath, [nextBin, ...args], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
