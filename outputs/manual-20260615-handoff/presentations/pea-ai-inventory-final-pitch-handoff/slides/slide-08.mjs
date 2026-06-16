import { bg, title, footer, box, C } from "./theme.mjs";

export async function slide08(presentation) {
  const slide = presentation.slides.add();
  bg(slide); title(slide, "IMPACT", "The ROI story combines hard savings, productivity, and governance.");
  box(slide, 70, 170, 330, 360, C.orange, "Hard Return\n\n• Reduce repeated purchase\n• Reduce trapped inventory\n• Avoid unnecessary CAPEX/OPEX\n• Reduce stockout opportunity loss", { size: 23, round: true });
  box(slide, 475, 170, 330, 360, C.green, "Soft Return\n\n• Faster planning\n• Faster approval\n• Less Excel reconciliation\n• Better time-to-value for staff and PO", { size: 23, color: C.ink, round: true });
  box(slide, 880, 170, 330, 360, C.violet, "Strategic Return\n\n• Standard safety stock logic\n• Audit-ready governance\n• Regional scaling\n• Foundation for VMI and SAP integration", { size: 23, round: true });
  box(slide, 125, 585, 1000, 46, C.bg2, "Pitch priority: lead with Impact (40%) and Implementation / Technicality (35%).", { size: 23, color: C.muted, align: "center", round: true });
  footer(slide, 8);
  return slide;
}
