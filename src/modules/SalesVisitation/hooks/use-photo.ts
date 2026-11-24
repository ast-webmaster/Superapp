import { useQuery } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { salesVisitationApi } from '../api/salesVisitationApi';
import { salesVisitationKeys } from '../api/salesVisitationKeys';

/**
 * The proof photo as a local uri. The endpoint needs the Authorization header, which an image
 * view cannot send, so the bytes are fetched through the api client and written to the cache
 * folder (a blob url on web). Kept in memory only, like every other server data.
 */
export function useProofPhoto(uuid: string, type: 'in' | 'out', enabled: boolean) {
  return useQuery({
    queryKey: salesVisitationKeys.photo(uuid, type),
    queryFn: async ({ signal }) => {
      const bytes = await salesVisitationApi.photo(uuid, type, signal);
      if (Platform.OS === 'web') {
        return URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/jpeg' }));
      }
      const file = new File(Paths.cache, `sales-visitation-${uuid}-${type}.jpg`);
      file.create({ overwrite: true });
      file.write(bytes);
      return file.uri;
    },
    enabled,
    staleTime: Infinity,
    // A photo is large: keep it only while a screen shows it.
    gcTime: 60_000,
  });
}
