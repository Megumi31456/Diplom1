"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { markConversationReadAction } from "@/app/actions/messages";

export function MarkConversationRead({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void markConversationReadAction(conversationId).then((changed) => {
      if (changed) router.refresh();
    });
  }, [conversationId, router]);

  return null;
}
