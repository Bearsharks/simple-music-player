import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "jotai";
import { Suspense } from "react";
import { vi, it, expect } from "vitest";
import RestoreTitles from "features/playlists/ui/RestoreTitles";
import api from "shared/api/localAPI";
import { resetDatabase } from "test/resetDatabase";
const titles=vi.hoisted(()=>vi.fn());
vi.mock("features/youtube/api/videoMetadata",async(original)=>({...await original<typeof import("features/youtube/api/videoMetadata")>(),fetchVideoTitles:titles}));
it("repairs saved placeholders while retaining custom names and order",async()=>{
 await resetDatabase();titles.mockResolvedValue({"FloP_f-VK_k":{name:"심규선 ‘Sister’",owner:"심규선"}});
 const id=await api.createPlaylist({id:"",name:"음악",description:"",thumbnails:[],itemCount:2},[
 {videoID:"FloP_f-VK_k",name:"동영상 1 (FloP_f-VK_k)",query:"",owner:"",thumbnail:""},
 {videoID:"abcdefghijk",name:"내가 정한 이름",query:"",owner:"",thumbnail:""}]);
 await act(async () => { render(<Provider><Suspense fallback="loading"><RestoreTitles playlistID={id}/></Suspense></Provider>); });
 fireEvent.click(await screen.findByRole("button",{name:"원래 곡 제목 가져오기"}));
 await waitFor(async()=>expect((await api.getPlaylistItems(id))[0].name).toBe("심규선 ‘Sister’"));
 expect((await api.getPlaylistItems(id)).map(i=>i.name)).toEqual(["심규선 ‘Sister’","내가 정한 이름"]);
 expect(titles.mock.calls[0][0]).toEqual(["FloP_f-VK_k"]);
});
