/** True when `needle` appears in `bytes` from `from` on. */
function contains(bytes: Uint8Array, needle: readonly number[], from = 0): boolean {
  const last = bytes.length - needle.length;
  for (let start = from; start <= last; start += 1) {
    if (needle.every((byte, offset) => bytes[start + offset] === byte)) return true;
  }
  return false;
}

const ascii = (text: string) => Array.from(text, (char) => char.charCodeAt(0));
/** OLE2 stores names as UTF-16: "Workbook" is a spreadsheet's stream. */
const utf16 = (text: string) => Array.from(text).flatMap((char) => [char.charCodeAt(0), 0]);

/**
 * The file extension of downloaded bytes. The letter of assignment and the receipts come without
 * a file name, and the share sheet needs one to offer the right apps. Only the formats the server
 * accepts: pdf, png, jpg, and the Office files, which are zip (xlsx, docx) or OLE2 (xls, doc).
 * Returns '' when the type is not recognised.
 */
export function sniffExtension(bytes: Uint8Array): string {
  const startsWith = (...signature: number[]) => signature.every((byte, i) => bytes[i] === byte);

  if (startsWith(0x25, 0x50, 0x44, 0x46)) return 'pdf';
  if (startsWith(0x89, 0x50, 0x4e, 0x47)) return 'png';
  if (startsWith(0xff, 0xd8, 0xff)) return 'jpg';
  if (startsWith(0x50, 0x4b, 0x03, 0x04)) {
    // A zip lists its entries by name at the end ("xl/..." or "word/..."), which tells them apart.
    const from = Math.max(0, bytes.length - 65_536);
    return contains(bytes, ascii('xl/'), from)
      ? 'xlsx'
      : contains(bytes, ascii('word/'), from)
        ? 'docx'
        : '';
  }
  if (startsWith(0xd0, 0xcf, 0x11, 0xe0)) return contains(bytes, utf16('Workbook')) ? 'xls' : 'doc';
  return '';
}
