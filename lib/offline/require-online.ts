import NetInfo from "@react-native-community/netinfo";
import { Alert } from "react-native";

/** True unless NetInfo reports no connection (unknown counts as online). */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected !== false;
}

/**
 * For online-only actions (registering or editing children, circuits,
 * exercises, team): throws `message` when offline, so the action's existing
 * error alert explains why instead of showing a raw network failure.
 */
export async function assertOnline(message: string): Promise<void> {
  if (!(await isOnline())) throw new Error(message);
}

/** Like {@link assertOnline} for actions without their own error alert. */
export async function ensureOnline(title: string, message: string): Promise<boolean> {
  if (await isOnline()) return true;
  Alert.alert(title, message);
  return false;
}
