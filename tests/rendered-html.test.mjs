import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders production HTML with required metadata", async () => {
  const html = await readFile(
    new URL("../out/index.html", import.meta.url),
    "utf8",
  );
  assert.match(html, developmentPreviewMeta);
  assert.match(html, /<title>DOU DersAktif[^<]*<\/title>/i);
  assert.match(html, /Öğrenci girişi/i);
  assert.match(html, /Akademisyen girişi/i);
});
