import type { ImportEnvelope } from "./contract";
import type { MusicInfo } from "shared/model/constants";
export type Track = MusicInfo & { key: string };
export type Resolved = { tracks: MusicInfo[]; limited: boolean };
export type Draft = { title: string; description: string; tracks: Track[]; limited: boolean };
export type State = { open: boolean; draft: Draft | null; pending: ImportEnvelope | null; resolving: ImportEnvelope | null; retry: ImportEnvelope | null; error: string };
export const initial: State = { open: false, draft: null, pending: null, resolving: null, retry: null, error: "" };
export type Action =
  | { type: "receive"; request: ImportEnvelope }
  | { type: "close" | "keep" | "replace" | "retry" }
  | { type: "resolved"; id: string; value: Resolved }
  | { type: "failed"; id: string; error: string }
  | { type: "edit"; field: "title" | "description"; value: string }
  | { type: "remove"; key: string }
  | { type: "move"; from: number; to: number };
export function reducer(state: State, action: Action): State {
  switch(action.type) {
    case "receive": return state.open
      ? { ...state, pending: action.request, error: "" }
      : { ...initial, open: true, resolving: action.request };
    case "close": return initial;
    case "keep": return { ...state, pending: null };
    case "replace": return state.pending && !state.resolving ? { ...state, resolving: state.pending, pending: null, error: "" } : state;
    case "retry": return state.retry && !state.resolving ? { ...state, resolving: state.retry, error: "" } : state;
    case "resolved": return state.resolving?.requestId === action.id ? {
      ...state, resolving: null, retry: null, error: "",
      draft: { title: "", description: "", limited: action.value.limited, tracks: action.value.tracks.map((track,i) => ({...track,key:`${action.id}-${i}`})) },
    } : state;
    case "failed": return state.resolving?.requestId === action.id ? { ...state, resolving: null, retry: state.resolving, error: action.error } : state;
    case "edit": return state.draft ? {...state,draft:{...state.draft,[action.field]:action.value}} : state;
    case "remove": return state.draft ? {...state,draft:{...state.draft,tracks:state.draft.tracks.filter(t=>t.key!==action.key)}} : state;
    case "move": {
      if(!state.draft || ![action.from,action.to].every(n=>Number.isInteger(n)&&n>=0&&n<state.draft!.tracks.length)) return state;
      const tracks=[...state.draft.tracks]; const [track]=tracks.splice(action.from,1); tracks.splice(action.to,0,track);
      return {...state,draft:{...state.draft,tracks}};
    }
  }
}
