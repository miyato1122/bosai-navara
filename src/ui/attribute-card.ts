import {
  formatPlateauAttributes,
  type AttributeGroup,
  type AttributeRow,
  type FormattedBuildingAttributes,
} from "../plateau-attributes.ts";
import "./attribute-card.css";

export class AttributeCard {
  private readonly root: HTMLElement;
  private readonly titleEl: HTMLElement;
  private readonly bodyEl: HTMLElement;
  private closeHandler: (() => void) | undefined;

  constructor(parent: HTMLElement) {
    this.root = document.createElement("aside");
    this.root.className = "attr-card";
    this.root.setAttribute("aria-hidden", "true");
    this.root.setAttribute("aria-label", "建物属性");

    this.root.innerHTML = `
      <div class="attr-card__scan" aria-hidden="true"></div>
      <div class="attr-card__corners" aria-hidden="true"></div>
      <header class="attr-card__header">
        <span class="attr-card__eyebrow">BUILDING DATA</span>
        <h2 class="attr-card__title"></h2>
        <button type="button" class="attr-card__close" aria-label="閉じる">×</button>
      </header>
      <div class="attr-card__body"></div>
    `;

    this.titleEl = this.root.querySelector(".attr-card__title")!;
    this.bodyEl = this.root.querySelector(".attr-card__body")!;
    const closeBtn = this.root.querySelector(".attr-card__close")!;

    this.root.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    closeBtn.addEventListener("click", () => {
      this.closeHandler?.();
    });

    parent.append(this.root);
  }

  onClose(handler: () => void): void {
    this.closeHandler = handler;
  }

  show(properties: Record<string, unknown>): void {
    const formatted = formatPlateauAttributes(properties);
    this.titleEl.textContent = formatted.title;
    this.bodyEl.replaceChildren(renderBody(formatted));
    this.root.classList.add("is-visible");
    this.root.setAttribute("aria-hidden", "false");
  }

  hide(): void {
    this.root.classList.remove("is-visible");
    this.root.setAttribute("aria-hidden", "true");
  }
}

function renderBody(formatted: FormattedBuildingAttributes): DocumentFragment {
  const fragment = document.createDocumentFragment();
  if (formatted.sections.length === 0) {
    const empty = document.createElement("p");
    empty.className = "attr-card__empty";
    empty.textContent = "表示できる属性がありません";
    fragment.append(empty);
    return fragment;
  }
  for (const section of formatted.sections) {
    fragment.append(renderSection(section.title, section.rows, section.groups));
  }
  return fragment;
}

function renderSection(
  title: string,
  rows: AttributeRow[],
  groups: AttributeGroup[],
): HTMLElement {
  const section = document.createElement("section");
  section.className = "attr-card__section";

  const heading = document.createElement("h3");
  heading.className = "attr-card__section-title";
  heading.textContent = title;
  section.append(heading);

  if (rows.length > 0) {
    section.append(renderRows(rows));
  }
  for (const group of groups) {
    const groupTitle = document.createElement("h4");
    groupTitle.className = "attr-card__group-title";
    groupTitle.textContent = group.title;
    section.append(groupTitle, renderRows(group.rows));
  }
  return section;
}

function renderRows(rows: AttributeRow[]): HTMLElement {
  const dl = document.createElement("dl");
  dl.className = "attr-card__rows";
  for (const item of rows) {
    const wrap = document.createElement("div");
    wrap.className = "attr-card__row";
    const dt = document.createElement("dt");
    dt.textContent = item.label;
    const dd = document.createElement("dd");
    dd.textContent = item.value;
    wrap.append(dt, dd);
    dl.append(wrap);
  }
  return dl;
}
