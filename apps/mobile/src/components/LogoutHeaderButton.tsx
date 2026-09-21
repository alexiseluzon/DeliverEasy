import { Alert, Pressable, Text } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme";

export function LogoutHeaderButton() {
  const { logout } = useAuth();

  function handlePress() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => logout() },
    ]);
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Sign out"
      hitSlop={12}
      style={{ paddingHorizontal: 8 }}
    >
      <Text style={{ color: colors.danger, fontSize: 14, fontWeight: "600" }}>Sign out</Text>
    </Pressable>
  );
}