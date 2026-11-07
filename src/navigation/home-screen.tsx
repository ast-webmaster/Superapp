import { Link, type Href } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { EmptyState } from '@/shared/components/empty-state';
import { Screen } from '@/shared/components/screen';
import { ThemedText } from '@/shared/components/themed-text';
import { ThemedView } from '@/shared/components/themed-view';
import { Spacing } from '@/shared/theme';

import { useAvailableModules } from './use-available-modules';

export function HomeScreen() {
  const modules = useAvailableModules();

  return (
    <Screen withTabInset>
      <ThemedText type="subtitle" style={styles.title}>
        Superapp
      </ThemedText>
      <FlatList
        data={modules}
        keyExtractor={(manifest) => manifest.id}
        renderItem={({ item }) => (
          <Link href={item.route as Href} asChild>
            <Pressable accessibilityRole="button" style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.tile}>
                <ThemedText type="smallBold">{item.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.description}
                </ThemedText>
              </ThemedView>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={
          <EmptyState title="No modules yet" description="Your account has no access to any module." />
        }
        contentContainerStyle={[styles.list, modules.length === 0 && styles.emptyList]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: Spacing.four,
  },
  list: {
    gap: Spacing.three,
  },
  emptyList: {
    flexGrow: 1,
  },
  tile: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
