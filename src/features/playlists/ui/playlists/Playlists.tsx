import { useState } from "react";
import type { PlaylistInfo } from "shared/model/constants";
export interface PlaylistsProps {
  goToPlaylistPage: (id: string) => void;
  openCreatePlaylistPopup: () => void;
  playlistInfos: PlaylistInfo[];
  playPlaylist: (id: string) => void;
  openOptionsSelector: (e: React.MouseEvent<HTMLElement>, id: string) => void;
}
export default function Playlists(props: PlaylistsProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const items = props.playlistInfos.filter((p) =>
    p.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  if (sort === "name") items.sort((a, b) => a.name.localeCompare(b.name));
  // Legacy lists have no known creation time; use a stable name/ID fallback.
  else items.sort((a, b) =>
    (b.createdAt ?? 0) - (a.createdAt ?? 0) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  );
  const count = props.playlistInfos.reduce((n, p) => n + (p.itemCount || 0), 0);
  return (
    <div className="library-home">
      <section className="library-hero">
        <div className="hero-copy">
          <span className="section-kicker">
            <i /> MADE FOR YOUR EVERYDAY
          </span>
          <h1>
            좋아하는 음악만.
            <br />
            <span>당신의 리듬대로.</span>
          </h1>
          <p>
            모아두었던 플레이리스트를 가져와
            <br className="mobile-break" /> 나만의 흐름으로 만들어 보세요.
          </p>
          <button
            className="primary-button"
            onClick={props.openCreatePlaylistPopup}
          >
            <span className="material-icons" aria-hidden="true">
              add
            </span>
            새 재생목록
          </button>
          <div className="hero-stats">
            <span>
              <b>{props.playlistInfos.length.toString().padStart(2, "0")}</b>{" "}
              PLAYLISTS
            </span>
            <i />
            <span>
              <b>{count.toString().padStart(2, "0")}</b> TRACKS
            </span>
          </div>
        </div>
        <div className="record-art" aria-hidden="true">
          <div className="record-sleeve">
            <span>
              YOUR
              <br />
              DAILY
              <br />
              <em>rotation.</em>
            </span>
            <small>SMP / VOL. 001</small>
          </div>
          <div className="vinyl">
            <div className="vinyl-label">
              smp.<span>33⅓ RPM</span>
            </div>
          </div>
          <div className="floating-note">✦ &nbsp; Good music. Your way.</div>
        </div>
      </section>
      <section className="library-section" aria-label="저장한 재생목록">
        <div className="section-heading">
          <div>
            <span className="section-kicker">THE COLLECTION</span>
            <h2>
              내 재생목록 <span>{props.playlistInfos.length}</span>
            </h2>
          </div>
          <div className="library-tools">
            <label className="library-search">
              <span className="material-icons" aria-hidden="true">
                search
              </span>
              <input
                aria-label="라이브러리 검색"
                placeholder="라이브러리 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="재생목록 정렬"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recent">최근 추가순</option>
              <option value="name">이름순</option>
            </select>
          </div>
        </div>
        <div className="playlist-grid">
          {items.map((p, i) => (
            <article className="playlist-card" key={p.id}>
              <div className={`album-cover cover-${i % 4}`}>
                <button
                  className="cover-open"
                  aria-label={`${p.name} 열기`}
                  onClick={() => props.goToPlaylistPage(p.id)}
                >
                  <span className="cover-type" aria-hidden="true">
                    {p.name.slice(0, 2)}
                    <small>PERSONAL MIX</small>
                  </span>
                  {p.thumbnails?.[0] && (
                    <img
                      src={p.thumbnails[0]}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  )}
                </button>
                <span className="cover-index">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <button
                  className="card-play"
                  aria-label={`${p.name} 재생`}
                  disabled={!p.itemCount}
                  onClick={() => props.playPlaylist(p.id)}
                >
                  <span className="material-icons" aria-hidden="true">
                    play_arrow
                  </span>
                </button>
              </div>
              <div className="card-caption">
                <button
                  className="card-title"
                  onClick={() => props.goToPlaylistPage(p.id)}
                >
                  {p.name}
                </button>
                <button
                  className="icon-button"
                  aria-label={`${p.name} 더보기`}
                  onClick={(e) => props.openOptionsSelector(e, p.id)}
                >
                  <span className="material-icons" aria-hidden="true">
                    more_horiz
                  </span>
                </button>
              </div>
              <p className="card-meta">
                {p.itemCount}곡 <span>·</span>{" "}
                {p.sourcePlaylistUrl ? "YouTube에서 가져옴" : "나만의 재생목록"}
              </p>
            </article>
          ))}
          {!query && (
            <button
              className="create-card"
              onClick={props.openCreatePlaylistPopup}
            >
              <span>+</span>
              <strong>새로운 취향을 담아보세요</strong>
              <small>재생목록 만들기</small>
            </button>
          )}
        </div>
        {query && !items.length && (
          <div className="search-empty">
            <span className="material-icons">search_off</span>
            <p>“{query}”에 맞는 재생목록이 없어요.</p>
            <button onClick={() => setQuery("")}>검색 지우기</button>
          </div>
        )}
      </section>
      <footer className="library-footnote">
        <span>KEEP THE MUSIC PERSONAL.</span>
        <span>내 기기 · 내 플레이리스트 · 내 리듬</span>
      </footer>
    </div>
  );
}
