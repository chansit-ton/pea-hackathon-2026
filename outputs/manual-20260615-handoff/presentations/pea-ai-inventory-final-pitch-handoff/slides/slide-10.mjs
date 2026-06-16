import { bg, title, footer, box, C } from "./theme.mjs";

export async function slide10(presentation) {
  const slide = presentation.slides.add();
  bg(slide); title(slide, "DEMO PATH", "Judges can verify the end-to-end flow in under five minutes.");
  const rows = [
    ["1", "Dashboard", "risk, PR queue, dead stock exchange"],
    ["2", "SKU Detail", "current stock, safety stock, ROP, AI suggested qty"],
    ["3", "Calculation", "why the system recommends this quantity"],
    ["4", "Create PR", "budget check + transfer/borrow warning"],
    ["5", "Approval", "AI vs requested, reason, snapshot"],
    ["6", "History / Audit", "locked calculation and feedback loop"],
  ];
  rows.forEach((r, i) => {
    const y = 160 + i * 72;
    box(slide, 78, y, 60, 48, i === 3 ? C.orange : C.violet, r[0], { size: 24, align: "center", round: true });
    box(slide, 160, y, 260, 48, C.panel, r[1], { size: 22, color: C.white, round: true });
    box(slide, 442, y, 660, 48, C.bg2, r[2], { size: 20, color: C.muted, round: true });
  });
  footer(slide, 10);
  return slide;
}
