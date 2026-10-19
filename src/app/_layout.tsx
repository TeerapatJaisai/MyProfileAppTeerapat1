import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="login" />
      <Stack.Screen name="products" />
      <Stack.Screen name="edit-product" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="explore" />
    </Stack>
  );
}