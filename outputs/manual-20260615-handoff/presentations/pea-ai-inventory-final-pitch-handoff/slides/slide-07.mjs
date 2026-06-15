import { bg, title, footer, box, text, C } from "./theme.mjs";

export async function slide07(presentation) {
  const slide = presentation.slides.add();
  bg(slide); title(slide, "DEAD STOCK GUARD", "The system catches repeat-purchase risk before budget is consumed.");
  box(slide, 70, 172, 330, 110, C.orange, "Dead Stock Exchange\nShow idle stock that can be shared before buying.", { size: 22, align: "center", round: true });
  box(slide, 70, 320, 330, 110, C.panel, "Procurement Audit\nFlag repeat buy, spend-to-keep, and over-peer budget patterns.", { size: 22, align: "center", round: true });
  box(slide, 455, 172, 670, 258, C.bg2, "Seed proof examples\n\n• 320 concrete poles idle 9 months\n• 300m XLPE cable idle 6 months\n• 1,150 breakers idle 11 months\n• 3 transformers idle 8 months", { size: 25, color: C.white, round: true });
  text(slide, "Core judge line: this is where hard return starts, because the system can prevent a new purchase before it becomes a PO.", 110, 515, 1000, 54, { size: 27, color: C.green, align: "center" });
  footer(slide, 7);
  return slide;
}
