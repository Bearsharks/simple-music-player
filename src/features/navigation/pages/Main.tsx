import { lazy, Suspense } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { playlistInfosState } from "features/playlists/model/playlistAtoms";
import { ModalKind, useModalManager } from "features/overlays/PopupStates";
import Modal from "features/overlays/Modal";
import Popup from "features/overlays/Popup";
import Notice from "features/overlays/Notice";
import MusicPlayer from "features/player/pages/MusicPlayer";
import Spinner from "shared/ui/Spinner";
import "./StudioShell.scss";
const Playlists = lazy(
  () => import("features/playlists/ui/ConnectedPlaylists"),
);
const PlaylistPage = lazy(
  () => import("features/playlists/pages/PlaylistPage"),
);
function SidebarLibrary() {
  const items = useAtomValue(playlistInfosState);
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="sidebar-playlists">
      {items.map((p) => (
        <button
          key={p.id}
          className={location.pathname === `/playlist/${p.id}` ? "active" : ""}
          onClick={() => navigate(`/playlist/${p.id}`)}
        >
          <span className="mini-cover" aria-hidden="true">
            ♫
          </span>
          <span>
            {p.name}
            <small>{p.itemCount} tracks</small>
          </span>
        </button>
      ))}
    </div>
  );
}
export default function Main() {
  const navigate = useNavigate();
  const location = useLocation();
  const modal = useModalManager();
  return (
    <div className="studio-shell">
      <aside className="studio-sidebar" aria-label="메인 메뉴">
        <button
          className="studio-logo"
          onClick={() => navigate("/")}
          aria-label="SMP 홈"
        >
          <span className="logo-bars" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          smp<span className="logo-dot">.</span>
        </button>
        <div className="sidebar-caption">YOUR SPACE</div>
        <button
          className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
          onClick={() => navigate("/")}
        >
          <span className="material-icons" aria-hidden="true">
            grid_view
          </span>
          내 라이브러리
          <span className="nav-indicator" />
        </button>
        <button
          className="nav-link"
          onClick={() => modal(ModalKind.ImportYTPlaylistLink)}
        >
          <span className="material-icons" aria-hidden="true">
            add_link
          </span>
          YouTube 가져오기
        </button>
        <div className="sidebar-section">
          <span>재생목록</span>
          <button
            aria-label="재생목록 만들기"
            onClick={() => modal(ModalKind.CreatePlaylist)}
          >
            +
          </button>
        </div>
        <Suspense fallback={<p className="quiet">목록을 불러오는 중…</p>}>
          <SidebarLibrary />
        </Suspense>
        <div className="sidebar-bottom">
          <span className="material-icons" aria-hidden="true">
            devices
          </span>
          <div>
            이 브라우저에 저장<small>로그인 없이, 나만의 라이브러리</small>
          </div>
          <span className="status-dot" />
        </div>
      </aside>
      <div className="studio-main">
        <header className="studio-topbar">
          <div className="breadcrumb">
            <button
              aria-label="라이브러리로 돌아가기"
              disabled={location.pathname === "/"}
              onClick={() => navigate("/")}
            >
              <span className="material-icons">arrow_back</span>
            </button>
            <span>Workspace</span>
            <span className="slash">/</span>
            <strong>
              {location.pathname === "/" ? "Library" : "Playlist"}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="local-badge">
              <i /> LOCAL FIRST
            </span>
            <button
              className="import-top"
              onClick={() => modal(ModalKind.ImportYTPlaylistLink)}
            >
              <span className="material-icons" aria-hidden="true">
                add
              </span>
              <span>가져오기</span>
            </button>
          </div>
        </header>
        <main className="studio-content">
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route path="playlist/:id" element={<PlaylistPage />} />
              <Route
                path="*"
                element={
                  <Playlists
                    goToPlaylistPage={(id) => navigate(`/playlist/${id}`)}
                  />
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>
      <Notice />
      <Modal />
      <Popup />
      <MusicPlayer />
    </div>
  );
}
