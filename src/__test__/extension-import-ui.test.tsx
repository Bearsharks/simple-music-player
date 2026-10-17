import { act, fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ExtensionImport from "features/youtube/import/ExtensionImport";
import type { ImportEnvelope } from "features/youtube/import/contract";
import { MusicListActionType, PlaylistActionType } from "shared/model/constants";
const mocks=vi.hoisted(()=>({receive:null as null|((r:any)=>void),status:null as null|((value:boolean)=>void),resolve:vi.fn(),queue:vi.fn(),save:vi.fn()}));
vi.mock("features/youtube/import/bridge",()=>({connectImportBridge:(receive:any,status:any)=>{mocks.receive=receive;mocks.status=status;status(false);return ()=>{};}}));
vi.mock("features/youtube/import/resolve",()=>({resolveImport:(...args:any[])=>mocks.resolve(...args)}));
vi.mock("features/queue/model/queue",()=>({useMusicListManager:()=>mocks.queue}));
vi.mock("features/playlists/model/playlistAtoms",()=>({usePlaylistManager:()=>mocks.save}));
vi.mock("features/youtube/import/ImportPlayer",()=>({default:({videoId}:{videoId:string})=><div aria-label="미리듣기">{videoId}</div>}));
const item={videoID:"azNG-AU0eGg",name:"첫 곡",owner:"채널",query:"",thumbnail:"https://i.ytimg.com/vi/azNG-AU0eGg/default.jpg"};
const req=(n=1):ImportEnvelope=>({type:"loopy.import",version:1,requestId:`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`,items:[{kind:"video",id:item.videoID}]});
beforeEach(()=>{mocks.resolve.mockReset().mockResolvedValue({tracks:[item,{...item,videoID:"hWhgrA2dhrk",name:"둘째 곡"}],limited:true});mocks.queue.mockReset().mockResolvedValue(undefined);mocks.save.mockReset().mockResolvedValue({createdId:"saved"});});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
async function open(){render(<ExtensionImport/>);act(()=>mocks.receive!(req()));await screen.findByRole("button",{name:"첫 곡 미리듣기"});}
it("places name validation below its input and disables saving whitespace without blocking queue",async()=>{
  await open();const input=screen.getByLabelText("재생목록 이름"),save=screen.getByRole("button",{name:"재생목록 저장"});
  fireEvent.change(input,{target:{value:"   "}});expect(save).toBeDisabled();
  expect(screen.queryByText("재생목록 이름을 입력하세요.")).not.toBeInTheDocument();
  fireEvent.blur(input);const error=screen.getByRole("alert");
  expect(input.nextElementSibling).toBe(error);expect(input).toHaveAttribute("aria-describedby",error.id);expect(input).toHaveAttribute("aria-invalid","true");
  expect(screen.getByRole("button",{name:"다음 재생"})).toBeEnabled();
  fireEvent.click(save);expect(mocks.save).not.toHaveBeenCalled();
  fireEvent.change(input,{target:{value:"이름"}});expect(save).toBeEnabled();expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
it("shows loading until resolution completes",async()=>{
  let finish!: (value:unknown)=>void;mocks.resolve.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
  render(<ExtensionImport/>);act(()=>mocks.receive!(req()));
  expect(screen.getByText("가져오는 중…")).toBeVisible();expect(screen.queryByLabelText("재생목록 이름")).not.toBeInTheDocument();
  await act(async()=>finish({tracks:[item],limited:false}));
  expect(screen.queryByText("가져오는 중…")).not.toBeInTheDocument();expect(screen.getByLabelText("재생목록 이름")).toBeVisible();
});
it("opens YouTube in a new tab without requiring extension",()=>{
  const open=vi.spyOn(window,"open").mockReturnValue(null);render(<ExtensionImport/>);
  fireEvent.change(screen.getByLabelText("YouTube 검색어"),{target:{value:"재즈 & 피아노"}});fireEvent.click(screen.getByRole("button",{name:"YouTube에서 검색"}));
  expect(open).toHaveBeenCalledWith("https://www.youtube.com/results?search_query=%EC%9E%AC%EC%A6%88%20%26%20%ED%94%BC%EC%95%84%EB%85%B8&loopy=1","_blank","noopener,noreferrer");
});
it("shows GitHub installation only while disconnected and auto-closes when connected",async()=>{
  render(<ExtensionImport/>);
  expect(screen.queryByRole("button",{name:"담은 목록"})).not.toBeInTheDocument();
  fireEvent.click(await screen.findByRole("button",{name:"확장 프로그램 다운로드"}));
    expect(screen.getByRole("link",{name:"확장 프로그램 다운로드"})).toHaveAttribute("href",`${import.meta.env.BASE_URL}downloads/loopy-extension.zip`);
  expect(screen.getByLabelText("확장 관리 주소")).toHaveValue("chrome://extensions");
  expect(screen.queryByRole("dialog",{name:"목록 편집"})).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button",{name:"연결 확인"}).at(-1)!);
  act(()=>mocks.status!(true));
  await waitFor(()=>expect(screen.queryByRole("dialog",{name:"확장 프로그램 설치"})).not.toBeInTheDocument());
  expect(screen.queryByRole("button",{name:"확장 프로그램 다운로드"})).not.toBeInTheDocument();
  act(()=>mocks.status!(false));expect(screen.getByRole("button",{name:"확장 프로그램 다운로드"})).toBeInTheDocument();
});
it("does not apply on receive; latest pending waits for approval and keeps edits",async()=>{
  await open();expect(mocks.queue).not.toHaveBeenCalled();expect(mocks.save).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("재생목록 이름"),{target:{value:"편집한 이름"}});
  fireEvent.click(screen.getByRole("button",{name:"둘째 곡 삭제"}));
  act(()=>{mocks.receive!(req(2));mocks.receive!(req(3));});
  expect(mocks.resolve).toHaveBeenCalledTimes(1);expect(screen.getByLabelText("재생목록 이름")).toHaveValue("편집한 이름");
  mocks.resolve.mockRejectedValueOnce(Error("목록 오류"));fireEvent.click(screen.getByRole("button",{name:"최신 목록으로 교체"}));
  await screen.findByText("목록 오류");expect(screen.getByLabelText("재생목록 이름")).toHaveValue("편집한 이름");
  expect(mocks.resolve.mock.calls[1][0]).toEqual(req(3).items);
  fireEvent.click(screen.getByRole("button",{name:"다음 재생"}));
  await waitFor(()=>expect(mocks.queue).toHaveBeenCalledWith({type:MusicListActionType.ADD_TO_NEXT,payload:[item]}));
});
it("saves edited tracks/title/description through local manager and closes",async()=>{
  await open();fireEvent.change(screen.getByLabelText("재생목록 이름"),{target:{value:"저장 이름"}});fireEvent.change(screen.getByLabelText("설명"),{target:{value:"설명"}});
  fireEvent.click(screen.getByRole("button",{name:"재생목록 저장"}));
  await waitFor(()=>expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({type:PlaylistActionType.CREATE,payload:expect.objectContaining({info:expect.objectContaining({name:"저장 이름",description:"설명",itemCount:2})})})));
  await waitFor(()=>expect(screen.queryByRole("dialog",{name:"목록 편집"})).not.toBeInTheDocument());
});
it("keeps draft after failed write and permits retry",async()=>{
  await open();mocks.queue.mockRejectedValueOnce(Error("쓰기 실패"));fireEvent.click(screen.getByRole("button",{name:"대기열에 추가"}));
  await screen.findByText("쓰기 실패");expect(screen.getByRole("dialog",{name:"목록 편집"})).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"대기열에 추가"}));await waitFor(()=>expect(mocks.queue).toHaveBeenCalledTimes(2));
  expect(screen.getByRole("dialog",{name:"목록 편집"})).toBeVisible();
});
it("preserves the editor after queue actions and Escape, then closes explicitly",async()=>{
  await open();fireEvent.change(screen.getByLabelText("재생목록 이름"),{target:{value:"편집 유지"}});
  fireEvent.click(screen.getByRole("button",{name:"다음 재생"}));
  await waitFor(()=>expect(mocks.queue).toHaveBeenCalledOnce());
  expect(screen.getByLabelText("재생목록 이름")).toHaveValue("편집 유지");
  fireEvent.keyDown(document,{key:"Escape"});expect(screen.getByRole("dialog",{name:"목록 편집"})).toBeVisible();
  await waitFor(()=>expect(screen.getByRole("button",{name:"목록 편집 닫기"})).toBeEnabled());
  fireEvent.click(screen.getByRole("button",{name:"목록 편집 닫기"}));expect(screen.queryByRole("dialog",{name:"목록 편집"})).not.toBeInTheDocument();
});
it("queues only the chosen track from its menu",async()=>{
  await open();const trigger=screen.getByRole("button",{name:"첫 곡 대기열 작업"});
  fireEvent.keyDown(trigger,{key:"ArrowDown"});
  fireEvent.click(await screen.findByRole("menuitem",{name:"대기열에 추가"}));
  await waitFor(()=>expect(mocks.queue).toHaveBeenCalledWith({type:MusicListActionType.APPEND_ITEMS,payload:[item]}));
  expect(screen.getByRole("dialog",{name:"목록 편집"})).toBeVisible();
});
