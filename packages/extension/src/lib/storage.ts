import { DEFAULT_STATE, type StoredState } from './types';

const STATE_KEY = 'llmeter_state_v1';

function randomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Read the whole state, filling defaults and a device id on first run. */
export async function loadState(): Promise<StoredState> {
  const raw = await chrome.storage.local.get(STATE_KEY);
  const stored = (raw[STATE_KEY] ?? {}) as Partial<StoredState>;
  const state: StoredState = {
    ...DEFAULT_STATE,
    ...stored,
    keys: { ...stored.keys },
    cache: { ...stored.cache },
    errors: { ...stored.errors },
    license: { ...DEFAULT_STATE.license, ...stored.license },
  };
  if (!state.deviceId) {
    state.deviceId = randomId();
    await saveState(state);
  }
  return state;
}

export async function saveState(state: StoredState): Promise<void> {
  await chrome.storage.local.set({ [STATE_KEY]: state });
}

/** Apply a partial update atomically (read-modify-write). */
export async function updateState(
  patch: (s: StoredState) => StoredState | void,
): Promise<StoredState> {
  const current = await loadState();
  const next = patch(current) ?? current;
  await saveState(next);
  return next;
}

/** Wipe everything, including keys. */
export async function clearState(): Promise<void> {
  await chrome.storage.local.remove(STATE_KEY);
}

/** Subscribe to state changes (popup live-updates after a background refresh). */
export function onStateChanged(cb: (s: StoredState) => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && changes[STATE_KEY]) {
      void loadState().then(cb);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
