import { validPlaylistId } from '../../../../extension/protocol.js';

export function parsePlaylistUrl(input: string): { id: string; url: string } {
  let url: URL;
  try { url = new URL(input.trim()); } catch { throw new Error('YouTube 재생목록 URL을 입력해 주세요.'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port || !['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtu.be'].includes(url.hostname)) throw new Error('YouTube 재생목록 URL만 등록할 수 있습니다.');
  const id = url.searchParams.get('list');
  if (!validPlaylistId(id)) throw new Error('list= 값이 있는 재생목록 URL을 입력해 주세요.');
  return { id, url: `https://www.youtube.com/playlist?list=${encodeURIComponent(id)}` };
}
