import { claimFileProblem, MAX_CLAIM_FILE_BYTES } from './claim-sheet';

const file = (name: string, size: number | null = 1000) => ({
  uri: `file:///${name}`,
  name,
  mimeType: null,
  size,
});

describe('claimFileProblem', () => {
  it.each(['proof.pdf', 'scan.PNG', 'sheet.xlsx', 'mail.msg', 'bundle.zip'])(
    'accepts %s',
    (name) => {
      expect(claimFileProblem(file(name))).toBeNull();
    },
  );

  it('refuses a type the server does not accept', () => {
    expect(claimFileProblem(file('movie.mp4'))).toMatch(/not accepted/);
    expect(claimFileProblem(file('noextension'))).toMatch(/not accepted/);
  });

  it('refuses a file over 10 MB, and lets an unknown size through for the server to judge', () => {
    expect(claimFileProblem(file('big.pdf', MAX_CLAIM_FILE_BYTES + 1))).toMatch(/10 MB/);
    expect(claimFileProblem(file('edge.pdf', MAX_CLAIM_FILE_BYTES))).toBeNull();
    expect(claimFileProblem(file('unknown.pdf', null))).toBeNull();
  });
});
