import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore, useCurrentUser, useRoles } from '@/core/auth';
import { toAppError } from '@/core/errors';
import { sizes } from '@/shared/theme/tokens';
import { Alert, AppText, Avatar, Button, Screen, TextField } from '@/shared/ui';

import { AvatarEditButton } from '../components/avatar-edit-button';
import { profilePhotoUri } from '../profile-photo';

/** The backend refuses a photo over 2 MB, so a bigger one is not sent. */
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export function EditProfileScreen() {
  const { bottom } = useSafeAreaInsets();
  const user = useCurrentUser();
  const roles = useRoles();
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [name, setName] = useState(user?.name ?? '');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [nameError, setNameError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const trimmedName = name.trim();
  const changed = trimmedName !== user?.name || photo !== null;

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;
    setSaved(false);
    if (asset.fileSize && asset.fileSize > MAX_PHOTO_BYTES) {
      setFormError('That photo is larger than 2 MB. Choose a smaller one.');
      return;
    }
    setFormError(undefined);
    setPhoto(asset);
  };

  const save = async () => {
    if (!trimmedName) {
      setNameError('Enter your name.');
      return;
    }
    setSaving(true);
    setNameError(undefined);
    setFormError(undefined);
    setSaved(false);
    try {
      // The picker gives a local uri; the upload needs the file itself. On native, expo's File
      // carries its bytes, name and type into the multipart body; a fetched Blob did not arrive
      // as an image on the server. The web picker gives a blob: uri, which fetch can read.
      const file = photo
        ? Platform.OS === 'web'
          ? await (await fetch(photo.uri)).blob()
          : new File(photo.uri)
        : undefined;
      await updateProfile({ name: trimmedName, photo: file });
      setName(trimmedName);
      setPhoto(null);
      setSaved(true);
    } catch (error) {
      const failure = toAppError(error);
      const fieldErrors = failure.fieldErrors;
      setNameError(fieldErrors?.name?.[0]);
      setFormError(fieldErrors?.photo?.[0] ?? (fieldErrors?.name ? undefined : failure.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-6 px-5"
        contentContainerStyle={{
          paddingTop: sizes.screenTopGap,
          paddingBottom: bottom + sizes.screenTopGap,
        }}>
        <View className="items-center">
          <View>
            <Avatar size="xl" name={name} uri={photo?.uri ?? profilePhotoUri(user)} />
            <AvatarEditButton label="Change photo" onPress={() => void pickPhoto()} />
          </View>
        </View>

        {saved ? (
          <Alert tone="success" message="Profile saved." onDismiss={() => setSaved(false)} />
        ) : null}
        {formError ? <Alert tone="danger" message={formError} /> : null}

        <View className="gap-4 rounded-xl bg-surface p-5 border border-border">
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            maxLength={255}
            error={nameError}
          />
          <ReadOnlyValue label="Email" value={user?.email ?? ''} />
          <ReadOnlyValue label="Role" value={roles.join(', ') || '-'} />
        </View>
        <AppText tone="muted">
          You can change your name and photo. Your email and role stay as they are.
        </AppText>

        <Button block loading={saving} disabled={!changed} onPress={() => void save()}>
          Save changes
        </Button>
      </ScrollView>
    </Screen>
  );
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <AppText variant="label">{label}</AppText>
      <AppText tone="muted">{value}</AppText>
    </View>
  );
}
