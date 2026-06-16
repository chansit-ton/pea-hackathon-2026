import { bg, title, footer, box, text, arrow, C } from "./theme.mjs";

export async function slide04(presentation) {
  const slide = presentation.slides.add();
  bg(slide); title(slide, "INSIGHT", "The real operational question is not “how much to buy?”");
  text(slide, "It is: what is the best action before money moves?", 90, 150, 980, 44, { size: 32, color: C.orange });
  box(slide, 80, 250, 180, 100, C.panel, "Stock below ROP?", { size: 22, align: "center", round: true });
  arrow(slide, 270, 285);
  box(slide, 340, 250, 200, 100, C.panel, "Other warehouse has excess?", { size: 21, align: "center", round: true });
  arrow(slide, 550, 285);
  box(slide, 620, 210, 200, 80, C.green, "Transfer / Borrow", { size: 22, align: "center", round: true });
  box(slide, 620, 330, 200, 80, C.violet, "Swap", { size: 22, align: "center", round: true });
  arrow(slide, 842, 285);
  box(slide, 920, 250, 220, 100, C.orange, "Buy only when evidence says yes", { size: 22, align: "center", round: true });
  box(slide, 160, 485, 860, 78, C.bg2, "Inventory AI turns a purchase request into a governed decision: buy, transfer, borrow, swap, or wait.", { size: 27, align: "center", round: true });
  footer(slide, 4);
  return slide;
}
