import { bg, title, footer, box, arrow, C } from "./theme.mjs";

export async function slide11(presentation) {
  const slide = presentation.slides.add();
  bg(slide); title(slide, "ROADMAP", "Start small, prove impact, then integrate enterprise systems.");
  box(slide, 90, 210, 300, 250, C.panel, "Phase 1\nSandbox / PoC\n\n• Excel/CSV import\n• Validate formulas\n• PO feedback\n• Screenshot-ready demo", { size: 22, round: true });
  arrow(slide, 410, 315, 60);
  box(slide, 490, 210, 300, 250, C.panel, "Phase 2\nRegional Pilot\n\n• Shared datastore\n• Role routing\n• Transfer rules\n• SLA and delay logs", { size: 22, round: true });
  arrow(slide, 810, 315, 60);
  box(slide, 890, 210, 300, 250, C.panel, "Phase 3\nEnterprise Scale\n\n• SAP-MM / budget API\n• SSO / RBAC\n• Full audit log\n• VMI collaboration", { size: 22, round: true });
  box(slide, 180, 535, 920, 58, C.orange, "Pilot success metric: reduce purchase requests where the same SKU already exists as shareable dead stock.", { size: 23, align: "center", round: true });
  footer(slide, 11);
  return slide;
}
