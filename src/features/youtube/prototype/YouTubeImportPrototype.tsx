import { useEffect, useReducer, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import Dialog from "shared/ui/Dialog";
import Icon from "shared/ui/Icon";
import { Button } from "shared/ui/shadcn/button";
import { Input } from "shared/ui/shadcn/input";
import { Textarea } from "shared/ui/shadcn/textarea";
import { Label } from "shared/ui/shadcn/label";
import PrototypeVolume from "./PrototypeVolume";
import {
  initialState, prototypeReducer, resolveSamples, sampleInputs,
  type SampleResolver, type SampleTrack,
} from "./model";
import "./YouTubeImportPrototype.scss";

const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
function Artwork({ tone, large = false }: { tone: number; large?: boolean }) {
  return (
    <span className={`yi-art yi-tone-${tone} ${large ? "yi-art-large" : ""}`} aria-hidden="true">
      <span className="yi-art-orbit" />
      <Icon name="wave" />
    </span>
  );
}

export default function YouTubeImportPrototype({ resolver = resolveSamples }: { resolver?: SampleResolver }) {
  const [state, dispatch] = useReducer(prototypeReducer, initialState);
  const sequence = useRef(0);
  const [selectedKey, setSelectedKey] = useState("");
  const [playing, setPlaying] = useState(false);
  const [failNext, setFailNext] = useState(false);
  const [result, setResult] = useState("");
  const [dragging, setDragging] = useState(false);
  const trackButtons = useRef(new Map<string, HTMLButtonElement>());
  const replacementBanner = useRef<HTMLElement>(null);
  const tracks = state.draft?.tracks ?? [];
  const selected = tracks.find((track) => track.key === selectedKey) ?? tracks[0];
  const busy = Boolean(state.resolving);

  useEffect(() => {
    replacementBanner.current?.scrollIntoView({ block: "nearest" });
  }, [state.pending?.sequence]);

  useEffect(() => {
    if (!state.resolving) return;
    let active = true;
    const { request, fail } = state.resolving;
    // Replacement requests are never resolved before the explicit Replace action.
    // Cleanup + reducer generation checks reject close/superseded completions.
    const resolve = async () => {
      try {
        const resolved = await resolver(request.items);
        if (fail) throw new Error("Simulated sample resolution failure");
        if (active) {
          const restoreDraftFocus = document.activeElement === document.body || Boolean(document.activeElement?.closest(".yi-replacement"));
          dispatch({ type: "resolved", sequence: request.sequence, tracks: resolved });
          // Keep the initial/default preview on the same stable occurrence during reorder.
          setSelectedKey(resolved.length ? `${request.sequence}-0` : "");
          setPlaying(false);
          setResult("");
          if (restoreDraftFocus) focusTrack();
        }
      } catch {
        if (active) dispatch({ type: "failed", sequence: request.sequence });
      }
    };
    void resolve();
    return () => { active = false; };
  }, [state.resolving, resolver]);

  const receive = (items: typeof sampleInputs[keyof typeof sampleInputs]) => {
    dispatch({ type: "receive", request: { sequence: ++sequence.current, items } });
    setResult("");
  };
  const close = () => { dispatch({ type: "close" }); setPlaying(false); setResult(""); setDragging(false); };
  const select = (track: SampleTrack) => { setSelectedKey(track.key); setPlaying(false); };
  const focusTrack = (key?: string) => {
    const previousFocus = document.activeElement;
    requestAnimationFrame(() => {
      // Do not steal focus if the user has already moved to another field.
      if (document.activeElement !== previousFocus && document.activeElement !== document.body) return;
      if (key) trackButtons.current.get(key)?.focus();
      else document.getElementById("yi-title")?.focus();
    });
  };
  const remove = (track: SampleTrack, index: number) => {
    const next = tracks[index + 1] ?? tracks[index - 1];
    dispatch({ type: "remove", key: track.key });
    if (selected?.key === track.key) { setSelectedKey(next?.key ?? ""); setPlaying(false); }
    setResult("");
    focusTrack(next?.key);
  };
  const action = (name: string) => {
    setPlaying(false);
    setResult(`데모 · ${tracks.length}곡 ${name} · 실제 재생·대기열·저장 변경 없음`);
  };
  const keep = () => {
    dispatch({ type: "keep" });
    setResult("");
    focusTrack();
  };
  const replace = () => {
    dispatch({ type: "replace", fail: failNext });
    setFailNext(false);
  };
  const edit = (field: "title" | "description", value: string) => {
    dispatch({ type: "edit", field, value });
    setResult("");
  };
  const retryInitial = () => { close(); receive(sampleInputs.original); };
  const dragEnd = ({ draggableId, source, destination, reason }: DropResult) => {
    setDragging(false);
    if (reason === "DROP" && destination && source.index !== destination.index) {
      dispatch({ type: "reorder", key: draggableId, to: destination.index });
      setResult("");
    }
  };

  return <main className="yi-page">
    <header className="yi-page-header">
      <Link to="/" className="yi-brand" aria-label="loopy 라이브러리로">
        <span className="yi-brand-bars" aria-hidden="true"><i /><i /><i /><i /></span>
        loopy<span className="yi-brand-dot">.</span>
      </Link>
    </header>
    <section className="yi-launch">
      <h1>목록 편집</h1>
      <Button onClick={() => receive(sampleInputs.original)}>
        <Icon name="download" />샘플 가져오기 열기
      </Button>
      <div className="yi-launch-note">
        <Icon name="lock" />
        <span>데모 · 샘플·무음 · 실제 재생·대기열·저장 변경 없음</span>
      </div>
      <Link className="yi-back-link" to="/">라이브러리로 돌아가기 <Icon name="external" /></Link>
    </section>

    {state.open && <Dialog label="목록 편집" className="yi-dialog" onClose={close}>
      <header className="yi-header">
        <h2>목록 편집</h2>
        <Button variant="ghost" size="icon" aria-label="목록 편집 닫기" onClick={close}>
          <Icon name="close" />
        </Button>
      </header>
      <div className="yi-scroll">
        {state.pending && <section ref={replacementBanner} className="yi-replacement" aria-label="최신 요청 교체 확인">
          <div role="status">
            <Icon name="download" />
            <div>
              <strong>새 요청</strong>
              <p>최신 요청 #{state.pending.sequence} · {state.pending.items.map((item) => `${item.kind} ${item.id}`).join(" + ")}</p>
              <p>교체하면 현재 제목·설명·곡 편집이 바뀝니다.</p>
            </div>
          </div>
          <div className="yi-replacement-actions">
            <Button variant="outline" onClick={keep}>현재 편집 유지</Button>
            <Button disabled={busy} onClick={replace}>{busy ? "샘플 준비 중…" : "새 요청으로 교체"}</Button>
          </div>
        </section>}
        {state.error && <div className="yi-error" role="alert">
          <Icon name="warning" /><span>{state.error}</span>
          {!state.pending && <Button variant="outline" onClick={retryInitial}>다시 시도</Button>}
        </div>}
        {!state.draft && <div className="yi-loading" role="status">
          <Icon name="wave" />
          <strong>{busy ? "불러오는 중…" : "곡 없음"}</strong>
          {!busy && !state.pending && <Button variant="outline" onClick={retryInitial}>원래 샘플 다시 불러오기</Button>}
        </div>}
        {state.draft && <div className="yi-workspace">
          <aside className="yi-editor" aria-label="미리보기와 재생목록 정보">
            <section className="yi-preview" aria-label="무음 시뮬레이션 미리보기">
              <div className="yi-preview-art">
                {selected ? <Artwork tone={selected.tone} large /> : <Icon name="music" />}
                {selected && <Button
                  className="yi-preview-play" variant="secondary" size="icon"
                  aria-label={playing ? "시뮬레이션 일시정지" : "무음 미리보기 시뮬레이션 시작"}
                  aria-pressed={playing} onClick={() => setPlaying(!playing)}
                ><Icon name={playing ? "pause" : "play"} /></Button>}
              </div>
              <div className="yi-preview-caption">
                <strong>{selected ? `${selected.id} · ${selected.title}` : "곡이 없습니다"}</strong>
                <span>{selected?.artist}</span>
                <div className="yi-preview-controls">
                  <div className="yi-preview-progress" data-playing={playing}><span /></div>
                  <PrototypeVolume />
                </div>
              </div>
            </section>
            <div className="yi-fields">
              <div>
                <Label htmlFor="yi-title">재생목록 이름 <span aria-hidden="true" className="yi-required">*</span></Label>
                <Input id="yi-title" required aria-required="true" disabled={busy}
                  value={state.draft.title} onChange={(event) => edit("title", event.target.value)} />
              </div>
              <div>
                <Label htmlFor="yi-description">설명 <span className="yi-optional">선택</span></Label>
                <Textarea id="yi-description" disabled={busy} value={state.draft.description}
                  onChange={(event) => edit("description", event.target.value)} />
              </div>
            </div>
          </aside>
          <section className="yi-track-section" aria-label="가져온 곡 편집">
            <div className="yi-track-heading">
              <h3>곡 <span>{tracks.length}</span></h3>
              <span><Icon name="clock" />{time(tracks.reduce((sum, track) => sum + track.seconds, 0))}</span>
            </div>
            {tracks.length ? <DragDropContext
              onBeforeDragStart={() => setDragging(true)} onDragEnd={dragEnd}
              dragHandleUsageInstructions="Space로 순서 이동 시작, 방향키로 이동, Space로 완료, Escape로 취소합니다."
            >
              <Droppable droppableId="youtube-import-prototype">
                {(drop) => <ol className="yi-track-list" ref={drop.innerRef} {...drop.droppableProps}>
                  {tracks.map((track, index) => <Draggable
                    key={track.key} draggableId={track.key} index={index}
                    disableInteractiveElementBlocking isDragDisabled={busy}
                  >
                    {(drag, snapshot) => <li
                      ref={drag.innerRef} {...drag.draggableProps} data-sample-track={track.id}
                      data-dragging={snapshot.isDragging || undefined}
                      className={selected?.key === track.key ? "yi-track selected" : "yi-track"}
                    >
                      <Button variant="ghost" size="icon" className="yi-grip"
                        {...drag.dragHandleProps} disabled={busy} aria-label={`${track.id} 순서 드래그`}>
                        <Icon name="grip" />
                      </Button>
                      <button
                        className="yi-track-select" aria-label={`${track.id} · ${track.title} 미리보기 선택`}
                        aria-pressed={selected?.key === track.key} onClick={() => select(track)}
                        ref={(node) => {
                          if (node) trackButtons.current.set(track.key, node);
                          else trackButtons.current.delete(track.key);
                        }}
                      >
                        <Artwork tone={track.tone} />
                        <span><strong>{track.title}</strong><small>{track.id} · {track.artist} · {track.source}</small></span>
                      </button>
                      <span className="yi-track-duration">{time(track.seconds)}</span>
                      <div className="yi-track-actions">
                        <Button className="yi-delete" variant="ghost" size="icon" disabled={busy || dragging}
                          aria-label={`${track.id} 삭제`} onClick={() => remove(track, index)}><Icon name="trash" /></Button>
                      </div>
                    </li>}
                  </Draggable>)}
                  {drop.placeholder}
                </ol>}
              </Droppable>
            </DragDropContext> : <div className="yi-empty">
              <Icon name="music" /><strong>곡 없음</strong>
              <Button variant="outline" onClick={retryInitial}>샘플 다시 열기</Button>
            </div>}
          </section>
        </div>}
        <details className="yi-simulation">
          <summary><Icon name="settings" />시뮬레이션</summary>
          <div className="yi-simulation-body">
            <div>
              <Button variant="outline" onClick={() => receive(sampleInputs.incoming)}>요청 보내기 · D + 목록 E</Button>
              <Button variant="outline" onClick={() => receive(sampleInputs.latest)}>최신 요청 보내기 · F</Button>
            </div>
            <label className="yi-failure-switch">
              <input type="checkbox" checked={failNext} onChange={(event) => setFailNext(event.target.checked)} />
              다음 교체 실패 시뮬레이션
            </label>
          </div>
        </details>
        <p className="yi-sr-only" role="status">{state.announcement}</p>
      </div>
      <footer className="yi-footer">
        <p className={result ? "yi-result" : "yi-demo-note"} role="status">
          <Icon name={result ? "check" : "lock"} />
          {result || "데모 · 샘플·무음 · 실제 재생·대기열·저장 변경 없음"}
        </p>
        <div className="yi-footer-actions">
          <Button variant="outline" disabled={busy || !tracks.length} onClick={() => action("다음 재생 시뮬레이션")}>
            <Icon name="next" />다음 재생
          </Button>
          <Button variant="outline" disabled={busy || !tracks.length} onClick={() => action("대기열 끝에 추가 시뮬레이션")}>
            <Icon name="queue" />대기열 끝에 추가
          </Button>
          <Button disabled={busy || !tracks.length || !state.draft?.title.trim()}
            onClick={() => action(`‘${state.draft?.title.trim()}’ 재생목록 저장 시뮬레이션`)}>
            <Icon name="save" />재생목록 저장
          </Button>
        </div>
      </footer>
    </Dialog>}
  </main>;
}
