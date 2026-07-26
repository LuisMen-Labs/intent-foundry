export type DeliveryStatus = "sent" | "server-error";

type ToolResult = { isError?: boolean };

export interface DeliveryTransport {
  submit: () => Promise<ToolResult>;
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
    if (result.isError) return { status: "server-error", serverAccepted: false };
  } catch {
    return { status: "server-error", serverAccepted: false };
  }
  return { status: "sent", serverAccepted: true };
}
