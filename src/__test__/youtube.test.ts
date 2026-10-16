import { urlToId, SearchType, YTFetch } from 'features/youtube/api/youtubeSearch';
import { vi } from 'vitest';
vi.mock('shared/api/api', () => ({getToken: vi.fn(async ()=>'test-token')}));
afterEach(()=>{vi.unstubAllGlobals();sessionStorage.clear();});
it.each(['https://youtu.be/abcdefghijk?t=4','https://www.youtube.com/watch?v=abcdefghijk&x=1','https://youtube.com/shorts/abcdefghijk'])('parses video URL %s',url=>{
 expect(urlToId(url)).toEqual({id:'abcdefghijk',kind:SearchType.Music});
});
it('prioritizes playlist and rejects lookalike hosts',()=>{
 expect(urlToId('https://youtube.com/watch?v=abcdefghijk&list=PL123')).toEqual({id:'PL123',kind:SearchType.List});
 expect(()=>urlToId('https://youtube.com.evil.example/watch?v=abcdefghijk')).toThrow();
});
it('does not retry quota errors or include bearer tokens in URLs',async()=>{
 const request=vi.fn(async(_input: RequestInfo | URL, _init?: RequestInit)=>new Response('{}',{status:403}));vi.stubGlobal('fetch',request);
 await expect(YTFetch('https://www.googleapis.com/youtube/v3/videos')).rejects.toThrow('403');
 expect(request).toHaveBeenCalledTimes(1);
 expect(String(request.mock.calls[0][0])).not.toContain('token');
});
it('refreshes at most once on repeated 401',async()=>{
 const request=vi.fn(async(_input: RequestInfo | URL, _init?: RequestInit)=>new Response('{}',{status:401}));vi.stubGlobal('fetch',request);
 await expect(YTFetch('https://www.googleapis.com/youtube/v3/videos')).rejects.toThrow('401');expect(request).toHaveBeenCalledTimes(2);
});
it('collects pages and detects a repeated token',async()=>{
 const request=vi.fn(async(_input: RequestInfo | URL, _init?: RequestInit)=>new Response(JSON.stringify({items:[{}],nextPageToken:'same'}),{status:200}));vi.stubGlobal('fetch',request);
 await expect(YTFetch('https://www.googleapis.com/youtube/v3/videos')).rejects.toThrow('반복');expect(request).toHaveBeenCalledTimes(2);
});
