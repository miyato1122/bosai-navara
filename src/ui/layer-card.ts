import "./layer-card.css";

/** Official 重ねるハザードマップ flood-depth legend colors. */
export const FLOOD_DEPTH_CLASSES = [
  { css: "rgb(247, 245, 169)", label: "0.5m未満" },
  { css: "rgb(255, 216, 192)", label: "0.5〜3.0m" },
  { css: "rgb(255, 183, 183)", label: "3.0〜5.0m" },
  { css: "rgb(255, 145, 145)", label: "5.0〜10.0m" },
  { css: "rgb(242, 133, 201)", label: "10.0〜20.0m" },
  { css: "rgb(220, 122, 220)", label: "20.0m以上" },
] as const;

export class LayerCard {
  private readonly root: HTMLElement;
  private readonly minimizeBtn: HTMLButtonElement;
  private readonly switchBtn: HTMLButtonElement;
  private readonly switchStateEl: HTMLElement;
  private toggleHandler: ((on: boolean) => void) | undefined;
  private minimized = false;
  private on = true;

  constructor(parent: HTMLElement) {
    this.root = document.createElement("aside");
    this.root.className = "hud-card layer-card";
    this.root.setAttribute("aria-label", "ハザードレイヤ");

    this.root.innerHTML = `
      <div class="hud-card__scan" aria-hidden="true"></div>
      <div class="hud-card__corners" aria-hidden="true"></div>
      <header class="hud-card__header">
        <span class="hud-card__eyebrow">HAZARD LAYER</span>
        <h2 class="hud-card__title">洪水浸水想定</h2>
        <div class="hud-card__actions">
          <button type="button" class="hud-card__icon-btn layer-card__minimize" aria-label="最小化" aria-expanded="true">−</button>
        </div>
      </header>
      <div class="hud-card__body">
        <button type="button" class="layer-card__switch is-on" role="switch" aria-checked="true">
          <span class="layer-card__switch-track" aria-hidden="true">
            <span class="layer-card__switch-thumb"></span>
          </span>
          <span class="layer-card__switch-text">
            <span class="layer-card__switch-label">表示</span>
            <span class="layer-card__switch-state">ON</span>
          </span>
        </button>
        <h3 class="layer-card__legend-title">浸水深</h3>
        <ul class="layer-card__legend"></ul>
      </div>
    `;

    this.minimizeBtn = this.root.querySelector(".layer-card__minimize")!;
    this.switchBtn = this.root.querySelector(".layer-card__switch")!;
    this.switchStateEl = this.root.querySelector(".layer-card__switch-state")!;
    const legend = this.root.querySelector(".layer-card__legend")!;
    for (const cls of FLOOD_DEPTH_CLASSES) {
      const li = document.createElement("li");
      li.className = "layer-card__legend-item";
      const swatch = document.createElement("span");
      swatch.className = "layer-card__swatch";
      swatch.style.background = cls.css;
      const label = document.createElement("span");
      label.textContent = cls.label;
      li.append(swatch, label);
      legend.append(li);
    }

    this.root.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    this.minimizeBtn.addEventListener("click", () => {
      if (this.minimized) this.expand();
      else this.minimize();
    });
    this.switchBtn.addEventListener("click", () => {
      this.setOn(!this.on);
      this.toggleHandler?.(this.on);
    });

    parent.append(this.root);
  }

  onToggle(handler: (on: boolean) => void): void {
    this.toggleHandler = handler;
  }

  private setOn(on: boolean): void {
    this.on = on;
    this.switchBtn.classList.toggle("is-on", on);
    this.switchBtn.setAttribute("aria-checked", String(on));
    this.switchStateEl.textContent = on ? "ON" : "OFF";
  }

  private minimize(): void {
    this.minimized = true;
    this.root.classList.add("is-minimized");
    this.minimizeBtn.textContent = "□";
    this.minimizeBtn.setAttribute("aria-label", "展開");
    this.minimizeBtn.setAttribute("aria-expanded", "false");
  }

  private expand(): void {
    this.minimized = false;
    this.root.classList.remove("is-minimized");
    this.minimizeBtn.textContent = "−";
    this.minimizeBtn.setAttribute("aria-label", "最小化");
    this.minimizeBtn.setAttribute("aria-expanded", "true");
  }
}
