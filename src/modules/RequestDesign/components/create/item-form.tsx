import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import type { PickedFile } from '@/core/files';
import { ActionBar, AppText, Button, TextField } from '@/shared/ui';

import { MAX_DURASI, MAX_QTY, MAX_REMARKS, MAX_SIZE_CM, validateItem } from '../../create/draft';
import { REFERENCE_RULE } from '../../create/files';
import type { DraftItem, RequestDesignOptions } from '../../types';
import { mediaLabel, purposeLabel, typeLabel } from '../item-text';
import { ChoiceField } from './choice-field';
import { FileField } from './file-field';

export interface ItemFormProps {
  /** Heading above the fields, such as "New item". */
  title: string;
  initial: DraftItem;
  options: RequestDesignOptions;
  onSave: (item: DraftItem) => void;
  onCancel: () => void;
}

const SLOT_LABELS = ['Reference 1', 'Reference 2', 'Reference 3'] as const;

/**
 * One item, edited on its own copy: nothing reaches the draft until the user saves it. What it
 * asks for follows the type, the way the server validates it: an image needs a purpose (digital
 * needs where it is used, physical needs a size) and a video needs a duration.
 */
export function ItemForm({ title, initial, options, onSave, onCancel }: ItemFormProps) {
  const [row, setRow] = useState(initial);
  const [attempted, setAttempted] = useState(false);
  const errors = attempted ? validateItem(row) : {};
  const patch = (changes: Partial<DraftItem>) => setRow((current) => ({ ...current, ...changes }));
  const choices = (values: string[], label: (value: string) => string) =>
    values.map((value) => ({ value, label: label(value) }));

  const save = () => {
    if (Object.keys(validateItem(row)).length > 0) {
      setAttempted(true);
      return;
    }
    onSave(row);
  };

  const setFile = (slot: number, file: PickedFile | null) => {
    const files: [PickedFile | null, PickedFile | null, PickedFile | null] = [...row.files];
    files[slot] = file;
    patch({ files });
  };

  return (
    <>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-5 pb-6 pt-4">
        <AppText variant="title" role="heading">
          {title}
        </AppText>
        <ChoiceField
          label="What to design"
          required
          options={choices(options.item_types, typeLabel)}
          value={row.type}
          onChange={(type) => patch({ type })}
          error={errors.type}
        />
        <TextField
          label="Quantity"
          required
          keyboardType="number-pad"
          maxLength={String(MAX_QTY).length}
          value={row.qty}
          onChangeText={(qty) => patch({ qty: qty.replace(/\D/g, '') })}
          error={errors.qty}
        />

        {row.type === 'IMAGE' ? (
          <>
            <ChoiceField
              label="Purpose"
              required
              options={choices(options.purposes, purposeLabel)}
              value={row.purpose}
              onChange={(purpose) => patch({ purpose })}
              error={errors.purpose}
            />
            {row.purpose === 'DIGITAL' ? (
              <ChoiceField
                label="Used for"
                required
                options={choices(options.media, mediaLabel)}
                value={row.media}
                onChange={(media) => patch({ media })}
                error={errors.media}
              />
            ) : null}
            {row.purpose === 'FISIK' ? (
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <TextField
                    label="Width (cm)"
                    required
                    keyboardType="number-pad"
                    maxLength={String(MAX_SIZE_CM).length}
                    value={row.width}
                    onChangeText={(width) => patch({ width: width.replace(/\D/g, '') })}
                    error={errors.width}
                  />
                </View>
                <View className="flex-1">
                  <TextField
                    label="Length (cm)"
                    required
                    keyboardType="number-pad"
                    maxLength={String(MAX_SIZE_CM).length}
                    value={row.length}
                    onChangeText={(length) => patch({ length: length.replace(/\D/g, '') })}
                    error={errors.length}
                  />
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {row.type === 'VIDEO' ? (
          <TextField
            label="Duration"
            required
            placeholder="30 seconds"
            maxLength={MAX_DURASI}
            value={row.durasi}
            onChangeText={(durasi) => patch({ durasi })}
            error={errors.durasi}
          />
        ) : null}

        <TextField
          label="Remarks"
          multiline
          maxLength={MAX_REMARKS}
          value={row.remarks}
          onChangeText={(remarks) => patch({ remarks })}
          error={errors.remarks}
        />

        {SLOT_LABELS.map((label, slot) => (
          <FileField
            key={label}
            label={label}
            rule={REFERENCE_RULE}
            value={row.files[slot] ?? null}
            kept={row.kept[slot]}
            onChange={(file) => setFile(slot, file)}
          />
        ))}
      </ScrollView>
      <ActionBar>
        <View className="flex-row gap-2">
          <Button block variant="secondary" className="flex-1 px-2" onPress={onCancel}>
            Cancel
          </Button>
          <Button block className="flex-2" onPress={save}>
            Save item
          </Button>
        </View>
      </ActionBar>
    </>
  );
}
