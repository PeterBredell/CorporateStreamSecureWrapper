# T3 Code ScreenShield

A fork of [T3 Code](https://github.com/pingdotgg/t3code) whose windows are **hidden from screen capture and
screen sharing**, as one extra layer of protection for corporate use. When someone shares their screen,
the T3 window (and its taskbar button) are simply not in the picture.

> **Platform support: Windows (full) · macOS (should work, untested) · Linux (not supported).**
> On Linux the app runs normally, but the window is **visible to screen sharing**, and the app says so.
> See [Linux](#linux) for why, and what could be done.

This is a personal fork, not an official T3 product. The T3 name and branding belong to their owners; see
[TRADEMARK.md](TRADEMARK.md) before distributing it widely.

---

## Contents

1. [What it does](#what-it-does)
2. [Install (Windows)](#install-windows)
3. [Using it](#using-it)
4. [Platform support](#platform-support)
5. [Linux](#linux)
6. [How it works](#how-it-works)
7. [What changed vs upstream](#what-changed-vs-upstream)
8. [Building it yourself](#building-it-yourself)
9. [Staying up to date with upstream](#staying-up-to-date-with-upstream)
10. [Security notes and limits](#security-notes-and-limits)
11. [Project history](#project-history)

---

## What it does

- **Hides every app window from screen capture** (screenshots, screen recording, Teams/Zoom/Meet sharing).
  Viewers see whatever is behind the window.
- **Hides the app from the taskbar** while protection is on, because a full-screen share would otherwise still
  show the T3 taskbar button.
- **On by default.** A fresh install is protected immediately. Only an explicit "off" turns it off. A missing
  or corrupted settings file also means "on".
- **An always-visible eye button** in the sidebar header toggles it. A _View → Hide from Screen Capture_ menu
  item does the same.
- **A global shortcut, `Ctrl+Alt+Shift+T`**, restores and focuses the windows, since there is no taskbar
  button to click.
- **Honest on unsupported platforms.** Where the OS cannot hide windows from capture, the button shows a
  shield-off icon and says the window is visible to screen sharing. It never claims to be hiding.

## Install (Windows)

1. Download `T3-Code-ScreenShield-<version>-x64-windows.exe` from the
   [Releases page](https://github.com/PeterBredell/t3code-screenshield/releases).
2. Optionally verify the SHA-256 listed in the release notes (`certutil -hashfile <file> SHA256`).
3. Run it. The installer is **not code-signed**, so Windows SmartScreen shows an "unknown publisher" warning.
   Click **More info → Run anyway**.
4. Launch **T3 Code** from the Start menu.

> This build uses the same app identity as the official T3 Code, so installing it **replaces** an existing
> official install on the same machine. Give the fork its own app ID and name first if both must coexist.

## Using it

| Action                   | How                                                                   |
| ------------------------ | --------------------------------------------------------------------- |
| See whether it is hiding | Eye icon, top-left of the sidebar: crossed-out and shaded = hidden    |
| Toggle                   | Click the eye icon, or _View → Hide from Screen Capture_ (press Alt)  |
| Get the window back      | `Ctrl+Alt+Shift+T` (works even with no taskbar button)                |
| Verify it works          | Start a screen share, or press `Win+Shift+S`: the T3 window is absent |

The setting is saved as `screen-capture-protection.json` in the app's user-data folder.

## Platform support

| Platform               | Hide from capture                                                                         | Hide from taskbar                 | Restore shortcut                 | Status                        |
| ---------------------- | ----------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------- | ----------------------------- |
| Windows 10 2004+ / 11  | Yes (`WDA_EXCLUDEFROMCAPTURE`)                                                            | Yes                               | Yes                              | **Tested, works**             |
| Windows before 10 2004 | Window shows as black (`WDA_MONITOR`)                                                     | Yes                               | Yes                              | Untested                      |
| macOS                  | Yes (`NSWindowSharingNone`), but newer macOS capture APIs have been reported to ignore it | Partly (Dock behaves differently) | Yes                              | **Untested**                  |
| Linux                  | **No** (Electron no-op)                                                                   | Depends on desktop                | X11 only, Wayland usually blocks | **Not supported; UI says so** |

## Linux

### Short answer

Not today. The feature does not work on Linux, and the app deliberately reports itself as unsupported there
instead of showing a button that claims otherwise.

### Why

- The whole feature rests on Electron's `BrowserWindow.setContentProtection()`. It maps to a real OS flag on
  Windows and macOS. On Linux it is a silent no-op (Electron's own API is documented around macOS and Windows).
- **X11** has no per-window "exclude from capture". Any X client may read the whole screen, and the window
  contents with it.
- **Wayland** routes capture through the compositor (xdg-desktop-portal and PipeWire). Whether a window can be
  excluded is then a property of the _compositor_, not of the app, and there is no common protocol for it.
  Electron's own write-up on Wayland notes that some APIs available on X11/macOS/Windows are unavailable
  there.
- Electron has defaulted to native Wayland on Linux since 38.2, which pushes the problem toward compositors.

### What could be done if someone wants to take it on

These are **ideas, none of them implemented or tested here**. Roughly from most to least practical:

1. **Hyprland: a compositor rule.** Hyprland has a `noscreenshare` window rule that removes a matching window
   from screen sharing. The app cannot set it itself; the user adds a rule matching the app's window class in
   `hyprland.conf` (rule syntax differs between Hyprland versions, so check yours). The app could detect
   `XDG_CURRENT_DESKTOP=Hyprland`, offer to apply the rule through `hyprctl`, and report "supported" only
   after confirming the rule exists. This is the one concrete per-window mechanism I found.
2. **Other compositors (GNOME/Mutter, KDE/KWin, sway).** I could not confirm that any of them offers an
   equivalent per-window exclusion. Someone needs to check each compositor's current window rules and
   screencast-permission features. If one exists, the same "detect compositor, apply its rule" pattern applies.
3. **Policy instead of technology.** Keep the app on a monitor or virtual workspace that is never shared, and
   share a single window or a different monitor. This cannot be enforced from inside the app.
4. **Isolation.** Run the app in a separate session or display (nested compositor or separate X server) that is
   never offered to the capture portal. Heavy, but it is real isolation.
5. **Upstream work.** A standard Wayland "exclude from capture" hint would fix this for everyone. That is a
   protocol and compositor effort, well outside this fork.

If you pursue 1 or 2, the natural place is `apps/desktop/src/window/ScreenCaptureProtection.ts`:
`isScreenCaptureProtectionSupported()` is the single gate. Return `true` only when a verified mechanism is
active, and implement the per-window apply/remove in `applyToWindow`.

### Building the Linux version

A Linux package must be built on a Linux machine (the build script targets the host OS):

```bash
pnpm install
pnpm dist:desktop:linux      # AppImage, x64
```

It needs Node 26.13.1, pnpm 12.14.0, Rust, `cc` and `make`. The build will work and the app will run, but
**the window will be visible to screen sharing**, and the eye button will say so.

## How it works

Windows exposes `SetWindowDisplayAffinity`. With `WDA_EXCLUDEFROMCAPTURE` (Windows 10 2004+) the window is drawn
on screen but omitted from capture, so viewers see whatever is behind it. `WDA_MONITOR` (older Windows) makes
it a black rectangle instead. Electron wraps this as `setContentProtection(true)`.

The idea came from a small WinForms test program, `AffinityTest`, with three buttons for `WDA_NONE`,
`WDA_MONITOR` and `WDA_EXCLUDEFROMCAPTURE`. Seeing the three modes in action showed it was feasible, and that
Electron already exposed it.

```
 sidebar eye button ─┐                                   ┌─ setContentProtection(v)
 View menu item ─────┼─► IPC ─► ScreenCaptureProtection ─┼─ setSkipTaskbar(v)
                     │          (main process)            └─ persisted to userData JSON
 global shortcut ────┘          applies to every window, including ones opened later
```

## What changed vs upstream

| File                                                                      | Change                                                                                                                                   |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/desktop/src/window/ScreenCaptureProtection.ts`                      | **New.** The feature: persisted setting (default on), apply to all windows and new ones, taskbar hiding, restore shortcut, platform gate |
| `apps/desktop/src/ipc/methods/screenCapture.ts`                           | **New.** IPC get/set handlers                                                                                                            |
| `apps/desktop/src/ipc/channels.ts`, `DesktopIpcHandlers.ts`, `preload.ts` | Register the two IPC channels                                                                                                            |
| `packages/contracts/src/ipc.ts`                                           | `DesktopBridge` gains `getScreenCaptureProtection` and `setScreenCaptureProtection`                                                      |
| `apps/desktop/src/window/DesktopApplicationMenu.ts`                       | _View → Hide from Screen Capture_ checkbox; starts the feature                                                                           |
| `apps/web/src/components/sidebar/SidebarChrome.tsx`                       | The always-visible eye button                                                                                                            |
| `scripts/build-desktop-artifact.ts`                                       | Windows packaging fixes (see below)                                                                                                      |
| `SCREENSHIELD.md`, `README.md`                                            | This documentation and a fork notice                                                                                                     |

The menu bar alone was not enough: T3's Windows title bar is custom and the menu is set to auto-hide, so the
View menu is hard to reach. Hence the dedicated button.

## Building it yourself

### Prerequisites (Windows)

- **Node 26.13.1** (the repo pins this exactly) and **pnpm 12.14.0**
- **Rust** (`rustup`, default `stable-x86_64-pc-windows-msvc`)
- **Python 3**
- **Visual Studio Build Tools** with: Desktop development with C++, a Windows SDK, MSVC, and the
  **Spectre-mitigated libraries** (component `Microsoft.VisualStudio.Component.VC.Runtimes.x86.x64.Spectre`).
  This last one is easy to miss; the build's preflight fails without it.

### Run in development

```powershell
pnpm install
pnpm dev:desktop
```

### Build the installer

```powershell
pnpm dist:desktop:win:x64
```

The installer lands in `release\`. A full build takes roughly 10 minutes.

### Packaging fixes this fork carries

Upstream's Windows packaging checks failed on a fresh build here, so two limits were adjusted in
`scripts/build-desktop-artifact.ts`:

1. **File-count cap raised from 80 to 120.** The packaged app is 104 files; 38 of them are a prepared server
   compile cache (a startup-speed feature), which the old cap predates.
2. **Native-load probe timeout raised from 30s to 180s.** The build test-launches the freshly built, unsigned
   exe, and first-run antivirus scanning can exceed 30 seconds.

### Troubleshooting

| Symptom                                                                          | Cause / fix                                                                  |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `Visual Studio Build Tools with C++, Windows SDK, and Spectre libraries` missing | Add the Spectre-mitigated libraries component in the Visual Studio Installer |
| `payload contains N files; expected at most 80`                                  | Use this fork's raised limit                                                 |
| `native-load probe did not finish within 30s`                                    | Use this fork's raised timeout, or retry once Defender has scanned the build |
| Pre-commit hook fails with `node: not found`                                     | Put Node 26.13.1 on `PATH` before committing                                 |
| Rebase refuses with "unstaged changes" on files you did not touch                | Line-ending noise on Windows; use `git rebase --autostash`                   |

## Staying up to date with upstream

```bash
git remote add upstream https://github.com/pingdotgg/t3code.git   # once
git fetch upstream
git merge upstream/main          # or rebase
pnpm install
```

The changes are small and contained, so conflicts should be rare. The most likely places are
`DesktopApplicationMenu.ts`, `SidebarChrome.tsx` and `scripts/build-desktop-artifact.ts`. After merging, run
`pnpm dev:desktop` and confirm the window disappears from a screen share before shipping.

## Security notes and limits

This is **one layer, not a guarantee.** It blocks software capture on the machine running the app. It does not
stop:

- a **phone or camera pointed at the screen**;
- **HDMI/DisplayPort capture cards** and other hardware capture;
- a **remote-desktop or VM host** that captures below the window layer, which may or may not respect the flag
  (test your own remote tooling);
- anything the user **copies out** of the app.

Also:

- **The installer is unsigned.** Anyone distributing it widely should sign it with a code-signing
  certificate; SmartScreen will warn on every machine until then.
- **Auto-update points at upstream T3.** The built-in updater is tied to upstream releases. Disable it, or
  point it at your own release channel, before distributing broadly.
- **Hiding from the taskbar** makes the app less discoverable. That is intentional here, but make sure users
  know about `Ctrl+Alt+Shift+T`. If another program already uses that shortcut, registration silently fails.
- Treat the setting file as user-editable: a user with local access can turn protection off.

## Project history

Built in a single working session:

1. Identified `AffinityTest.exe` as a `SetWindowDisplayAffinity` test and chose to implement it in a fork of
   T3 Code (an Electron app) rather than VSCodium, for its smaller codebase.
2. Added the capture-protection module, View menu item, then the always-visible eye button once the
   auto-hiding menu proved hard to reach on Windows.
3. Made protection **on by default**.
4. Packaged a Windows installer, fixing the packaging preflight problems listed above.
5. Added **taskbar hiding** and the **restore shortcut**.
6. Made the app **honest on unsupported platforms** (Linux), researched what Linux would take, and wrote this
   document.

Most of the code was written with [Claude Code](https://claude.com/claude-code).
