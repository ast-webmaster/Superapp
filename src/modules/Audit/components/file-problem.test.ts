import { fileProblem } from './file-problem';

const file = (name: string, size: number | null = 1000) => ({
  uri: `file:///${name}`,
  name,
  mimeType: null,
  size,
});

it('accepts a file type the server accepts', () => {
  expect(fileProblem(file('bukti.PDF'))).toBeNull();
});

it('refuses a file type the server would refuse', () => {
  expect(fileProblem(file('script.exe'))).toMatch(/Choose a/);
});

it('refuses a file over 30 MB, and accepts one whose size is unknown', () => {
  expect(fileProblem(file('big.zip', 31 * 1024 * 1024))).toBe('The file is larger than 30 MB.');
  expect(fileProblem(file('some.zip', null))).toBeNull();
});
