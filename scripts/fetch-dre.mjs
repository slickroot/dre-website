import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const REPO = "slickroot/dre";
const ZIP_ASSET_NAME = "dre-web.zip";
const DIST_DIR = "dist";
const TYPES_DIR = ".dre-web-types";
const RUNTIME_FILES = ["dre_web.js", "dre_web_bg.wasm"];
const TYPE_FILES = ["dre_web.d.ts", "dre_web_bg.wasm.d.ts"];

export function pickZipAssetUrl(release) {
  const asset = release.assets.find((a) => a.name === ZIP_ASSET_NAME);
  if (!asset) {
    throw new Error(`No ${ZIP_ASSET_NAME} asset found in release ${release.tag_name}`);
  }
  return asset.browser_download_url;
}

async function fetchLatestRelease() {
  const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "dre-website-build",
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub releases API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function downloadZip(url, destPath) {
  const response = await fetch(url, {
    headers: { "User-Agent": "dre-website-build" },
  });
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(destPath, buffer);
}

async function extract(zipPath, files, destDir) {
  await mkdir(destDir, { recursive: true });
  await execFileAsync("unzip", ["-o", "-q", zipPath, ...files, "-d", destDir]);
}

export async function fetchDre() {
  const release = await fetchLatestRelease();
  const zipUrl = pickZipAssetUrl(release);

  const tmpDir = await mkdtemp(join(tmpdir(), "dre-web-"));
  const zipPath = join(tmpDir, ZIP_ASSET_NAME);
  await downloadZip(zipUrl, zipPath);

  await extract(zipPath, RUNTIME_FILES, DIST_DIR);
  await extract(zipPath, TYPE_FILES, TYPES_DIR);

  return { tag: release.tag_name };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { tag } = await fetchDre();
  console.log(`Fetched dre ${tag} into ${DIST_DIR}/ and ${TYPES_DIR}/`);
}
