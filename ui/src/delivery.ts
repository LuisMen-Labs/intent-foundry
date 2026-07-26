export type DeliveryStatus = "sent" | "server-error" | "context-error";

type ToolResult = { isError?: boolean };

export interface DeliveryTransport {
  submit: () => Promise<ToolResult>;
  updateContext: () => Promise<unknown>;
}

export interface DeliveryResult {
  status: DeliveryStatus;
  serverAccepted: boolean;
}

export async function deliverGuidedAnswer(
  transport: DeliveryTransport,
  serverAlreadyAccepted: boolean,
): Promise<DeliveryResult> {
  if (!serverAlreadyAccepted) {
    try {
      const result = await transport.submit();
      if (result.isError) return { status: "server-error", serverAccepted: false };
    } catch {
      return { status: "server-error", serverAccepted: false };
    }
  }

  try {
    await transport.updateContext();
    return { status: "sent", serverAccepted: true };
  } catch {
    return { status: "context-error", serverAccepted: true };
  }
}
