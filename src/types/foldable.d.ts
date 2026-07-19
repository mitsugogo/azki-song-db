interface DevicePosture extends EventTarget {
  readonly type: "continuous" | "folded";
  onchange: ((this: DevicePosture, event: Event) => unknown) | null;
}

interface Navigator {
  readonly devicePosture?: DevicePosture;
}

interface Viewport {
  readonly segments: readonly DOMRect[] | null;
}

interface Window {
  readonly viewport?: Viewport;
}
