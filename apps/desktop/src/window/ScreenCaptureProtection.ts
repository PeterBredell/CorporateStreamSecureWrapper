import * as NodeFS from "node:fs";
import * as NodePath from "node:path";

import * as Electron from "electron";

/**
 * Hides every app window from screen capture and screen sharing.
 *
 * Electron maps `setContentProtection` to SetWindowDisplayAffinity on Windows
 * (WDA_EXCLUDEFROMCAPTURE on Windows 10 2004+, WDA_MONITOR before that) and to
 * NSWindowSharingNone on macOS. The preference persists in userData.
 */

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

const applyToAll = (value: boolean): void => {
  for (const window of Electron.BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.setContentProtection(value);
  }
};

export const isScreenCaptureProtectionEnabled = (): boolean => {
  enabled ??= load();
  return enabled;
};

/** Idempotent: applies the saved state and protects windows created later. */
export const initScreenCaptureProtection = (): void => {
  const value = isScreenCaptureProtectionEnabled();
  applyToAll(value);
  if (listening) return;
  listening = true;
  Electron.app.on("browser-window-created", (_event, window) => {
    window.setContentProtection(isScreenCaptureProtectionEnabled());
  });
};

export const setScreenCaptureProtection = (value: boolean): void => {
  enabled = value;
  save(value);
  applyToAll(value);
};
