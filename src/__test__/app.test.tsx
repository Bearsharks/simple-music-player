import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { vi } from 'vitest';
import App from 'app/App';
import { LIBRARY_KEY } from 'features/library/model/library';
beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());
const link = 'https://www.youtube.com/watch?v=abcdefghijk&list=PLexample123';
function add(title = '집중 음악') {
  fireEvent.change(screen.getByLabelText('YouTube 재생목록 URL'), {target: {value: link}});
  fireEvent.change(screen.getByLabelText('목록 이름 (선택)'), {target: {value: title}});
  fireEvent.click(screen.getByRole('button', {name: '목록 저장'}));
}
it('saves a URL without auth or fetch, restores it and renders its YouTube playlist embed', async () => {
  const request = vi.spyOn(globalThis, 'fetch');
  const first = render(<StrictMode><App /></StrictMode>);
  add();
  expect(screen.getByTitle('집중 음악 YouTube 플레이어')).toHaveAttribute('src', expect.stringContaining('list=PLexample123'));
  expect(JSON.parse(localStorage.getItem(LIBRARY_KEY)!).playlists).toHaveLength(1);
  expect(request).not.toHaveBeenCalled();
  first.unmount();
  render(<App />);
  expect(screen.getByRole('button', {name: '집중 음악'})).toHaveAttribute('aria-pressed','true');
  expect(screen.queryByText('로그인')).not.toBeInTheDocument();
});
it('deduplicates repeated URLs and confirms local deletion', () => {
  render(<App />); add(); add('중복');
  expect(screen.getByText('저장한 목록 (1)')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: '집중 음악 삭제'}));
  fireEvent.click(screen.getByRole('button', {name: '취소'}));
  expect(screen.getByTitle('집중 음악 YouTube 플레이어')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: '집중 음악 삭제'}));
  fireEvent.click(screen.getByRole('button', {name: '삭제 확인'}));
  expect(screen.queryByTitle('집중 음악 YouTube 플레이어')).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(LIBRARY_KEY)!).playlists).toHaveLength(0);
});
it('shows write failures without pretending the playlist was saved', () => {
  render(<App />);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {throw new DOMException('quota');});
  add();
  expect(screen.getByRole('alert')).toHaveTextContent('저장하지 못했습니다');
  expect(screen.queryByTitle('집중 음악 YouTube 플레이어')).not.toBeInTheDocument();
});
it('preserves malformed stored data and disables writes', () => {
  localStorage.setItem(LIBRARY_KEY, '{broken');
  render(<App />);
  expect(screen.getByRole('alert')).toHaveTextContent('덮어쓰지 않았습니다');
  expect(screen.getByRole('button', {name: '목록 저장'})).toBeDisabled();
  expect(localStorage.getItem(LIBRARY_KEY)).toBe('{broken');
});
it('updates the visible library after another tab changes storage', async () => {
  render(<App />); add();
  localStorage.removeItem(LIBRARY_KEY);
  window.dispatchEvent(new StorageEvent('storage', {key: LIBRARY_KEY}));
  await waitFor(() => expect(screen.getByText('저장한 목록 (0)')).toBeInTheDocument());
});
