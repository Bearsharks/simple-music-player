import { parsePlaylistUrl } from 'features/youtube/api/playlistUrl';
it.each(['https://www.youtube.com/playlist?list=PLtest_123','https://music.youtube.com/playlist?list=PLtest_123','https://youtu.be/abcdefghijk?list=PLtest_123&si=abc'])('normalizes %s', input => {
  expect(parsePlaylistUrl(input)).toEqual({id:'PLtest_123',url:'https://www.youtube.com/playlist?list=PLtest_123'});
});
it.each(['https://youtube.com.evil.example/?list=PL123','javascript:alert(1)','https://www.youtube.com/watch?v=abcdefghijk','https://user:pass@youtube.com/?list=PL123','https://youtube.com/?list=%3Cscript%3E'])('rejects unsafe/unsupported URL %s', input => expect(() => parsePlaylistUrl(input)).toThrow());
it.each(['RDazNG-AU0eGg','WL','LL','HL'])('accepts a well-formed %s ID and lets the player determine availability',id=>{
  expect(parsePlaylistUrl(`https://youtube.com/playlist?list=${id}`).id).toBe(id);
});
