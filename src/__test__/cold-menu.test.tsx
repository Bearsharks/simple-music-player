import { act, render, screen, fireEvent } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { vi } from "vitest";
import Popup from "features/overlays/Popup";
import { useOpenPlaylistOptionsPopup } from "features/overlays/PopupStates";
import { playlistInfoStateFamily } from "features/playlists/model/playlistAtoms";
import type { PlaylistInfo } from "shared/model/constants";
function Harness({id}: {id:string}) {
  const open = useOpenPlaylistOptionsPopup();
  return <><button onClick={e=>open(e.currentTarget,id)}>옵션 열기</button><Popup/></>;
}
beforeEach(()=>vi.stubGlobal("ResizeObserver",class {observe(){} unobserve(){} disconnect(){}}));
afterEach(()=>vi.unstubAllGlobals());
async function pending(id:string) {
  const store=createStore();
  let resolve!:(value:PlaylistInfo)=>void;
  store.set(playlistInfoStateFamily(id),new Promise<PlaylistInfo>(r=>resolve=r));
  render(<Provider store={store}><Harness id={id}/></Provider>);
  const trigger=screen.getByRole("button",{name:"옵션 열기"}); trigger.focus();
  await act(async()=>{fireEvent.click(trigger);});
  return async()=> {await act(async()=>resolve({id,name:"검수",description:"",itemCount:0,thumbnails:[]}));};
}
it("mounts a complete menu with inline fixed-size SVGs, never a small loading popup",async()=>{
 const finish=await pending("cold-complete");
 expect(screen.queryByRole("menu")).not.toBeInTheDocument();
 expect(screen.queryByText("불러오는 중…")).not.toBeInTheDocument();
 await finish();
 const items=await screen.findAllByRole("menuitem");
 expect(items).toHaveLength(5);
 for(const item of items) {
  expect(item.querySelector(".material-icons")).toBeNull();
  expect(item.querySelector("svg")).toHaveAttribute("width","20");
  expect(item.querySelector("svg")).toHaveAttribute("height","20");
 }
 fireEvent.keyDown(document,{key:"Escape"});
});
it.each(["escape","outside","tab"])("cancels pending menu on %s instead of opening after the user leaves",async(kind)=>{
 const finish=await pending(`cold-${kind}`);
 if(kind==="escape") fireEvent.keyDown(document,{key:"Escape"});
 else if(kind==="tab") fireEvent.keyDown(document,{key:"Tab"});
 else fireEvent.pointerDown(document.body);
 await finish();
 expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});
