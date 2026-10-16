import { lazy, Suspense } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import {
  playlistInfosState,
  playlistReadRevision,
  useReloadPlaylists,
} from "features/playlists/model/playlistAtoms";
import { ModalKind, useModalManager } from "features/overlays/PopupStates";
import musiclistOpenState from "features/queue/model/musiclistOpenState";
import Modal from "features/overlays/Modal";
import Popup from "features/overlays/Popup";
import Notice from "features/overlays/Notice";
import MusicPlayer from "features/player/pages/MusicPlayer";
import Spinner from "shared/ui/Spinner";
import Cover from "shared/ui/Cover";
import Icon from "shared/ui/Icon";
import ReadBoundary from "shared/ui/ReadBoundary";
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
          <Cover id={p.id} thumbnail={p.thumbnails[0]} />
          <span>
            <strong>{p.name}</strong>
            <small>{p.itemCount}곡</small>
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
  const queueOpen = useAtomValue(musiclistOpenState);
  const setQueueOpen = useSetAtom(musiclistOpenState);
  const reload = useReloadPlaylists();
  const readRevision = useAtomValue(playlistReadRevision);
  const home = location.pathname === "/";
  return (
    <div className={`studio-shell ${queueOpen ? "queue-open" : ""}`}>
      <a className="skip-link" href="#workspace">
        본문으로 이동
      </a>
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
        <nav className="sidebar-nav">
          <button
            className="nav-link"
            aria-current={home ? "page" : undefined}
            onClick={() => navigate("/")}
          >
            <Icon name="grid" />내 라이브러리
          </button>
          <button
            className="nav-link"
            onClick={() => modal(ModalKind.ImportYTPlaylistLink)}
          >
            <Icon name="download" />
            YouTube 가져오기
          </button>
        </nav>
        <div className="sidebar-section">
          <span>재생목록</span>
          <button
            className="icon-button"
            aria-label="재생목록 만들기"
            onClick={() => modal(ModalKind.CreatePlaylist)}
          >
            <Icon name="plus" />
          </button>
        </div>
        <ReadBoundary key={readRevision} onRetry={reload} compact>
          <Suspense fallback={<p className="quiet">목록을 불러오는 중…</p>}>
            <SidebarLibrary />
          </Suspense>
        </ReadBoundary>
        <div className="sidebar-bottom">
          <Icon name="device" />
          <div>
            <strong>이 브라우저에 저장</strong>
            <small>로그인 없이, 나만의 음악 공간</small>
          </div>
        </div>
      </aside>
      <div className="studio-main">
        <header className="studio-topbar">
          <div className="breadcrumb">
            <button
              className="mobile-wordmark"
              onClick={() => navigate("/")}
              aria-label="SMP 홈"
            >
              smp<span>.</span>
            </button>
            <button
              className="icon-button back-button"
              aria-label="라이브러리로 돌아가기"
              disabled={home}
              onClick={() => navigate("/")}
            >
              <Icon name="arrow" />
            </button>
            <span className="crumb-root">내 음악</span>
            <span className="slash">/</span>
            <span className="crumb-current">
              {home ? "라이브러리" : "재생목록"}
            </span>
          </div>
          <span className="local-badge">
            <i /> 이 브라우저에 저장
          </span>
        </header>
        <main id="workspace" tabIndex={-1} className="studio-content">
          <ReadBoundary
            key={`${location.pathname}-${readRevision}`}
            onRetry={reload}
          >
            <Suspense fallback={<Spinner />}>
              <Routes>
                <Route path="playlist/:id" element={<PlaylistPage />} />
                <Route
                  path="*"
                  element={
                    <Playlists
                      goToPlaylistPage={(id, focusAdd) =>
                        navigate(`/playlist/${id}`, { state: { focusAdd } })
                      }
                    />
                  }
                />
              </Routes>
            </Suspense>
          </ReadBoundary>
        </main>
      </div>
      <Notice />
      <Modal
        onCreated={(id) => {
          setQueueOpen(false);
          navigate(`/playlist/${id}`, { state: { focusAdd: true } });
        }}
      />
      <Popup />
      <MusicPlayer />
    </div>
  );
}
