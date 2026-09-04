import "./loading-screen.css";

export const MAP_IDLE_TIMEOUT_MS = 20_000;

type IdleView = {
  on(event: "idle", handler: () => void): void;
  off(event: "idle", handler: () => void): void;
};

export class LoadingScreen {
  private readonly root: HTMLElement;
  private readonly statusEl: HTMLElement;
  private dismissed = false;

  constructor(root = document.getElementById("loading-screen")) {
    if (!root) {
      throw new Error("loading-screen root is missing");
    }
    this.root = root;
    const status = root.querySelector<HTMLElement>(".loading-screen__status");
    if (!status) {
      throw new Error("loading-screen status is missing");
    }
    this.statusEl = status;
    this.root.setAttribute("aria-busy", "true");
  }

  setStatus(text: string): void {
    this.statusEl.textContent = text;
  }

  dismiss(): Promise<void> {
    if (this.dismissed) return Promise.resolve();
    this.dismissed = true;
    this.root.setAttribute("aria-busy", "false");
    this.root.classList.add("is-leaving");

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      this.root.remove();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        this.root.remove();
        resolve();
      };
      this.root.addEventListener("transitionend", finish, { once: true });
      window.setTimeout(finish, 400);
    });
  }
}

export function waitForViewIdle(
  view: IdleView,
  timeoutMs = MAP_IDLE_TIMEOUT_MS,
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      view.off("idle", onIdle);
      clearTimeout(timeoutId);
      resolve();
    };
    const onIdle = () => finish();
    view.on("idle", onIdle);
    const timeoutId = setTimeout(finish, timeoutMs);
  });
}
