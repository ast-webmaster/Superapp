import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Platform, Share } from 'react-native';

import { env } from '@/core/config';
import { IconButton } from '@/shared/ui';

const CONFIRM_MS = 2000;

interface ShareButtonProps {
  uuid: string;
  paNo: string;
  customerName: string | null;
  className?: string;
}

/**
 * Shares a request's web page, which asks for sign-in and checks access itself. A browser
 * without a share sheet gets the link copied instead.
 */
export function ShareButton({ uuid, paNo, customerName, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  async function share() {
    const url = `${env.webUrl}/priceapproval/show/${uuid}`;
    if (Platform.OS === 'web' && !globalThis.navigator?.share) {
      if (await Clipboard.setStringAsync(url)) setCopied(true);
      return;
    }
    const lines = [`Price Approval ${paNo}`, customerName, url].filter(Boolean);
    const message = lines.join('\n');
    // A browser rejects when the person closes the sheet: nothing to report.
    await Share.share({ message }).catch(() => {});
  }

  return (
    <IconButton
      size="xs"
      icon={copied ? 'check' : 'share'}
      label={copied ? 'Link copied' : `Share ${paNo}`}
      className={className}
      onPress={share}
    />
  );
}
