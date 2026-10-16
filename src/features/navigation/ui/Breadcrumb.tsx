import { Component, Suspense, type ReactNode } from "react";
import { Link, useMatch } from "react-router-dom";
import { useAtomValue } from "jotai";
import {
  playlistIDsState,
  playlistInfoStateFamily,
  playlistReadRevision,
} from "features/playlists/model/playlistAtoms";

function CurrentName({ id }: { id: string }) {
  const info = useAtomValue(playlistInfoStateFamily(id));
  return (
    <span className="crumb-current" aria-current="page" title={info.name}>
      {info.name}
    </span>
  );
}
function ExistingName({ id }: { id: string }) {
  const ids = useAtomValue(playlistIDsState);
  return ids.includes(id) ? (
    <CurrentName id={id} />
  ) : (
    <span className="crumb-current" aria-current="page">
      목록 없음
    </span>
  );
}
class NameBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <span className="crumb-current" aria-current="page">
        불러오기 실패
      </span>
    ) : (
      this.props.children
    );
  }
}
/** Shares the existing metadata atoms; a read failure never remounts the player. */
export default function Breadcrumb() {
  const match = useMatch("/playlist/:id");
  const revision = useAtomValue(playlistReadRevision);
  const id = match?.params.id;
  return (
    <nav className="breadcrumb-nav" aria-label="현재 위치">
      {id ? (
        <>
          <Link to="/">라이브러리</Link>
          <span className="slash" aria-hidden="true">
            /
          </span>
          <NameBoundary key={`${id}-${revision}`}>
            <Suspense
              fallback={
                <span className="crumb-current" aria-current="page">
                  불러오는 중…
                </span>
              }
            >
              <ExistingName id={id} />
            </Suspense>
          </NameBoundary>
        </>
      ) : (
        <span className="crumb-current" aria-current="page">
          라이브러리
        </span>
      )}
    </nav>
  );
}
