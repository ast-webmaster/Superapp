import { parseReply } from './parse-reply';

const text = (t: string) => ({ kind: 'text', text: t });

it('reads bold inside a sentence', () => {
  expect(parseReply('Total **12** unit')).toEqual([
    { kind: 'paragraph', spans: [text('Total '), { kind: 'bold', text: '12' }, text(' unit')] },
  ]);
});

it('reads italic and code', () => {
  expect(parseReply('*miring* dan `kode`')).toEqual([
    {
      kind: 'paragraph',
      spans: [{ kind: 'italic', text: 'miring' }, text(' dan '), { kind: 'code', text: 'kode' }],
    },
  ]);
});

it('reads a table between paragraphs', () => {
  const blocks = parseReply(
    'Data:\n| Cabang | Stok |\n| --- | --- |\n| JKT | 5 |\n| SBY | **2** |\nSelesai',
  );

  expect(blocks).toEqual([
    { kind: 'paragraph', spans: [text('Data:')] },
    {
      kind: 'table',
      header: [[text('Cabang')], [text('Stok')]],
      rows: [
        [[text('JKT')], [text('5')]],
        [[text('SBY')], [{ kind: 'bold', text: '2' }]],
      ],
    },
    { kind: 'paragraph', spans: [text('Selesai')] },
  ]);
});

it('keeps a pipe in prose as text', () => {
  expect(parseReply('a | b')).toEqual([{ kind: 'paragraph', spans: [text('a | b')] }]);
});

it('needs a separator line to make a table', () => {
  expect(parseReply('| a | b |')).toEqual([{ kind: 'paragraph', spans: [text('| a | b |')] }]);
});

it('keeps markup that looks like HTML as plain text', () => {
  const input = '<script>x</script> <b>y</b>';
  expect(parseReply(input)).toEqual([{ kind: 'paragraph', spans: [text(input)] }]);
});

it('gives an empty line as an empty paragraph', () => {
  expect(parseReply('a\n\nb')).toEqual([
    { kind: 'paragraph', spans: [text('a')] },
    { kind: 'paragraph', spans: [] },
    { kind: 'paragraph', spans: [text('b')] },
  ]);
});

it('reads a real answer from the server', () => {
  const reply =
    'Berikut adalah **5 brand dengan stok terbanyak** saat ini:\n\n| Brand | Total Stok |\n|-------|----------|\n| **SANDISK** | **27.918** |\n| **LEXAR** | **18.002** |\n\nBrand **SANDISK** memimpin.';

  const blocks = parseReply(reply);

  expect(blocks.map((block) => block.kind)).toEqual([
    'paragraph',
    'paragraph',
    'table',
    'paragraph',
    'paragraph',
  ]);
  expect(blocks[2]).toEqual({
    kind: 'table',
    header: [[{ kind: 'text', text: 'Brand' }], [{ kind: 'text', text: 'Total Stok' }]],
    rows: [
      [[{ kind: 'bold', text: 'SANDISK' }], [{ kind: 'bold', text: '27.918' }]],
      [[{ kind: 'bold', text: 'LEXAR' }], [{ kind: 'bold', text: '18.002' }]],
    ],
  });
});
