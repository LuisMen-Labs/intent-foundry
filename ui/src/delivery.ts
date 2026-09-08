export type DeliveryStatus = "sent" | "server-error";

type ToolResult = { isError?: boolean; content?: unknown; structuredContent?: unknown };

export interface DeliveryTransport {
  submit: () => Promise<ToolResult>;
  // A dropped response does not prove that the write failed.
  reconcile?: () => Promise<boolean>;
}

export interface DeliveryResult {
  status: DeliveryStatus;
  serverAccepted: boolean;
}

export async function deliverGuidedAnswer(
  transport: DeliveryTransport,
): Promise<DeliveryResult> {
  try {
    const result = await transport.submit();
    if (!result.isError) return { status: "sent", serverAccepted: true };
  } catch {
    // Verify the stored answer before reporting a failed write.
  }
  try {
    if (await transport.reconcile?.()) return { status: "sent", serverAccepted: true };
  } catch { /* Keep the local draft when verification is unavailable. */ }
  return { status: "server-error", serverAccepted: false };
}
