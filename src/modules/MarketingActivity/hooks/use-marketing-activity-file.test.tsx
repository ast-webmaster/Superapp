import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AppError } from '@/core/errors';
import { shareFile } from '@/core/files';

import { marketingActivityApi } from '../api/marketingActivityApi';
import { useMarketingActivityFile } from './use-marketing-activity-file';

const mockShow = jest.fn();
const mockDone = jest.fn();
const mockProgress = jest.fn(() => mockDone);

jest.mock('@/shared/ui', () => ({
  useToast: () => ({ show: mockShow, progress: mockProgress }),
}));
jest.mock('@/core/files', () => ({
  ...jest.requireActual('@/core/files/mimeTypeOf'),
  shareFile: jest.fn(),
}));
jest.mock('../api/marketingActivityApi', () => ({
  marketingActivityApi: { pdf: jest.fn(), attachment: jest.fn() },
}));

const pdfMock = marketingActivityApi.pdf as jest.Mock;
const attachmentMock = marketingActivityApi.attachment as jest.Mock;
const shareMock = shareFile as jest.Mock;
const bytes = new Uint8Array([1, 2, 3]);

async function setup() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(() => useMarketingActivityFile('combination', 'ma-1'), {
    wrapper,
  });
  return result;
}

beforeEach(() => {
  pdfMock.mockReset();
  attachmentMock.mockReset();
  shareMock.mockReset();
  mockShow.mockReset();
  mockDone.mockReset();
  mockProgress.mockClear();
});

it('fetches the PDF in the group the activity was opened from and shares it as a PDF', async () => {
  pdfMock.mockResolvedValueOnce(bytes);
  const result = await setup();

  await act(() => result.current.download({ type: 'pdf', name: 'MA-001.pdf' }));

  await waitFor(() => expect(shareMock).toHaveBeenCalled());
  expect(pdfMock).toHaveBeenCalledWith('combination', 'ma-1');
  expect(shareMock).toHaveBeenCalledWith(bytes, 'MA-001.pdf', 'application/pdf');
});

it('shows a progress bar for the fetch and ends it before the share sheet opens', async () => {
  pdfMock.mockResolvedValueOnce(bytes);
  const result = await setup();

  await act(() => result.current.download({ type: 'pdf', name: 'MA-001.pdf' }));

  await waitFor(() => expect(shareMock).toHaveBeenCalled());
  expect(mockProgress).toHaveBeenCalledWith('Downloading MA-001.pdf');
  expect(mockDone).toHaveBeenCalledTimes(1);
  expect(mockDone.mock.invocationCallOrder[0]).toBeLessThan(shareMock.mock.invocationCallOrder[0]!);
});

it('fetches an attachment by id and shares it with the type of its extension', async () => {
  attachmentMock.mockResolvedValueOnce(bytes);
  const result = await setup();

  await act(() => result.current.download({ type: 'attachment', id: 7, name: 'proposal.xlsx' }));

  await waitFor(() => expect(shareMock).toHaveBeenCalled());
  expect(attachmentMock).toHaveBeenCalledWith('combination', 'ma-1', 7);
  expect(shareMock).toHaveBeenCalledWith(
    bytes,
    'proposal.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
});

it('tells the user with the server message when the download fails', async () => {
  pdfMock.mockRejectedValueOnce(new AppError('Not found', 'not_found', 404));
  const result = await setup();

  await act(() => result.current.download({ type: 'pdf', name: 'MA-001.pdf' }));

  await waitFor(() =>
    expect(mockShow).toHaveBeenCalledWith({ tone: 'danger', message: 'Not found' }),
  );
  expect(shareMock).not.toHaveBeenCalled();
  expect(mockDone).toHaveBeenCalledTimes(1);
});
