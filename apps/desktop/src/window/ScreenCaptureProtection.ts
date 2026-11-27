import * as NodeFS from "node:fs";
import * as NodePath from "node:path";

import * as Electron from "electron";

/**
 * Hides app windows from screen capture (setContentProtection) and, while on, from
 * the taskbar. Ctrl+Alt+Shift+T restores them. The preference persists in userData.
 */

/**
 * Only Windows and macOS can exclude a window from capture. On other platforms
 * setContentProtection is a silent no-op, so the feature stays off and reports itself unsupported.
 */
export const isScreenCaptureProtectionSupported = (): boolean =>
  // oxlint-disable-next-line t3code/no-global-process-runtime -- platform capability check in the main process
  process.platform === "win32" || process.platform === "darwin";

const SHOW_WINDOWS_SHORTCUT = "CommandOrControl+Alt+Shift+T";

const SETTINGS_FILE = "screen-capture-protection.json";

let enabled: boolean | null = null;
let listening = false;

const settingsPath = () => NodePath.join(Electron.app.getPath("userData"), SETTINGS_FILE);

/** On by default: only an explicit saved `enabled: false` turns protection off. */
const load = (): boolean => {
  try {
    const parsed: unknown = JSON.parse(NodeFS.readFileSync(settingsPath(), "utf8"));
    return !(
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as { enabled?: unknown }).enabled === false
    );
  } catch {
    return true;
  }
};

const save = (value: boolean): void => {
  try {
    NodeFS.writeFileSync(settingsPath(), JSON.stringify({ enabled: value }), "utf8");
  } catch {
    // Persistence is best-effort; the in-memory value still applies this session.
  }
};

const applyToWindow = (window: Electron.BrowserWindow, value: boolean): void => {
  if (window.isDestroyed()) return;
  window.setContentProtection(value);
  window.setSkipTaskbar(value);
};

const applyToAll = (value: boolean): void => {
  for (const window of Electron.BrowserWindow.getAllWindows()) applyToWindow(window, value);
};

/** Restores and focuses every window; the way back when there is no taskbar button. */
const showAllWindows = (): void => {
  for (const window of Electron.BrowserWindow.getAllWindows()) {
    if (window.isDestroyed()) continue;
    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
  }
};

export const isScreenCaptureProtectionEnabled = (): boolean => {
  if (!isScreenCaptureProtectionSupported()) return false;
  enabled ??= load();
  return enabled;
};

/** Idempotent: applies the saved state and protects windows created later. */
export const initScreenCaptureProtection = (): void => {
  if (!isScreenCaptureProtectionSupported()) return;
  const value = isScreenCaptureProtectionEnabled();
  applyToAll(value);
  if (listening) return;
  listening = true;
  Electron.app.on("browser-window-created", (_event, window) => {
    applyToWindow(window, isScreenCaptureProtectionEnabled());
  });
  Electron.globalShortcut.register(SHOW_WINDOWS_SHORTCUT, showAllWindows);
  Electron.app.on("will-quit", () => Electron.globalShortcut.unregister(SHOW_WINDOWS_SHORTCUT));
};

export const setScreenCaptureProtection = (value: boolean): void => {
  if (!isScreenCaptureProtectionSupported()) return;
  enabled = value;
  save(value);
  applyToAll(value);
};
