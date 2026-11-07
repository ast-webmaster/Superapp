import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { EmptyState, ListGroup, ListRow, Screen, TextField, useBottomNavInset } from '@/shared/ui';

import { TabHeader } from './tab-header';
import { useAvailableModules } from './use-available-modules';

export function AppsScreen() {
  const modules = useAvailableModules();
  const bottomInset = useBottomNavInset();
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const matches = modules.filter(
    (manifest) =>
      manifest.title.toLowerCase().includes(needle) ||
      manifest.description.toLowerCase().includes(needle),
  );

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="grow gap-4"
        contentContainerStyle={{ paddingBottom: bottomInset }}>
        <TabHeader title="Apps">
          <TextField
            icon="search"
            placeholder="Search apps"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </TabHeader>
        {modules.length === 0 ? (
          <EmptyState icon="grid" title="No apps yet" description="Your account has no access to any app." />
        ) : matches.length === 0 ? (
          <EmptyState icon="search" title="No apps found" description="Try a different name." />
        ) : (
          <View className="px-5">
            <ListGroup>
              {matches.map((manifest) => (
                <ListRow
                  key={manifest.id}
                  icon={manifest.icon ?? 'box'}
                  label={manifest.title}
                  onPress={() => router.push(manifest.route as Href)}
                />
              ))}
            </ListGroup>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
