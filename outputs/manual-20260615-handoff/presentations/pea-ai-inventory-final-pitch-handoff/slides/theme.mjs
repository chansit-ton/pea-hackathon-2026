export const C = {
  bg: "#13091F",
  bg2: "#241044",
  panel: "#322057",
  panel2: "#3B2466",
  violet: "#9B5CFF",
  orange: "#FF6A2B",
  red: "#FF4D3D",
  green: "#31D07F",
  white: "#FFFFFF",
  muted: "#D8C8FF",
  dim: "#8F7BBF",
  ink: "#1A102B",
};

export function box(slide, x, y, w, h, fill = C.panel, text = "", opts = {}) {
  const sh = slide.shapes.add({ geometry: opts.round ? "roundRect" : "rect" });
  sh.frame = { left: x, top: y, width: w, height: h };
  sh.fill = fill;
  if (text) {
    sh.text = text;
    sh.text.fontSize = opts.size ?? 20;
    sh.text.color = opts.color ?? C.white;
    sh.text.typeface = opts.font ?? "Tahoma";
    sh.text.insets = opts.insets ?? { top: 14, right: 18, bottom: 14, left: 18 };
    sh.text.verticalAlignment = opts.valign ?? "middle";
    sh.text.alignment = opts.align ?? "left";
    sh.text.wrap = "square";
    sh.text.autoFit = "shrinkText";
  }
  return sh;
}

export function text(slide, content, x, y, w, h, opts = {}) {
  const sh = box(slide, x, y, w, h, "none", content, {
    size: opts.size ?? 22,
    color: opts.color ?? C.white,
    align: opts.align ?? "left",
    valign: opts.valign ?? "top",
    insets: opts.insets ?? { top: 0, right: 0, bottom: 0, left: 0 },
  });
  return sh;
}

export function title(slide, kicker, claim) {
  text(slide, kicker, 58, 34, 360, 24, { size: 13, color: C.orange });
  text(slide, claim, 58, 62, 920, 82, { size: 36, color: C.white });
  box(slide, 1052, 38, 170, 44, C.bg2, "PEA Hackathon\n2026", { size: 14, color: C.white, align: "center", round: true, insets: { top: 4, right: 8, bottom: 4, left: 8 } });
}

export function footer(slide, n) {
  text(slide, `Inventory AI | Final Pitch Handoff | ${String(n).padStart(2, "0")}`, 58, 686, 500, 18, { size: 10, color: C.dim });
}

export function bg(slide) {
  slide.background.fill = C.bg;
  box(slide, 0, 0, 1280, 720, C.bg);
  box(slide, 0, 0, 1280, 8, C.orange);
  box(slide, 0, 145, 1280, 1, C.bg2);
  box(slide, 0, 515, 280, 205, C.bg2);
}

export function metric(slide, label, value, x, y, w, color) {
  box(slide, x, y, w, 94, C.bg2, `${value}\n${label}`, { size: 21, color, align: "center", round: true, insets: { top: 12, right: 10, bottom: 8, left: 10 } });
}

export function arrow(slide, x, y, w = 56) {
  box(slide, x, y + 13, w, 4, C.orange);
  box(slide, x + w - 8, y + 9, 10, 12, C.orange);
}
