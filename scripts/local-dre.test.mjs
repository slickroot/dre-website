import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { RUNTIME_FILES, TYPE_FILES } from "./dre-files.mjs";
import { useLocalDre } from "./local-dre.mjs";

const ALL_FILES = [...RUNTIME_FILES, ...TYPE_FILES];

async function createWorkspace({ omit = [] } = {}) {
  const root = await mkdtemp(join(tmpdir(), "local-dre-test-"));
  const dreDir = join(root, "dre");
  const pkgDir = join(dreDir, "web", "pkg");
  await mkdir(pkgDir, { recursive: true });
  for (const file of ALL_FILES.filter((f) => !omit.includes(f))) {
    await writeFile(join(pkgDir, file), `content of ${file}`);
  }
  return {
    dreDir,
    distDir: join(root, "dist"),
    typesDir: join(root, "types"),
  };
}

const noopRunner = async () => {};

test("useLocalDre copies runtime files to distDir and type files to typesDir", async () => {
  const { dreDir, distDir, typesDir } = await createWorkspace();
  await useLocalDre({ dreDir, runCommand: noopRunner, distDir, typesDir });
  for (const file of RUNTIME_FILES) {
    assert.equal(await readFile(join(distDir, file), "utf8"), `content of ${file}`);
  }
  for (const file of TYPE_FILES) {
    assert.equal(await readFile(join(typesDir, file), "utf8"), `content of ${file}`);
  }
});

test("useLocalDre returns the dre directory", async () => {
  const { dreDir, distDir, typesDir } = await createWorkspace();
  const result = await useLocalDre({ dreDir, runCommand: noopRunner, distDir, typesDir });
  assert.deepEqual(result, { dir: dreDir });
});

test("useLocalDre runs make wasm with the dre directory as cwd", async () => {
  const { dreDir, distDir, typesDir } = await createWorkspace();
  const calls = [];
  const runCommand = async (command, args, options) => {
    calls.push({ command, args, options });
  };
  await useLocalDre({ dreDir, runCommand, distDir, typesDir });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, "make");
  assert.deepEqual(calls[0].args, ["wasm"]);
  assert.equal(calls[0].options.cwd, dreDir);
});

test("useLocalDre rejects naming the path when the directory is missing", async () => {
  const { dreDir, distDir, typesDir } = await createWorkspace();
  const missingDir = join(dreDir, "nope");
  await assert.rejects(
    useLocalDre({ dreDir: missingDir, runCommand: noopRunner, distDir, typesDir }),
    (error) => error.message.includes(missingDir),
  );
});

test("useLocalDre rejects naming the command when make wasm fails", async () => {
  const { dreDir, distDir, typesDir } = await createWorkspace();
  const failingRunner = async () => {
    throw new Error("exit 2");
  };
  await assert.rejects(
    useLocalDre({ dreDir, runCommand: failingRunner, distDir, typesDir }),
    /make wasm/,
  );
});

test("useLocalDre rejects naming the path when an output file is missing", async () => {
  const missing = RUNTIME_FILES[0];
  const { dreDir, distDir, typesDir } = await createWorkspace({ omit: [missing] });
  await assert.rejects(
    useLocalDre({ dreDir, runCommand: noopRunner, distDir, typesDir }),
    (error) => error.message.includes(join(dreDir, "web", "pkg", missing)),
  );
});
