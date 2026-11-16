import { ScrollView, View } from 'react-native';

import { AppText } from '@/shared/ui';

import { parseReply, type Span } from './parse-reply';

function Spans({ spans }: { spans: Span[] }) {
  // An empty table cell still needs one line of height, or its column drifts out of line.
  if (spans.length === 0) return ' ';
  return spans.map((span, index) => {
    switch (span.kind) {
      case 'bold':
        return (
          <AppText key={index} variant="body-strong">
            {span.text}
          </AppText>
        );
      case 'italic':
        // Rubik has no italic face loaded; the platform slants the regular one.
        return (
          <AppText key={index} style={{ fontStyle: 'italic' }}>
            {span.text}
          </AppText>
        );
      case 'code':
        return (
          <AppText key={index} className="bg-surface-gray">
            {span.text}
          </AppText>
        );
      default:
        return <AppText key={index}>{span.text}</AppText>;
    }
  });
}

/** An AI answer, rendered from its light markdown into text and tables. Never as HTML. */
export function ReplyText({ text }: { text: string }) {
  const blocks = parseReply(text);
  return (
    <View className="gap-1">
      {blocks.map((block, index) => {
        if (block.kind === 'paragraph') {
          if (block.spans.length === 0) return <View key={index} className="h-2" />;
          return (
            <AppText key={index} selectable>
              <Spans spans={block.spans} />
            </AppText>
          );
        }
        // Column by column, so each column is as wide as its widest cell and stays aligned.
        // Cells stay on one line; the table scrolls sideways instead of wrapping.
        return (
          <ScrollView key={index} horizontal className="my-1 rounded-lg bg-surface-gray">
            {block.header.map((head, c) => (
              <View key={c}>
                <View className="border-b border-border px-3 py-2">
                  <AppText variant="caption-strong" numberOfLines={1}>
                    <Spans spans={head} />
                  </AppText>
                </View>
                {block.rows.map((row, r) => (
                  <View
                    key={r}
                    className={
                      r < block.rows.length - 1 ? 'border-b border-border px-3 py-2' : 'px-3 py-2'
                    }>
                    <AppText numberOfLines={1}>
                      <Spans spans={row[c] ?? []} />
                    </AppText>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        );
      })}
    </View>
  );
}
