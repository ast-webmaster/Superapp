import { Stack } from 'expo-router/stack';

export function PriceApprovalLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Price Approval' }} />
    </Stack>
  );
}
