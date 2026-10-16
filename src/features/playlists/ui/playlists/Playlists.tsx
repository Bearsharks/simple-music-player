import BrandPrimaryButton from "shared/ui/BrandPrimaryButton";
import { Input } from "shared/ui/shadcn/input";
import { Button } from "shared/ui/shadcn/button";
import LibraryBackup from "../LibraryBackup";
import { useEffect, useRef, useState } from "react";
import type { PlaylistInfo } from "shared/model/constants";
import Cover from "shared/ui/Cover";
import Icon from "shared/ui/Icon";
import "./Playlists.scss";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "shared/ui/shadcn/select";
export interface PlaylistsProps {
  goToPlaylistPage: (id: string, focusAdd?: boolean) => void;
  openCreatePlaylistPopup: () => void;
  playlistInfos: PlaylistInfo[];
  playPlaylist: (id: string) => void;
  openOptionsSelector: (
    event: React.MouseEvent<HTMLElement>,
    id: string,
  ) => void;
}
export default function Playlists(props: PlaylistsProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  const items = props.playlistInfos.filter((playlist) =>
    playlist.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  if (sort === "name") items.sort((a, b) => a.name.localeCompare(b.name));
  else
    items.sort(
      (a, b) =>
        (b.createdAt ?? 0) - (a.createdAt ?? 0) ||
        a.name.localeCompare(b.name) ||
        a.id.localeCompare(b.id),
    );
  const count = props.playlistInfos.reduce(
    (sum, playlist) => sum + (playlist.itemCount || 0),
    0,
  );
  const hasLists = props.playlistInfos.length > 0;
  return (
    <section className="library-home" aria-label="저장한 재생목록">
      <header className="page-heading">
        <div>
          <h1 tabIndex={-1} ref={heading}>
            내 라이브러리
          </h1>
          <p>
            {props.playlistInfos.length}개의 재생목록 · {count}곡
          </p>
        </div>
        <div className="heading-actions">
          {hasLists && (
            <BrandPrimaryButton
              className="primary-button"
              aria-label="새 재생목록"
              onClick={props.openCreatePlaylistPopup}
            >
              <Icon name="plus" />
              <span>새 재생목록</span>
            </BrandPrimaryButton>
          )}
          <LibraryBackup />
        </div>
      </header>
      {hasLists ? (
        <>
          <div className="library-tools">
            <label className="library-search">
              <Icon name="search" />
              <Input
                aria-label="라이브러리 검색"
                placeholder="재생목록 찾기"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger aria-label="재생목록 정렬">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" collisionPadding={8}>
                <SelectItem value="recent">최근 추가순</SelectItem>
                <SelectItem value="name">이름순</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="playlist-grid">
            {items.map((playlist) => (
              <article className="playlist-card" key={playlist.id}>
                <div className="cover-frame">
                  <button
                    className="cover-open"
                    aria-label={`${playlist.name} 열기`}
                    onClick={() => props.goToPlaylistPage(playlist.id)}
                  >
                    <Cover
                      id={playlist.id}
                      thumbnail={playlist.thumbnails?.[0]}
                    />
                  </button>
                  {playlist.itemCount ? (
                    <button
                      className="card-play"
                      aria-label={`${playlist.name} 재생`}
                      onClick={() => props.playPlaylist(playlist.id)}
                    >
                      <Icon name="play" />
                    </button>
                  ) : (
                    <button
                      className="card-play add"
                      aria-label={`${playlist.name} 곡 추가`}
                      onClick={() => props.goToPlaylistPage(playlist.id, true)}
                    >
                      <Icon name="plus" />
                    </button>
                  )}
                </div>
                <div className="card-caption">
                  <button
                    className="card-title"
                    onClick={() => props.goToPlaylistPage(playlist.id)}
                  >
                    {playlist.name}
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`${playlist.name} 더보기`}
                    aria-haspopup="menu"
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        event.currentTarget.click();
                      }
                    }}
                    onClick={(event) =>
                      props.openOptionsSelector(event, playlist.id)
                    }
                  >
                    <Icon name="more" />
                  </button>
                </div>
                <p className="card-meta">
                  {playlist.itemCount
                    ? `${playlist.itemCount}곡`
                    : "아직 곡 없음"}
                  {playlist.sourcePlaylistUrl && (
                    <>
                      <span>·</span>
                      <Icon name="link" />
                      <span className="desktop-source">YouTube</span>
                    </>
                  )}
                </p>
              </article>
            ))}
          </div>
          {query && !items.length && (
            <div className="search-empty">
              <Icon name="search" />
              <h2>찾는 재생목록이 없어요</h2>
              <p>“{query}”에 맞는 이름을 찾지 못했습니다.</p>
              <Button
                variant="secondary"
                className="secondary-button"
                onClick={() => setQuery("")}
              >
                검색 지우기
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="library-empty">
          <div className="empty-wave">
            <Cover id="smp-empty-wave" />
          </div>
          <span className="empty-tag">Feel Every Beat ↗</span>
          <h2>
            좋아하는 음악으로
            <br />
            나만의 공간을 채워보세요.
          </h2>
          <p>
            YouTube 재생목록을 가져오거나 빈 목록을 만들어
            <br />
            듣고 싶은 곡을 하나씩 담아보세요.
          </p>
          <div className="actions">
            <BrandPrimaryButton
              className="primary-button"
              aria-label="새 재생목록"
              onClick={props.openCreatePlaylistPopup}
            >
              <Icon name="plus" />새 재생목록
            </BrandPrimaryButton>
          </div>
        </div>
      )}
    </section>
  );
}
