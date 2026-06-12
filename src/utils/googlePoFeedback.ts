import type { PurchaseRequest } from "../types";

export type GooglePoFeedbackAction =
  | "draft_saved"
  | "request_submitted"
  | "approval_action"
  | "regional_escalated"
  | "approved"
  | "rejected"
  | "more_info_requested";

type GooglePoFeedbackPayload = {
  action: GooglePoFeedbackAction;
  request: PurchaseRequest;
  note?: string;
  actor?: string;
  actionAt: string;
};

const endpoint = import.meta.env.VITE_GOOGLE_PO_FEEDBACK_ENDPOINT?.trim();

export function isGooglePoFeedbackEnabled() {
  return Boolean(endpoint);
}

function buildPoFeedbackRow(payload: GooglePoFeedbackPayload) {
  const { request, action, note, actor, actionAt } = payload;

  return {
    event_type: "po_feedback",
    action,
    action_at: actionAt,
    actor: actor ?? "Demo User",
    request_id: request.id,
    status: request.status,
    sku_id: request.skuId,
    warehouse_id: request.warehouseId,
    supplier_id: request.supplierId,
    ai_suggested_quantity: request.aiSuggestedQuantity,
    requested_quantity: request.requestedQuantity,
    approved_quantity: request.approvedQuantity ?? "",
    unit: request.unit,
    unit_price: request.unitPrice,
    estimated_cost: request.estimatedCost,
    recommended_layer: request.recommendedLayer,
    variance_percent: request.variancePercent,
    formula_version: request.formulaVersion,
    override_reason_category: request.overrideReasonCategory ?? "",
    override_reason_text: request.overrideReasonText ?? "",
    approval_note: note ?? "",
    snapshot_created_at: request.calculationSnapshot.createdAt,
  };
}

/**
 * ส่ง PO feedback ไป Google Apps Script / Google Sheet endpoint
 *
 * ใช้ mode no-cors เพื่อให้ Apps Script แบบ Web App รับ payload ได้จาก frontend
 * โดยไม่ต้องใส่ secret/API key ใน client code และไม่ทำให้ workflow หลักล้มถ้า endpoint ใช้งานไม่ได้
 */
export async function sendGooglePoFeedback(payload: GooglePoFeedbackPayload) {
  await postRow(buildPoFeedbackRow(payload));
}

type FeedbackCommentPayload = {
  authorName: string;
  authorUsername: string;
  context: string;
  text: string;
  createdAt: string;
};

/**
 * ส่งความเห็น/feedback ของผู้ใช้ไป Google Sheet เพื่อเก็บรวมศูนย์ (ใครให้ feedback หน้าไหน เมื่อไร)
 * ข้อมูลหลักยังเก็บใน localStorage; ส่วนนี้เป็นสำเนาไปชีต ไม่ทำให้ flow หลักล้มถ้า endpoint ล่ม
 */
export async function sendGoogleFeedbackComment(payload: FeedbackCommentPayload) {
  await postRow({
    event_type: "feedback_comment",
    action: "feedback",
    action_at: payload.createdAt,
    actor: payload.authorName,
    author_username: payload.authorUsername,
    context_page: payload.context,
    feedback_text: payload.text,
  });
}

async function postRow(row: Record<string, unknown>) {
  if (!endpoint) return;

  try {
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
      },
      body: JSON.stringify(row),
    });
  } catch (error) {
    console.warn("Cannot send Google feedback", error);
  }
}
