import { useEffect, useState, type FormEvent } from 'react';
import { addPlaylist, emptyLibrary, LIBRARY_KEY, readLibrary, removePlaylist, writeLibrary, type Library } from '../model/library';
import './LocalLibrary.css';
export default function LocalLibrary() {
  const [library, setLibrary] = useState<Library>(emptyLibrary);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const reload = () => {
    try { setLibrary(readLibrary()); setReady(true); setError(''); }
    catch (e) { setReady(false); setError(e instanceof Error ? e.message : '목록을 읽지 못했습니다.'); }
  };
  useEffect(() => {
    reload();
    const receive = (e: StorageEvent) => { if (e.key === LIBRARY_KEY || e.key === null) reload(); };
    window.addEventListener('storage', receive);
    return () => window.removeEventListener('storage', receive);
  }, []);
  const commit = (change: (latest: Library) => Library): boolean => {
    try {
      const next = change(readLibrary());
      writeLibrary(next); setLibrary(next); setError(''); return true;
    } catch (e) { setError(e instanceof Error ? e.message : '목록을 저장하지 못했습니다.'); return false; }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (commit(latest => addPlaylist(latest, url, title))) { setUrl(''); setTitle(''); setNotice('이 브라우저에 저장했습니다. 아래 플레이어에서 재생을 눌러 주세요.'); }
  };
  const selected = library.playlists.find(p => p.id === library.selectedId);
  return <main className="local-library">
    <header><p className="eyebrow">SIMPLE MUSIC PLAYER</p><h1>내 재생목록</h1><p>공개 YouTube 재생목록 링크를 저장하고 바로 들으세요. 로그인은 필요 없습니다.</p></header>
    <form onSubmit={submit} className="import-form">
      <label htmlFor="playlist-url">YouTube 재생목록 URL</label>
      <input id="playlist-url" type="url" required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.youtube.com/playlist?list=…" />
      <label htmlFor="playlist-title">목록 이름 (선택)</label>
      <input id="playlist-title" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 집중할 때 듣는 음악" />
      <button type="submit" disabled={!ready}>목록 저장</button>
    </form>
    {error && <div role="alert">{error} <button onClick={reload}>다시 읽기</button></div>}
    <p role="status">{notice}</p>
    <div className="library-layout">
      <section aria-label="저장한 재생목록">
        <h2>저장한 목록 ({library.playlists.length})</h2>
        {ready && !library.playlists.length && <p>아직 저장한 목록이 없습니다. 위에 재생목록 링크를 넣어 주세요.</p>}
        <ul>{library.playlists.map(p => <li key={p.id}>
          <button className="playlist-select" aria-pressed={selected?.id === p.id} onClick={() => commit(latest => {
            if (!latest.playlists.some(item => item.id === p.id)) throw new Error('다른 탭에서 삭제된 목록입니다. 다시 읽어 주세요.');
            return { ...latest, selectedId: p.id };
          })}>{p.title}</button>
          <button aria-label={`${p.title} 삭제`} onClick={() => setPendingDelete(p.id)}>삭제</button>
          {pendingDelete === p.id && <div className="delete-confirm">이 브라우저의 목록을 삭제할까요?
            <button onClick={() => { if (commit(latest => removePlaylist(latest, p.id))) { setPendingDelete(null); setNotice('로컬 목록을 삭제했습니다. YouTube 원본은 변경되지 않습니다.'); } }}>삭제 확인</button>
            <button onClick={() => setPendingDelete(null)}>취소</button>
          </div>}
        </li>)}</ul>
      </section>
      <section aria-label="재생 플레이어">
        <h2>{selected?.title ?? '재생할 목록을 선택하세요'}</h2>
        {selected && <>
          <iframe key={selected.id} title={`${selected.title} YouTube 플레이어`} width="560" height="315" src={`https://www.youtube.com/embed?listType=playlist&list=${encodeURIComponent(selected.id)}&playsinline=1`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
          <p><a href={selected.url} target="_blank" rel="noopener noreferrer">YouTube에서 원본 열기</a></p>
          <p>재생·다음 곡·목록 선택은 플레이어에서 조작할 수 있습니다. 비공개·삭제·임베드 제한 콘텐츠는 재생되지 않을 수 있습니다.</p>
        </>}
      </section>
    </div>
    <footer>저장되는 것은 재생목록 링크와 이름입니다. 곡 파일이나 전체 곡 목록을 복사하지 않습니다. 원본의 변경은 YouTube 플레이어가 불러올 때 반영됩니다. 이 브라우저의 사이트 데이터를 지우면 저장한 목록도 사라지며, 다른 기기와 동기화되지 않습니다.</footer>
  </main>;
}
