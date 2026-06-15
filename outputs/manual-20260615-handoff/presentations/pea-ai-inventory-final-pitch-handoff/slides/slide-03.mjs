import { bg, title, footer, box, text, C } from "./theme.mjs";

export async function slide03(presentation) {
  const slide = presentation.slides.add();
  bg(slide); title(slide, "PERSONA", "The user does not lack knowledge; they lack a standard decision system.");
  box(slide, 60, 168, 430, 380, C.panel, "คุณสมมุติ\nเจ้าหน้าที่พัสดุ ระดับ 5\n\n• 5+ years at PEA\n• Owns warehouse stock decisions\n• Uses experience + Excel\n• Needs standard Safety Stock and ROP across regions", { size: 25, color: C.white, round: true });
  box(slide, 535, 168, 300, 160, C.bg2, "Pain 1\nNo shared calculation baseline", { size: 24, color: C.orange, round: true });
  box(slide, 535, 358, 300, 160, C.bg2, "Pain 2\nManual collection causes errors and fatigue", { size: 24, color: C.orange, round: true });
  box(slide, 870, 168, 300, 160, C.bg2, "Need 1\nExplainable recommendation", { size: 24, color: C.green, round: true });
  box(slide, 870, 358, 300, 160, C.bg2, "Need 2\nAudit-ready approval evidence", { size: 24, color: C.green, round: true });
  text(slide, "DVF fit: Desirable for staff, viable through efficiency, feasible with data engineering.", 72, 590, 1060, 34, { size: 24, color: C.muted, align: "center" });
  footer(slide, 3);
  return slide;
}
