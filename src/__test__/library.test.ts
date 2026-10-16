import { addPlaylist, emptyLibrary, parsePlaylistUrl, readLibrary, removePlaylist, writeLibrary, LIBRARY_KEY } from 'features/library/model/library';
beforeEach(() => localStorage.clear());
it.each(['https://www.youtube.com/playlist?list=PLtest_123','https://music.youtube.com/playlist?list=PLtest_123','https://youtu.be/abcdefghijk?list=PLtest_123&si=abc'])('normalizes %s', input => {
  expect(parsePlaylistUrl(input)).toEqual({id:'PLtest_123',url:'https://www.youtube.com/playlist?list=PLtest_123'});
});
it.each(['https://youtube.com.evil.example/?list=PL123','javascript:alert(1)','https://www.youtube.com/watch?v=abcdefghijk','https://youtube.com/playlist?list=WL','https://youtube.com/playlist?list=RD123','https://user:pass@youtube.com/?list=PL123','https://youtube.com/?list=%3Cscript%3E'])('rejects unsafe/unsupported URL %s', input => expect(() => parsePlaylistUrl(input)).toThrow());
it('roundtrips a versioned library, deduplicates and keeps selection valid', () => {
  const a = addPlaylist(emptyLibrary(),'https://youtube.com/playlist?list=PLfirst','첫 목록');
  const b = addPlaylist(a,'https://youtube.com/playlist?list=PLsecond','둘째');
  writeLibrary(b); expect(readLibrary()).toEqual(b);
  expect(addPlaylist(b,'https://youtube.com/playlist?list=PLfirst','다른 이름').playlists).toHaveLength(2);
  const removed = removePlaylist(b,'PLsecond'); expect(removed.selectedId).toBe('PLfirst');
  expect(removePlaylist(removed,'PLfirst')).toEqual(emptyLibrary());
});
it('does not silently overwrite unknown schema versions', () => {
  localStorage.setItem(LIBRARY_KEY,JSON.stringify({version:2,playlists:[]}));
  expect(() => readLibrary()).toThrow('지원하지 않는');
  expect(JSON.parse(localStorage.getItem(LIBRARY_KEY)!).version).toBe(2);
});
