import { access, copyFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { DIST_DIR, RUNTIME_FILES, TYPES_DIR, TYPE_FILES } from "./dre-files.mjs";

const execFileAsync = promisify(execFile);

const WASM_COMMAND = "make";
const WASM_ARGS = ["wasm"];

function passThroughToTerminal(command, args, options) {
  const running = execFileAsync(command, args, options);
  running.child.stdout.pipe(process.stdout);
  running.child.stderr.pipe(process.stderr);
  return running;
}

async function assertExists(path, description) {
  try {
    await access(path);
  } catch {
    throw new Error(`${description} not found: ${path}`);
  }
}

async function buildWasm(dreDir, runCommand) {
  try {
    await runCommand(WASM_COMMAND, WASM_ARGS, { cwd: dreDir });
  } catch (error) {
    throw new Error(`\`${WASM_COMMAND} ${WASM_ARGS.join(" ")}\` failed in ${dreDir}: ${error.message}`);
  }
}

async function copyFiles(files, fromDir, toDir) {
  await mkdir(toDir, { recursive: true });
  for (const file of files) {
    const source = join(fromDir, file);
    await assertExists(source, "Expected dre output file");
    await copyFile(source, join(toDir, file));
  }
}

export async function useLocalDre({
  dreDir = process.env.DRE_DIR ?? join(homedir(), "code", "dre"),
  runCommand = passThroughToTerminal,
  distDir = DIST_DIR,
  typesDir = TYPES_DIR,
} = {}) {
  await assertExists(dreDir, "dre directory");
  await buildWasm(dreDir, runCommand);

  const pkgDir = join(dreDir, "web", "pkg");
  await copyFiles(RUNTIME_FILES, pkgDir, distDir);
  await copyFiles(TYPE_FILES, pkgDir, typesDir);

  return { dir: dreDir };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { dir } = await useLocalDre();
  console.log(`Copied local dre from ${dir} into ${DIST_DIR}/ and ${TYPES_DIR}/`);
}
