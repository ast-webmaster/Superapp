import { sniffExtension } from './sniff-extension';

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => Array.from(value, (char) => char.charCodeAt(0));

it('names the formats by their first bytes', () => {
  expect(sniffExtension(bytes(0x25, 0x50, 0x44, 0x46, 0x2d))).toBe('pdf');
  expect(sniffExtension(bytes(0x89, 0x50, 0x4e, 0x47))).toBe('png');
  expect(sniffExtension(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpg');
});

it('tells a docx from an xlsx by the entry names inside the zip', () => {
  expect(sniffExtension(bytes(0x50, 0x4b, 0x03, 0x04, ...text('word/document.xml')))).toBe('docx');
  expect(sniffExtension(bytes(0x50, 0x4b, 0x03, 0x04, ...text('xl/workbook.xml')))).toBe('xlsx');
  expect(sniffExtension(bytes(0x50, 0x4b, 0x03, 0x04, ...text('other.bin')))).toBe('');
});

it('tells an xls from a doc by the Workbook stream', () => {
  const ole = [0xd0, 0xcf, 0x11, 0xe0];
  const workbook = text('Workbook').flatMap((byte) => [byte, 0]);
  expect(sniffExtension(bytes(...ole, 0, 0, ...workbook))).toBe('xls');
  expect(sniffExtension(bytes(...ole, 0, 0, 1, 2, 3))).toBe('doc');
});

it('gives no extension for bytes it does not know', () => {
  expect(sniffExtension(bytes(1, 2, 3))).toBe('');
  expect(sniffExtension(bytes())).toBe('');
});
