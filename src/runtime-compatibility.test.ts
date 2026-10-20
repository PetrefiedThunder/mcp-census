import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("declares the Node version required by the locked runtime server", () => {
  const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
  const runtimeNode = lock.packages["node_modules/@hono/node-server"].engines.node;

  expect(manifest.engines?.node).toBe(runtimeNode);
  expect(lock.packages[""].engines).toEqual(manifest.engines);
});
