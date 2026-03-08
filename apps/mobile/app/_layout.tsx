import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { I18nManager } from 'react-native';
import { getStoredUser, type AuthUser } from '@/lib/auth';

// Force RTL for Arabic
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const user = await getStoredUser();
      if (!user) {
        router.replace('/login');
      } else {
        if (user.role === 'ADMIN') router.replace('/admin');
        else if (user.role === 'COACH') router.replace('/coach/team');
        else router.replace('/player/profile');
      }
      setChecked(true);
    }
    checkAuth();
  }, []);

  if (!checked) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="coach" />
      <Stack.Screen name="player" />
    </Stack>
  );
}
