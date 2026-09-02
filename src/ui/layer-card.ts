import { FLOOD_DEPTH_CLASSES } from "../flood-depth.ts";
import "./layer-card.css";

export { FLOOD_DEPTH_CLASSES };

export class LayerCard {
  private readonly root: HTMLElement;
  private readonly minimizeBtn: HTMLButtonElement;
  private readonly switchBtn: HTMLButtonElement;
  private readonly switchStateEl: HTMLElement;
  private readonly water3dBtn: HTMLButtonElement;
  private readonly water3dStateEl: HTMLElement;
  private readonly water3dNoteEl: HTMLElement;
  private toggleHandler: ((on: boolean) => void) | undefined;
  private water3dToggleHandler: ((on: boolean) => void) | undefined;
  private minimized = false;
  private on = true;
  private water3dOn = false;

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
        <button type="button" class="layer-card__switch layer-card__switch--flood is-on" role="switch" aria-checked="true">
          <span class="layer-card__switch-track" aria-hidden="true">
            <span class="layer-card__switch-thumb"></span>
          </span>
          <span class="layer-card__switch-text">
            <span class="layer-card__switch-label">表示</span>
            <span class="layer-card__switch-state">ON</span>
          </span>
        </button>
        <button type="button" class="layer-card__switch layer-card__switch--water3d" role="switch" aria-checked="false">
          <span class="layer-card__switch-track" aria-hidden="true">
            <span class="layer-card__switch-thumb"></span>
          </span>
          <span class="layer-card__switch-text">
            <span class="layer-card__switch-label">浸水深を3Dで体感</span>
            <span class="layer-card__switch-state">OFF</span>
          </span>
        </button>
        <p class="layer-card__note" aria-live="polite"></p>
        <h3 class="layer-card__legend-title">浸水深</h3>
        <ul class="layer-card__legend"></ul>
      </div>
    `;

    this.minimizeBtn = this.root.querySelector(".layer-card__minimize")!;
    this.switchBtn = this.root.querySelector(".layer-card__switch--flood")!;
    this.switchStateEl = this.switchBtn.querySelector(".layer-card__switch-state")!;
    this.water3dBtn = this.root.querySelector(".layer-card__switch--water3d")!;
    this.water3dStateEl = this.water3dBtn.querySelector(".layer-card__switch-state")!;
    this.water3dNoteEl = this.root.querySelector(".layer-card__note")!;
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
    this.water3dBtn.addEventListener("click", () => {
      this.setWater3dOn(!this.water3dOn);
      this.water3dToggleHandler?.(this.water3dOn);
    });

    parent.append(this.root);
  }

  onToggle(handler: (on: boolean) => void): void {
    this.toggleHandler = handler;
  }

  onWater3dToggle(handler: (on: boolean) => void): void {
    this.water3dToggleHandler = handler;
  }

  setWater3dOn(on: boolean): void {
    this.water3dOn = on;
    this.water3dBtn.classList.toggle("is-on", on);
    this.water3dBtn.setAttribute("aria-checked", String(on));
    this.water3dStateEl.textContent = on ? "ON" : "OFF";
  }

  setWater3dNote(text: string): void {
    this.water3dNoteEl.textContent = text;
  }

  setWater3dBusy(busy: boolean): void {
    this.water3dBtn.setAttribute("aria-busy", String(busy));
  }

  isWater3dOn(): boolean {
    return this.water3dOn;
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
