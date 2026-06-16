import { bg, title, footer, box, arrow, C } from "./theme.mjs";

export async function slide06(presentation) {
  const slide = presentation.slides.add();
  bg(slide); title(slide, "EXPLAINABLE ENGINE", "Every AI suggestion is traceable from usage to MOQ-rounded quantity.");
  const items = [
    ["Usage history", "average daily demand"],
    ["Demand variability", "safety buffer"],
    ["Lead time x factors", "adjusted lead time"],
    ["Safety Stock + DDLT", "reorder point"],
    ["Target - current stock", "suggested quantity"],
    ["Round by MOQ", "PR-ready number"],
  ];
  items.forEach((it, i) => {
    const x = 70 + (i % 3) * 380;
    const y = 190 + Math.floor(i / 3) * 180;
    box(slide, x, y, 300, 100, C.panel, `${i + 1}. ${it[0]}\n${it[1]}`, { size: 22, align: "center", round: true });
    if (i % 3 < 2) arrow(slide, x + 310, y + 35, 45);
  });
  box(slide, 118, 545, 970, 70, C.green, "Result: not a black box. ผู้ใช้และ auditor เห็นว่าคำนวณจากอะไร และค่าเปลี่ยนเมื่ออะไรเปลี่ยน.", { size: 24, color: C.ink, align: "center", round: true });
  footer(slide, 6);
  return slide;
}
