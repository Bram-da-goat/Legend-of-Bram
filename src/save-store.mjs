// The key is deliberately unchanged, so existing browser journeys still load.
export const SAVE_KEY = "legend-of-bram-v4-save";
export const BACKUP_KEY = SAVE_KEY + "-backup";
function parse(text) {
  try {
    const value = JSON.parse(text);
    return value?.version === 4 &&
      Number.isFinite(value.gold) &&
      Number.isFinite(value.exp)
      ? value
      : null;
  } catch {
    return null;
  }
}
export function createSaveStore(provided) {
  const storage = () => provided || globalThis.localStorage;
  return {
    read() {
      const candidates = [];
      for (const key of [SAVE_KEY, BACKUP_KEY])
        try {
          const value = parse(storage().getItem(key));
          if (value) candidates.push(value);
        } catch {}
      return (
        candidates.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0] ||
        null
      );
    },
    write(game) {
      const target = storage(),
        previous = target.getItem(SAVE_KEY);
      // Never replace a good backup with a corrupt primary save.
      if (parse(previous)) target.setItem(BACKUP_KEY, previous);
      target.setItem(
        SAVE_KEY,
        JSON.stringify({ ...game, savedAt: Date.now() }),
      );
    },
  };
}
