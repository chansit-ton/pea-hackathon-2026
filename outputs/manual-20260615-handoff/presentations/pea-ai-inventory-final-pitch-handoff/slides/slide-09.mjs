import { bg, title, footer, box, arrow, C } from "./theme.mjs";

export async function slide09(presentation) {
  const slide = presentation.slides.add();
  bg(slide); title(slide, "FEASIBILITY", "The prototype is already structured for a regional pilot.");
  box(slide, 70, 170, 240, 310, C.panel, "Data layer\nSKU, WH, Plant, Supplier, Usage, Stock, Budget, Procurement History", { size: 21, align: "center", round: true });
  arrow(slide, 318, 300);
  box(slide, 380, 170, 240, 310, C.panel, "Calculation layer\nSafety Stock, ROP, MOQ, Cost, Approval Routing", { size: 21, align: "center", round: true });
  arrow(slide, 628, 300);
  box(slide, 690, 170, 240, 310, C.panel, "Workflow layer\nPR, Transfer, Borrow, Approval, Receiving Delay", { size: 21, align: "center", round: true });
  arrow(slide, 938, 300);
  box(slide, 1000, 170, 210, 310, C.panel, "Audit layer\nSnapshot, Timeline, Feedback, Formula Version", { size: 21, align: "center", round: true });
  box(slide, 145, 545, 990, 56, C.green, "Production path: replace localStorage/seed data with datastore + SAP-MM/API connectors; keep calculation and audit logic.", { size: 23, color: C.ink, align: "center", round: true });
  footer(slide, 9);
  return slide;
}
