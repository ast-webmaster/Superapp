import { sentenceCase } from '@/shared/utils/format';

type ItemShape = {
  type: string | null;
  purpose: string | null;
  media: string | null;
  width: string | number | null;
  length: string | number | null;
  durasi: string | null;
};

const typeLabels: Record<string, string> = { IMAGE: 'Image', VIDEO: 'Video' };
const purposeLabels: Record<string, string> = { DIGITAL: 'Digital', FISIK: 'Physical' };

export const typeLabel = (type: string) => typeLabels[type] ?? sentenceCase(type);
export const purposeLabel = (purpose: string) => purposeLabels[purpose] ?? sentenceCase(purpose);
export const mediaLabel = (media: string) => sentenceCase(media);

/** "Image · Digital · Feed", "Image · Physical · 120 × 80 cm", "Video · 30 detik". */
export function describeItem(item: ItemShape): string {
  const parts: string[] = [item.type ? typeLabel(item.type) : 'Item'];
  if (item.type === 'IMAGE' && item.purpose) {
    parts.push(purposeLabel(item.purpose));
    if (item.purpose === 'DIGITAL' && item.media) parts.push(mediaLabel(item.media));
    if (item.purpose === 'FISIK' && item.width && item.length) {
      parts.push(`${item.width} × ${item.length} cm`);
    }
  }
  if (item.type === 'VIDEO' && item.durasi) parts.push(item.durasi);
  return parts.join(' · ');
}
