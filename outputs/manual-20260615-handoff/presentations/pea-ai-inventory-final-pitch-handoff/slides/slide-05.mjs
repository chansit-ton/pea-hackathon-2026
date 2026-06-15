import { bg, title, footer, box, arrow, C } from "./theme.mjs";

export async function slide05(presentation) {
  const slide = presentation.slides.add();
  bg(slide); title(slide, "PRODUCT SYSTEM", "Inventory AI converts evidence into a governed purchase request.");
  const y = 255; const w = 132;
  const steps = [
    ["Dashboard", "risk + dead stock"],
    ["SKU Detail", "stock + usage"],
    ["Calculation", "Safety Stock / ROP"],
    ["Guardrail", "dead stock check"],
    ["PR", "qty + reason"],
    ["Approval", "3-layer routing"],
    ["Audit", "snapshot + feedback"],
  ];
  steps.forEach((s, i) => {
    const x = 55 + i * 170;
    box(slide, x, y, w, 128, i === 3 ? C.orange : C.panel, `${s[0]}\n${s[1]}`, { size: 19, align: "center", round: true, insets: { top: 12, right: 10, bottom: 10, left: 10 } });
    if (i < steps.length - 1) arrow(slide, x + w + 8, y + 48, 38);
  });
  box(slide, 80, 470, 330, 95, C.bg2, "Predict\nWhat quantity is needed?", { size: 24, color: C.green, align: "center", round: true });
  box(slide, 475, 470, 330, 95, C.bg2, "Prevent\nCan we avoid buying?", { size: 24, color: C.orange, align: "center", round: true });
  box(slide, 870, 470, 330, 95, C.bg2, "Prove\nCan we audit the decision?", { size: 24, color: C.violet, align: "center", round: true });
  footer(slide, 5);
  return slide;
}
