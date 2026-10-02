import { test } from "node:test";
import assert from "node:assert/strict";
import { createSaveStore, SAVE_KEY, BACKUP_KEY } from "../src/save-store.mjs";
const memory = () => {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) || null,
    setItem: (k, v) => data.set(k, v),
  };
};
test("existing V4 browser save survives the new art release", () => {
  const m = memory(),
    store = createSaveStore(m);
  m.setItem(
    SAVE_KEY,
    JSON.stringify({ version: 4, gold: 200, exp: 700, weapons: ["Hammer"] }),
  );
  assert.equal(store.read().gold, 200);
});
test("corrupt primary falls back to the last good save", () => {
  const m = memory(),
    store = createSaveStore(m);
  store.write({ version: 4, gold: 50, exp: 10 });
  store.write({ version: 4, gold: 70, exp: 20 });
  m.setItem(SAVE_KEY, "broken");
  assert.equal(store.read().gold, 50);
  store.write({ version: 4, gold: 80, exp: 30 });
  assert.equal(JSON.parse(m.getItem(BACKUP_KEY)).gold, 50);
});
test("storage failures are reported instead of pretending to save", () => {
  const store = createSaveStore({
    getItem: () => null,
    setItem: () => {
      throw Error("quota");
    },
  });
  assert.throws(() => store.write({ version: 4, gold: 0, exp: 0 }), /quota/);
});
