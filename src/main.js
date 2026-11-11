import "@excalidraw/excalidraw/index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { Excalidraw } from "@excalidraw/excalidraw";

const scene = await (await fetch("mindmap.excalidraw")).json();
let api;

// Link-Symbole ausblenden: Links aus den Elementen entfernen und beim Antippen selbst öffnen
const links = new Map();
for (const el of scene.elements) {
  if (el.link && el.type !== "embeddable") { links.set(el.id, el.link); el.link = null; }
}

const linkAt = (clientX, clientY) => {
  const { scrollX, scrollY, zoom, offsetLeft, offsetTop } = api.getAppState();
  const x = (clientX - offsetLeft) / zoom.value - scrollX;
  const y = (clientY - offsetTop) / zoom.value - scrollY;
  const els = api.getSceneElements();
  for (let i = els.length - 1; i >= 0; i--) {
    const el = els[i];
    if (!links.has(el.id)) continue;
    // Punkt in das (ggf. gedrehte) Koordinatensystem des Elements zurückdrehen
    const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
    const cos = Math.cos(-el.angle), sin = Math.sin(-el.angle);
    const px = cx + (x - cx) * cos - (y - cy) * sin;
    const py = cy + (x - cx) * sin + (y - cy) * cos;
    if (px >= el.x && px <= el.x + el.width && py >= el.y && py <= el.y + el.height) return links.get(el.id);
  }
};

const appEl = document.getElementById("app");
let down = null;
appEl.addEventListener("pointerdown", (e) => {
  down = e.isPrimary ? { x: e.clientX, y: e.clientY, t: Date.now() } : null;
}, true);
appEl.addEventListener("pointerup", (e) => {
  if (!down || !api || !e.isPrimary) return;
  const tap = Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8 && Date.now() - down.t < 500;
  down = null;
  const link = tap && linkAt(e.clientX, e.clientY);
  if (link) window.open(link, "_blank", "noopener");
}, true);

const fit = () => api?.scrollToContent(undefined, { fitToViewport: true, viewportZoomFactor: 0.95, animate: true });

createRoot(document.getElementById("app")).render(
  React.createElement(Excalidraw, {
    initialData: {
      elements: scene.elements,
      files: scene.files,
      appState: { viewBackgroundColor: scene.appState.viewBackgroundColor },
      scrollToContent: true,
    },
    excalidrawAPI: (a) => { api = a; setTimeout(fit, 300); },
    viewModeEnabled: true,
    zenModeEnabled: true,
    gridModeEnabled: false,
    langCode: "de-DE",
    validateEmbeddable: true,
    UIOptions: {
      canvasActions: {
        changeViewBackgroundColor: false, clearCanvas: false, export: false,
        loadScene: false, saveToActiveFile: false, saveAsImage: false, toggleTheme: false,
      },
      tools: { image: false },
    },
    renderTopRightUI: () => null,
  })
);

document.getElementById("loading").remove();
const home = document.getElementById("home");
home.hidden = false;
home.onclick = fit;
