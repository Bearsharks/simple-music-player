/** Prototype-only input. No titles, thumbnails, URLs or extension trust claims. */
export type ExternalItem = { kind: "video" | "playlist"; id: string };
export type SampleRequest = { sequence: number; items: readonly ExternalItem[] };
export type SampleTrack = { key: string; id: string; title: string; artist: string; seconds: number; tone: number; source: string };
export type Draft = { title: string; description: string; tracks: SampleTrack[] };
export type SampleResolver = (items: readonly ExternalItem[]) => Promise<Omit<SampleTrack, "key">[]>;

export const sampleInputs = {
  original: [{ kind: "video", id: "A" }, { kind: "playlist", id: "B" }, { kind: "video", id: "C" }],
  incoming: [{ kind: "video", id: "D" }, { kind: "playlist", id: "E" }],
  latest: [{ kind: "video", id: "F" }],
} as const satisfies Record<string, readonly ExternalItem[]>;

const samples: Record<string, { title: string; artist: string; seconds: number; tone: number }> = {
  A: { title: "Afterglow", artist: "Sunday Tape", seconds: 218, tone: 0 },
  B1: { title: "Blue hour", artist: "Soft Signals", seconds: 192, tone: 1 },
  B2: { title: "Rain on glass", artist: "Soft Signals", seconds: 246, tone: 2 },
  B3: { title: "Slow motion", artist: "Soft Signals", seconds: 204, tone: 3 },
  C: { title: "City lights", artist: "Night Archive", seconds: 231, tone: 4 },
  D: { title: "Daybreak", artist: "Paper Moon", seconds: 187, tone: 3 },
  E1: { title: "Every little thing", artist: "Mellow Club", seconds: 212, tone: 1 },
  E2: { title: "Easy on me", artist: "Mellow Club", seconds: 225, tone: 2 },
  F: { title: "First light", artist: "Morning Radio", seconds: 198, tone: 4 },
};
const playlists: Record<string, string[]> = { B: ["B1", "B2", "B3"], E: ["E1", "E2"] };

/** Local sample catalog only. No fetch, iframe, persistence or player API. */
export const resolveSamples: SampleResolver = async (items) => {
  await new Promise((resolve) => setTimeout(resolve, 650));
  return items.flatMap((item) => {
    const ids = item.kind === "playlist" ? playlists[item.id] : [item.id];
    if (!ids) throw new Error("샘플 목록을 찾을 수 없습니다.");
    return ids.map((id) => {
      const metadata = samples[id];
      if (!metadata) throw new Error("샘플 영상을 찾을 수 없습니다.");
      return { ...metadata, id, source: item.kind === "playlist" ? `목록 ${item.id}` : `영상 ${item.id}` };
    });
  });
};

export type PrototypeState = {
  open: boolean;
  draft: Draft | null;
  pending: SampleRequest | null;
  resolving: { request: SampleRequest; fail: boolean } | null;
  error: string;
  announcement: string;
};
export const initialState: PrototypeState = { open: false, draft: null, pending: null, resolving: null, error: "", announcement: "" };
export type Action =
  | { type: "receive"; request: SampleRequest }
  | { type: "close" }
  | { type: "keep" }
  | { type: "replace"; fail: boolean }
  | { type: "resolved"; sequence: number; tracks: Omit<SampleTrack, "key">[] }
  | { type: "failed"; sequence: number }
  | { type: "edit"; field: "title" | "description"; value: string }
  | { type: "remove"; key: string }
  | { type: "reorder"; key: string; to: number };

export function prototypeReducer(state: PrototypeState, action: Action): PrototypeState {
  switch (action.type) {
    case "receive":
      return state.open
        ? { ...state, pending: action.request, resolving: null, error: "", announcement: "새 요청이 도착했습니다. 현재 편집본은 유지됩니다." }
        : { ...initialState, open: true, resolving: { request: action.request, fail: false } };
    case "close": return initialState;
    case "keep": return { ...state, pending: null, resolving: null, error: "", announcement: "새 요청을 닫고 현재 편집본을 유지했습니다." };
    case "replace":
      if (!state.pending || state.resolving) return state;
      return { ...state, resolving: { request: state.pending, fail: action.fail }, error: "", announcement: "확인한 요청의 샘플 메타데이터를 준비합니다." };
    case "resolved": {
      if (state.resolving?.request.sequence !== action.sequence) return state;
      const tracks = action.tracks.map((track, index) => ({ ...track, key: `${action.sequence}-${index}` }));
      return { ...state, draft: { title: "나의 새로운 믹스", description: "", tracks }, pending: null, resolving: null, error: "", announcement: `샘플 ${tracks.length}곡을 준비했습니다.` };
    }
    case "failed":
      if (state.resolving?.request.sequence !== action.sequence) return state;
      return { ...state, resolving: null, error: "샘플 정보를 준비하지 못했어요. 기존 편집본은 그대로입니다.", announcement: "" };
    case "edit": return state.draft ? { ...state, draft: { ...state.draft, [action.field]: action.value } } : state;
    case "remove": {
      if (!state.draft) return state;
      const track = state.draft.tracks.find((track) => track.key === action.key);
      return { ...state, draft: { ...state.draft, tracks: state.draft.tracks.filter((track) => track.key !== action.key) }, announcement: `${track?.id} 삭제. ${state.draft.tracks.length - 1}곡이 남았습니다.` };
    }
    case "reorder": {
      if (!state.draft) return state;
      const tracks = [...state.draft.tracks];
      const index = tracks.findIndex((track) => track.key === action.key);
      const target = action.to;
      if (index < 0 || !Number.isInteger(target) || target < 0 || target >= tracks.length || target === index) return state;
      const [track] = tracks.splice(index, 1);
      tracks.splice(target, 0, track);
      return { ...state, draft: { ...state.draft, tracks }, announcement: `${tracks[target].id}, ${target + 1}번째로 이동했습니다.` };
    }
  }
}
