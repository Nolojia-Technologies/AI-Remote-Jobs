import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { NotificationService } from "./NotificationService";

/**
 * Wires notification taps to navigation.
 *
 * `useLastNotificationResponse()` covers both cases: a tap while the app is
 * running/backgrounded, and a cold launch from a notification (it returns the
 * response that opened the app). We read the `route` we stored in the
 * notification's data payload and deep-link there. Navigation is deferred a
 * beat so the router is mounted on cold start, and each response is handled
 * once (guarding by object identity, since identifiers are reused).
 */
export function NotificationProvider() {
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<unknown>(null);

  // Ensure the handler + Android channels exist as early as possible.
  useEffect(() => {
    NotificationService.configure();
  }, []);

  useEffect(() => {
    if (!response || response === handled.current) return;
    handled.current = response;

    const route = response.notification.request.content.data?.route as string | undefined;
    if (!route) return;

    const t = setTimeout(() => {
      try {
        router.navigate(route as never);
      } catch {
        // route no longer valid — ignore
      }
    }, 200);
    return () => clearTimeout(t);
  }, [response]);

  return null;
}
