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

export function withTransportTimeout<T>(operation: () => Promise<T>, timeoutMs = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("transport_timeout")), timeoutMs);
    Promise.resolve().then(operation).then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

export async function deliverGuidedAnswer(
  transport: DeliveryTransport,
  timeoutMs = 15000,
): Promise<DeliveryResult> {
  const bounded = <T>(operation: () => Promise<T>) => withTransportTimeout(operation, timeoutMs);
  try {
    const result = await bounded(transport.submit);
    if (!result.isError) return { status: "sent", serverAccepted: true };
  } catch {
    // Verify the stored answer before reporting a failed write.
  }
  try {
    if (transport.reconcile && await bounded(transport.reconcile)) return { status: "sent", serverAccepted: true };
  } catch { /* Keep the local draft when verification is unavailable. */ }
  return { status: "server-error", serverAccepted: false };
}
