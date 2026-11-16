// The AI answers in a light markdown: **bold**, *italic*, `code` and pipe tables. The rules match
// the web chat's renderMarkdown (digitalapproval/Modules/AiChat/Resources/views/partials/core.blade.php).
// The result is plain data that the app renders with AppText, so server text is never read as HTML.

export type Span = { kind: 'text' | 'bold' | 'italic' | 'code'; text: string };

export type ReplyBlock =
  { kind: 'paragraph'; spans: Span[] } | { kind: 'table'; header: Span[][]; rows: Span[][][] };

const ROW = /^\s*\|.*\|\s*$/;
const SEPARATOR = /^\s*\|[\s:|-]+\|\s*$/;
// Bold before italic, so "**x**" is never read as two italics.
const INLINE = /\*\*([^*]+?)\*\*|`([^`]+?)`|\*([^*\n]+?)\*/g;

function parseInline(line: string): Span[] {
  const spans: Span[] = [];
  let last = 0;
  for (const match of line.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) spans.push({ kind: 'text', text: line.slice(last, index) });
    const [whole, bold, code, italic] = match;
    if (bold !== undefined) spans.push({ kind: 'bold', text: bold });
    else if (code !== undefined) spans.push({ kind: 'code', text: code });
    else spans.push({ kind: 'italic', text: italic ?? '' });
    last = index + whole.length;
  }
  if (last < line.length) spans.push({ kind: 'text', text: line.slice(last) });
  return spans;
}

function splitRow(line: string): Span[][] {
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((cell) => parseInline(cell.trim()));
}

export function parseReply(text: string): ReplyBlock[] {
  const lines = text.split('\n');
  const blocks: ReplyBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    const next = lines[i + 1];
    if (ROW.test(line) && next !== undefined && SEPARATOR.test(next)) {
      const header = splitRow(line);
      const rows: Span[][][] = [];
      i += 2;
      while (i < lines.length && ROW.test(lines[i] ?? '')) {
        rows.push(splitRow(lines[i] ?? ''));
        i++;
      }
      blocks.push({ kind: 'table', header, rows });
    } else {
      blocks.push({ kind: 'paragraph', spans: parseInline(line) });
      i++;
    }
  }
  return blocks;
}
