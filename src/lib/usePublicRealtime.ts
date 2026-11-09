import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type RealtimeConnectionStatus = "connecting" | "active" | "error";

type RealtimeSubscription = {
  table: string;
  filter?: string;
};

type UsePublicRealtimeOptions = {
  channelName: string;
  subscriptions: RealtimeSubscription[];
  onRefresh: () => Promise<void>;
};

export function usePublicRealtime({
  channelName,
  subscriptions,
  onRefresh,
}: UsePublicRealtimeOptions): RealtimeConnectionStatus {
  const [status, setStatus] = useState<RealtimeConnectionStatus>("connecting");
  const mountedRef = useRef(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshInProgressRef = useRef(false);
  const refreshQueuedRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const requestRefresh = useCallback(() => {
    if (!mountedRef.current) return;

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;

      if (refreshInProgressRef.current) {
        refreshQueuedRef.current = true;
        return;
      }

      refreshInProgressRef.current = true;
      void onRefreshRef.current()
        .catch(() => {
          if (mountedRef.current) {
            setStatus("error");
          }
        })
        .finally(() => {
          refreshInProgressRef.current = false;
          if (refreshQueuedRef.current) {
            refreshQueuedRef.current = false;
            requestRefresh();
          }
        });
    }, 200);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let hasConnected = false;

    const channel: RealtimeChannel = subscriptions.reduce(
      (currentChannel, subscription) =>
        currentChannel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: subscription.table,
            ...(subscription.filter ? { filter: subscription.filter } : {}),
          },
          requestRefresh,
        ),
      supabase.channel(channelName),
    );

    channel.subscribe((subscriptionStatus) => {
      if (!mountedRef.current) return;

      if (subscriptionStatus === "SUBSCRIBED") {
        setStatus("active");
        if (hasConnected) {
          requestRefresh();
        }
        hasConnected = true;
      } else if (
        subscriptionStatus === "CHANNEL_ERROR" ||
        subscriptionStatus === "TIMED_OUT"
      ) {
        setStatus("error");
      }
    });

    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [channelName, requestRefresh, subscriptions]);

  return status;
}
