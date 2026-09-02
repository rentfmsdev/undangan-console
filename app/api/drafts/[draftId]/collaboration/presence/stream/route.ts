import { NextRequest, NextResponse } from "next/server";
import { getDraftAccess } from "@/modules/drafts/access";
import { subscribeToPresenceRoom } from "@/modules/collaboration/server/presence-store";
import { PresenceBroadcastEvent } from "@/modules/collaboration/domain/presence";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const access = await getDraftAccess(draftId);

  if (!access.authorized || !access.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const connectionId = request.nextUrl.searchParams.get("connectionId") || crypto.randomUUID();

  const encoder = new TextEncoder();
  let cleanupSubscription: (() => void) | null = null;
  let keepAliveInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event: PresenceBroadcastEvent) => {
        try {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream closed
        }
      };

      // Subscribe to server room
      cleanupSubscription = subscribeToPresenceRoom(draftId, {
        connectionId,
        userId: access.user.id,
        send: sendEvent,
        close: () => {
          try {
            controller.close();
          } catch {}
        },
      });

      // Periodic ping every 15s to keep connection open across proxies/load balancers
      keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepAliveInterval!);
        }
      }, 15_000);
    },
    cancel() {
      if (keepAliveInterval) clearInterval(keepAliveInterval);
      if (cleanupSubscription) cleanupSubscription();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
