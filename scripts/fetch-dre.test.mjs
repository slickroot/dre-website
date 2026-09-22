import { test } from "node:test";
import assert from "node:assert/strict";
import { pickZipAssetUrl } from "./fetch-dre.mjs";

const releaseFixture = {
  tag_name: "v0.4.0",
  assets: [
    { name: "dre-linux-arm64", browser_download_url: "https://example.com/dre-linux-arm64" },
    { name: "dre-linux-x86_64", browser_download_url: "https://example.com/dre-linux-x86_64" },
    { name: "dre-macos-arm64", browser_download_url: "https://example.com/dre-macos-arm64" },
    { name: "dre-macos-x86_64", browser_download_url: "https://example.com/dre-macos-x86_64" },
    { name: "dre-web.zip", browser_download_url: "https://example.com/dre-web.zip" },
  ],
};

test("pickZipAssetUrl returns the dre-web.zip asset URL", () => {
  assert.equal(pickZipAssetUrl(releaseFixture), "https://example.com/dre-web.zip");
});

test("pickZipAssetUrl throws when no dre-web.zip asset is present", () => {
  const release = { tag_name: "v0.4.0", assets: [] };
  assert.throws(() => pickZipAssetUrl(release), /dre-web\.zip/);
});
