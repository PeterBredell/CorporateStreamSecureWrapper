import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

import * as IpcChannels from "../channels.ts";
import * as DesktopIpc from "../DesktopIpc.ts";
import * as ScreenCaptureProtection from "../../window/ScreenCaptureProtection.ts";

export const getScreenCaptureProtection = DesktopIpc.makeIpcMethod({
  channel: IpcChannels.SCREEN_CAPTURE_GET_CHANNEL,
  payload: Schema.Void,
  result: Schema.Struct({ enabled: Schema.Boolean, supported: Schema.Boolean }),
  handler: () =>
    Effect.sync(() => ({
      enabled: ScreenCaptureProtection.isScreenCaptureProtectionEnabled(),
      supported: ScreenCaptureProtection.isScreenCaptureProtectionSupported(),
    })),
});

export const setScreenCaptureProtection = DesktopIpc.makeIpcMethod({
  channel: IpcChannels.SCREEN_CAPTURE_SET_CHANNEL,
  payload: Schema.Boolean,
  result: Schema.Boolean,
  handler: (enabled) =>
    Effect.sync(() => {
      ScreenCaptureProtection.setScreenCaptureProtection(enabled);
      return ScreenCaptureProtection.isScreenCaptureProtectionEnabled();
    }),
});
