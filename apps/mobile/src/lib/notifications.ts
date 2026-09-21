import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Since SDK 53, remote push notifications are not supported in Expo Go
// (Android in particular) — merely importing expo-notifications throws
// there. A static import would crash the whole app before any check can
// run, so the module is only require()'d once we've confirmed we're not
// in Expo Go. A development build is required to actually test push
// notifications end to end.
const isExpoGo = Constants.appOwnership === "expo";

function loadNotifications() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Notifications = require("expo-notifications");

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  return Notifications;
}

/**
 * Requests permission and returns an Expo push token, or null if the
 * user declined, this is running on a simulator (push requires a
 * physical device), or the app is running in Expo Go (unsupported
 * since SDK 53 — use a development build instead).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (isExpoGo) {
    console.warn("Push notifications require a development build — not supported in Expo Go.");
    return null;
  }

  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device.");
    return null;
  }

  const Notifications = loadNotifications();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("order-updates", {
      name: "Order updates",
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: "#FF7A33",
    });
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync();
  return token;
}

/**
 * Registers a listener for notification taps. No-ops in Expo Go.
 * Returns an unsubscribe function.
 */
export function addNotificationTapListener(
  onTap: (data: Record<string, unknown> | undefined) => void
): () => void {
  if (isExpoGo) return () => {};

  const Notifications = require("expo-notifications");
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response: { notification: { request: { content: { data: Record<string, unknown> } } } }) => {
      onTap(response.notification.request.content.data);
    }
  );
  return () => subscription.remove();
}