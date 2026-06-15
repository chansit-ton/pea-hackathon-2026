import { bg, box, text, metric, C } from "./theme.mjs";

export async function slide01(presentation) {
  const slide = presentation.slides.add();
  bg(slide);
  text(slide, "PEA HACKATHON 2026 | Track #2 Inventory & Safety Stock Optimization", 58, 34, 780, 28, { size: 15, color: C.muted });
  text(slide, "Inventory AI", 58, 92, 760, 70, { size: 54, color: C.white });
  text(slide, "Stop buying blind: know whether to buy, transfer, borrow, or wait.", 62, 168, 920, 42, { size: 24, color: C.orange });
  box(slide, 58, 254, 1088, 150, C.panel, "Before opening a purchase request, PEA should know whether the item is truly missing or simply sitting as dead stock in another warehouse.", { size: 31, color: C.white, round: true, align: "center" });
  metric(slide, "demo trapped-capital signal", "฿8.6M", 72, 462, 300, C.orange);
  metric(slide, "explainable formula engine", "Safety Stock + ROP", 404, 462, 360, C.green);
  metric(slide, "governed approval layers", "Local / Regional / Central", 796, 462, 350, C.violet);
  slide.speakerNotes.text = "Open with the question: before buying, do we know whether another warehouse already has the same item sitting idle?";
  return slide;
}
