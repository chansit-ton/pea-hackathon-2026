import { bg, title, footer, box, text, C } from "./theme.mjs";

export async function slide02(presentation) {
  const slide = presentation.slides.add();
  bg(slide); title(slide, "PROBLEM", "PEA has stockout and dead stock at the same time.");
  box(slide, 60, 170, 360, 370, C.panel, "Understock\n\n• Field work waits for critical materials\n• Emergency demand is hard to forecast\n• Local teams open PRs quickly to avoid service risk", { size: 23, color: C.white, round: true });
  box(slide, 460, 170, 360, 370, C.panel, "Overstock / Dead stock\n\n• Other warehouses hold idle items\n• Annual budget patterns can repeat purchases\n• Capital is trapped instead of moving to demand", { size: 23, color: C.white, round: true });
  box(slide, 860, 170, 330, 370, C.orange, "Root cause\n\nDecision data is fragmented across Excel, stock records, supplier lead time, budget, and procurement history.", { size: 25, color: C.white, round: true });
  text(slide, "The pitch: solve the decision workflow, not just the forecast screen.", 92, 582, 1000, 42, { size: 28, color: C.green, align: "center" });
  footer(slide, 2);
  return slide;
}
