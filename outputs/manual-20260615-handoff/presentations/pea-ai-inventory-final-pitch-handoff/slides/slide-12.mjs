import { bg, footer, box, text, C } from "./theme.mjs";

export async function slide12(presentation) {
  const slide = presentation.slides.add();
  bg(slide);
  text(slide, "CLOSING", 58, 38, 220, 24, { size: 13, color: C.orange });
  text(slide, "AI does not replace approval.\nIt makes every inventory decision explainable.", 58, 110, 1080, 150, { size: 46, color: C.white, align: "center" });
  box(slide, 130, 325, 300, 116, C.panel, "Impact\nลดซื้อซ้ำ ลดทุนจม ลดของขาด", { size: 25, align: "center", round: true });
  box(slide, 490, 325, 300, 116, C.panel, "Feasibility\nสูตรและ workflow ทำงานแล้วใน prototype", { size: 25, align: "center", round: true });
  box(slide, 850, 325, 300, 116, C.panel, "Scalability\nเริ่ม pilot รายเขต แล้วต่อ SAP/API", { size: 25, align: "center", round: true });
  box(slide, 180, 535, 920, 58, C.green, "Stop buying blind. Buy only when the evidence says yes.", { size: 28, color: C.ink, align: "center", round: true });
  footer(slide, 12);
  return slide;
}
