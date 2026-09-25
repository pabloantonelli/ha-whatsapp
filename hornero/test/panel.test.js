import { beforeEach, describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(
  path.join(import.meta.dirname, "../src/public/index.html"),
  "utf8",
);

/** Boots the panel in jsdom with the network stubbed out. */
const boot = async (language = "en") => {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "http://localhost/",
    pretendToBeVisual: true,
    // Must be in place before the panel script runs.
    beforeParse(win) {
      Object.defineProperty(win.navigator, "languages", {
        value: [language],
        configurable: true,
      });
      win.IntersectionObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
      // The panel polls on load; keep it offline and deterministic.
      win.fetch = () => Promise.reject(new Error("offline"));
      win.document.execCommand = vi.fn(() => true);
    },
  });

  const { window } = dom;

  await new Promise((resolve) => window.addEventListener("load", resolve));
  return window;
};

describe("panel: copy buttons", () => {
  let window;

  beforeEach(async () => {
    window = await boot();
  });

  it("each block copies its own snippet, not the first one", async () => {
    const heads = [...window.document.querySelectorAll("#b-output .out-head")];
    const pres = [...window.document.querySelectorAll("#b-output pre")];

    // The default action renders Home Assistant, two Node-RED blocks and curl.
    expect(heads.length).toBeGreaterThan(1);
    expect(pres.length).toBe(heads.length);

    const copied = [];
    window.navigator.clipboard = {
      writeText: (text) => {
        copied.push(text);
        return Promise.resolve();
      },
    };
    Object.defineProperty(window, "isSecureContext", { value: true });

    for (const head of heads) {
      head.querySelector("button[data-act='copy-text']").click();
      await new Promise((r) => window.setTimeout(r, 0));
    }

    expect(copied).toEqual(pres.map((p) => p.textContent));
    // The bug being guarded against: every button copying the first block.
    expect(new Set(copied).size).toBe(copied.length);
  });

  it("falls back to execCommand when clipboard is unavailable", async () => {
    // Ingress is served over plain HTTP, where navigator.clipboard is absent.
    Object.defineProperty(window, "isSecureContext", { value: false });
    window.navigator.clipboard = undefined;

    const btn = window.document.querySelector(
      "#b-output button[data-act='copy-text']",
    );
    btn.click();
    await new Promise((r) => window.setTimeout(r, 0));

    expect(window.document.execCommand).toHaveBeenCalledWith("copy");
    expect(btn.textContent).toBe("Copied");
  });
});

describe("panel: snippet builder", () => {
  it("renders Home Assistant, Node-RED and curl for a service call", async () => {
    const window = await boot();
    const titles = [
      ...window.document.querySelectorAll("#b-output .section-label"),
    ].map((el) => el.textContent);

    expect(titles).toEqual([
      "Home Assistant",
      "Node-RED — fill in by hand",
      "Node-RED — import",
      "curl",
    ]);
  });

  it("tiene las seis pestañas", async () => {
    const window = await boot();
    const tabs = [...window.document.querySelectorAll("nav button")].map(
      (b) => b.dataset.tab,
    );

    expect(tabs).toEqual([
      "status",
      "chats",
      "builder",
      "incoming",
      "settings",
      "help",
    ]);
  });

  it("cambiar de pestaña muestra sólo ese panel", async () => {
    const window = await boot();
    window.document.querySelector('nav button[data-tab="help"]').click();

    const visible = [...window.document.querySelectorAll("[data-panel]")]
      .filter((p) => !p.hidden)
      .map((p) => p.dataset.panel);

    expect(visible).toEqual(["help"]);
  });

  it("switches to event listeners without curl", async () => {
    const window = await boot();
    const select = window.document.getElementById("b-action");
    select.value = "listen-message";
    select.dispatchEvent(new window.Event("change"));

    const out = window.document.getElementById("b-output").textContent;
    expect(out).toContain("hornero_message");
    expect(out).toContain("server-events");
    expect(out).not.toContain("curl");
  });
});

describe("panel: idiomas", () => {
  it("traduce la interfaz al idioma del navegador", async () => {
    const window = await boot("es");
    const tabs = [...window.document.querySelectorAll("nav button")].map(
      (b) => b.textContent,
    );

    expect(tabs).toContain("Ajustes");
    expect(tabs).toContain("Entrantes");
  });

  it("acepta una variante regional y cae al idioma base", async () => {
    const window = await boot("de-AT");
    const tabs = [...window.document.querySelectorAll("nav button")].map(
      (b) => b.textContent,
    );

    expect(tabs).toContain("Einstellungen");
  });

  it("vuelve al inglés con un idioma que no soportamos", async () => {
    const window = await boot("ja");
    const tabs = [...window.document.querySelectorAll("nav button")].map(
      (b) => b.textContent,
    );

    expect(tabs).toContain("Settings");
  });
});
