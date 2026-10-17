/* SMP Electric Night — standalone interaction prototype.
 * No network requests, YouTube connection, or audio playback.
 * localStorage below is isolated demo storage. Production retains IndexedDB.
 */
(() => {
  'use strict';
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const paths = {
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    plus:'<path d="M12 5v14M5 12h14"/>', search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>', arrow:'<path d="m10 5-7 7 7 7M3 12h18"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>', link:'<path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1" transform="translate(0 -1) scale(.95)"/>',
    more:'<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
    play:'<path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none"/>', pause:'<path d="M7 5h4v14H7zm7 0h4v14h-4z" fill="currentColor" stroke="none"/>',
    next:'<path d="m5 6 10 6-10 6Z" fill="currentColor" stroke="none"/><path d="M18 5v14"/>', previous:'<path d="m19 6-10 6 10 6Z" fill="currentColor" stroke="none"/><path d="M6 5v14"/>',
    queue:'<path d="M3 6h12M3 11h12M3 16h7m8-4v7a2.5 2.5 0 1 1-2-2.45V8l5-1v4Z"/>',
    volume:'<path d="M4 9h4l5-4v14l-5-4H4ZM17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>', mute:'<path d="M4 9h4l5-4v14l-5-4H4Zm13 0 5 6m0-6-5 6"/>',
    music:'<path d="M9 17V5l11-2v12M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="17" cy="16" rx="3" ry="2.5"/>',
    device:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 21h6m-3-4v4"/>',
    edit:'<path d="m4 16-1 5 5-1L21 7l-4-4Zm10-10 4 4"/>', trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    up:'<path d="m6 14 6-6 6 6"/>', down:'<path d="m6 10 6 6 6-6"/>', grip:'<circle cx="8" cy="5" r="1"/><circle cx="16" cy="5" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="8" cy="19" r="1"/><circle cx="16" cy="19" r="1"/>',
    check:'<path d="m4 12 5 5L20 6"/>', warning:'<path d="M10.3 4a2 2 0 0 1 3.4 0L22 19H2ZM12 9v4m0 3h.01"/>',
    reset:'<path d="M4 10a8 8 0 1 1 1 8M4 3v7h7"/>', save:'<path d="M4 3h13l4 4v14H3V3Zm4 0v6h8V3M7 21v-8h10v8"/>',
    external:'<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>', wave:'<path d="M3 10v4m4-7v10m5-15v20m5-16v12m4-9v6"/>',
    settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="var(--surface)"/><circle cx="16" cy="12" r="2" fill="var(--surface)"/><circle cx="10" cy="18" r="2" fill="var(--surface)"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.music}</svg>`;
  const uid = () => crypto.randomUUID?.() || `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const hash = s => [...String(s)].reduce((n,c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
  const time = seconds => !seconds ? '0:00' : `${Math.floor(seconds / 60)}:${String(Math.floor(seconds) % 60).padStart(2,'0')}`;
  const storageKey = 'smp-electric-night-prototype-v1';
  const titles = ['Neon Avenue','새벽의 좌표','Blue Hours','Velvet Frequency','천천히, 더 멀리','Afterimage','City Lights','느린 파도','Somewhere Quiet','Midnight Signals'];
  const makeTrack = (i, prefix = 'seed') => ({id:`${prefix}-${i}`,videoId:`DEMO${String(i).padStart(7,'0')}`,name:titles[i % titles.length],owner:'SMP 예시 트랙',duration:184 + (i * 23 % 105),art:hash(prefix + i)});
  function seedPlaylists() {
    return [
      ['night-drive','Night Drive','늦은 귀가길, 조금 더 듣고 싶은 음악.',7,0],
      ['warm-focus','집중의 온도','하나의 일에 천천히 몰입하는 시간.',6,2],
      ['weekend','Soft Sunday','속도를 조금 늦춰도 좋은 주말.',5,5],
      ['electric','Electric Bloom','일상의 밝기를 한 칸 높이는 소리.',6,7],
      ['blue-hour','푸른 시간','낮과 밤 사이, 고요한 순간들.',4,3],
      ['rain','Rain on Repeat','창밖의 비와 함께 흐르는 음악.',5,6],
      ['city','도시의 잔향','익숙한 거리에서 발견한 새로운 리듬.',3,1],
      ['new-space','아직 이름 없는 취향','다음에 좋아하게 될 음악을 위해.',0,0],
    ].map(([id,name,description,count,start],i)=>({id,name,description,createdAt:1000-i,source:i===0?'https://www.youtube.com/playlist?list=PL_DEMO_NIGHT_DRIVE':'',art:hash(id),tracks:Array.from({length:count},(_,j)=>makeTrack(start+j,id))}));
  }
  let persisted;
  try { persisted=JSON.parse(localStorage.getItem(storageKey)); } catch (_) { persisted=null; }
  let state = {
    playlists:Array.isArray(persisted) && persisted.every(p=>Array.isArray(p.tracks)) ? persisted : seedPlaylists(),
    route:'library', selected:null, query:'', sort:'recent', addOpen:false, edit:false,
    queue:[], currentId:null, queueOpen:false, queueTab:'now', queueEdit:false, phase:'idle', elapsed:0, volume:70,
    failNextSave:false, readError:false, modal:null, busy:false, undo:null,
  };
  let toastTimer, phaseTimer, modalReturnKey='', queueReturnKey='', dragId=null;
  const current = () => state.queue.find(t=>t.id===state.currentId);
  const playlist = id => state.playlists.find(p=>p.id===id);
  const selectedPlaylist = () => playlist(state.selected);
  const smallScreen = () => window.innerWidth < 1200;
  const iconButton = (action,label,name,extra='',active=false) => `<button class="icon-button${active?' active':''}" type="button" data-action="${action}" aria-label="${esc(label)}" title="${esc(label)}" ${extra}>${icon(name)}</button>`;
  const brand = () => `<span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>smp</span><b>.</b>`;
  let coverSerial = 0;
  function cover(seed, className='') {
    const n=Number(seed)||hash(seed), id=`art-${++coverSerial}`, variant=n%4;
    const colors=[['#241543','#a855ff','#ff4d8d','#4cc9ff'],['#152333','#4cc9ff','#6c70ef','#a855ff'],['#35202f','#ff4d8d','#d899fd','#7065eb'],['#222044','#7469ff','#bd7bff','#f69dca']][variant];
    const flip=n%2?'-1 1':'1 1';
    return `<div class="cover ${className}" aria-hidden="true"><svg viewBox="0 0 300 300" focusable="false"><defs><linearGradient id="${id}-bg" x2=".8" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="#0e0d1e"/></linearGradient><linearGradient id="${id}-r" x1="0" y1=".5" x2="1" y2=".3"><stop stop-color="${colors[1]}"/><stop offset=".55" stop-color="${colors[2]}"/><stop offset="1" stop-color="${colors[3]}"/></linearGradient><linearGradient id="${id}-hi" x2="1" y2="1"><stop stop-color="#ffffff" stop-opacity=".6"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs><rect width="300" height="300" fill="url(#${id}-bg)"/><circle cx="${n%2?250:44}" cy="${n%3?45:250}" r="110" fill="${colors[1]}" opacity=".08"/><g transform="translate(${n%2?300:0} 0) scale(${flip})"><path d="M-40 208C36 48 80 270 153 140S269 38 342 119" fill="none" stroke="url(#${id}-r)" stroke-width="${variant===1?64:78}" stroke-linecap="round"/><path d="M-40 171C36 11 80 233 153 103S269 1 342 82" fill="none" stroke="url(#${id}-hi)" stroke-width="2" opacity=".8"/><path d="M-40 216C36 56 80 278 153 148S269 46 342 127" fill="none" stroke="#050510" stroke-width="27" opacity=".13"/></g><circle cx="264" cy="37" r="3" fill="#fff" opacity=".7"/><path d="M28 270h20m-20-5h10" stroke="#ffffff60" stroke-width="1.5"/><text x="272" y="273" text-anchor="end" fill="#ffffff90" font-size="9" font-family="Arial,sans-serif" letter-spacing="2">SMP</text></svg></div>`;
  }
  function captureFocus(){const el=document.activeElement;return {key:el?.dataset.focus || el?.id, start:el?.selectionStart, end:el?.selectionEnd};}
  function focusKey(key){if(!key)return;const el=document.getElementById(key)||$$('[data-focus]').find(e=>e.dataset.focus===key);if(el&&!el.closest('[inert]'))el.focus({preventScroll:true});}
  function render(){
    const f=captureFocus();coverSerial=0;
    renderSidebar();renderMain();renderDock();renderQueue();
    applyQueueMode();
    if(!$('#modal').open&&f.key){focusKey(f.key);const el=document.activeElement;if(typeof f.start==='number'&&el?.setSelectionRange){try{el.setSelectionRange(f.start,f.end)}catch(_){}}}
  }
  function renderSidebar(){
    $('#sidebar').innerHTML=`<button class="brand" data-action="library" aria-label="SMP 라이브러리">${brand()}</button><nav class="nav-group" aria-label="탐색"><button class="nav-item" data-action="library" ${state.route==='library'?'aria-current="page"':''}>${icon('grid')}내 라이브러리</button><button class="nav-item" data-action="import">${icon('download')}YouTube 가져오기</button></nav><div class="sidebar-section"><span>재생목록</span>${iconButton('create','새 재생목록','plus')}</div><nav class="side-list" aria-label="저장한 재생목록">${state.playlists.map(p=>`<button class="side-playlist ${state.selected===p.id?'active':''}" data-action="open-playlist" data-id="${p.id}" data-focus="side-${p.id}" ${state.selected===p.id?'aria-current="page"':''}>${cover(p.art)}<span><strong>${esc(p.name)}</strong><small>${p.tracks.length}곡</small></span></button>`).join('')}</nav><div class="local-note">${icon('device')}<div><strong>이 브라우저에 저장</strong><small>로그인 없이, 나만의 음악</small></div></div>`;
  }
  function renderMain(){
    const p=selectedPlaylist();
    const path=state.route==='detail'?`${iconButton('library','라이브러리로 돌아가기','arrow')}<span class="crumb-current">재생목록</span>`:'<span class="mobile-brand">smp<b>.</b></span><span class="desktop-path">나의 음악 공간</span>';
    $('#main-panel').innerHTML=`<div class="topbar"><div class="topbar-path">${path}</div><div class="topbar-actions"><button class="prototype-chip" data-action="scenarios" title="프로토타입 시연 설정"><i></i><span class="desktop-label">프로토타입 · 실제 재생 없음</span><span class="mobile-brand-label">${window.innerWidth<=760?'시연 설정':''}</span></button>${iconButton('toggle-queue','재생 대기열 '+(state.queueOpen?'닫기':'열기'),'queue',`aria-expanded="${state.queueOpen}" aria-controls="queue-panel" data-focus="top-queue"`,state.queueOpen)}</div></div><div class="content">${state.route==='detail' ? p?detailView(p):missingView() : libraryView()}</div>`;
  }
  function libraryView(){
    if(state.readError)return `<div class="page-heading"><h1 id="content-title" tabindex="-1">내 라이브러리</h1></div><div class="empty-state"><span class="empty-tag">저장한 음악은 그대로예요</span><h2>목록을 불러오지 못했어요.</h2><p>일시적인 읽기 오류를 보여주는 시연 상태입니다. 다시 시도하면 예시 목록으로 돌아갑니다.</p><button class="button primary" data-action="retry-read">${icon('reset')}다시 불러오기</button></div>`;
    let items=state.playlists.filter(p=>p.name.toLocaleLowerCase().includes(state.query.toLocaleLowerCase()));
    items.sort(state.sort==='name'?(a,b)=>a.name.localeCompare(b.name):(a,b)=>b.createdAt-a.createdAt);
    const total=state.playlists.reduce((n,p)=>n+p.tracks.length,0);
    return `<header class="page-heading"><div><h1 id="content-title" tabindex="-1">내 라이브러리</h1><p>${state.playlists.length}개의 재생목록 <span aria-hidden="true">·</span> ${total}곡</p></div><div class="heading-actions"><button class="button secondary" data-action="import" aria-label="YouTube 재생목록 가져오기">${icon('download')}<span class="button-label">가져오기</span></button><button class="button primary" data-action="create" aria-label="새 재생목록 만들기" data-focus="create">${icon('plus')}<span class="button-label">새 재생목록</span></button></div></header>
    ${!state.playlists.length?emptyLibrary():`<div class="toolbar"><label class="search-field">${icon('search')}<input type="search" id="library-search" value="${esc(state.query)}" placeholder="재생목록 찾기" aria-label="재생목록 이름 검색" autocomplete="off">${state.query?iconButton('clear-search','검색 지우기','close'):''}</label><select id="sort" aria-label="재생목록 정렬"><option value="recent" ${state.sort==='recent'?'selected':''}>최근 추가순</option><option value="name" ${state.sort==='name'?'selected':''}>이름순</option></select></div><section aria-label="재생목록" class="playlist-grid">${items.map(cardView).join('')}</section>${!items.length?`<div class="zero-result">${icon('search')}<h2>찾는 재생목록이 없어요.</h2><p>“${esc(state.query)}” 대신 다른 이름을 찾아보세요.</p><button class="button secondary" data-action="clear-search">검색 지우기</button></div>`:''}`}
    <footer class="library-foot"><span>예시 데이터로 구성한 디자인 프로토타입</span><span class="eyebrow">Feel Every Beat ↗</span></footer>`;
  }
  function emptyLibrary(){return `<section class="empty-state"><div class="empty-wave"><svg viewBox="0 0 200 100" aria-hidden="true"><defs><linearGradient id="empty-gradient"><stop stop-color="#a855ff"/><stop offset=".55" stop-color="#ff4d8d"/><stop offset="1" stop-color="#4cc9ff"/></linearGradient></defs><path d="M8 63C46-10 55 135 105 48S164 19 193 38" fill="none" stroke="url(#empty-gradient)" stroke-width="21" stroke-linecap="round"/></svg></div><span class="empty-tag">Feel Every Beat ↗</span><h2>첫 번째 플레이리스트를<br>만나볼 시간.</h2><p>YouTube 목록을 가져오거나, 빈 목록에 좋아하는 영상 URL을 하나씩 담아보세요.</p><div class="actions"><button class="button primary" data-action="import">${icon('download')}YouTube에서 가져오기</button><button class="button secondary" data-action="create">${icon('plus')}빈 재생목록 만들기</button></div><p class="field-note">이 프로토타입은 실제 YouTube에 연결하지 않습니다.</p></section>`;}
  function cardView(p){return `<article class="playlist-card"><div class="cover-frame"><button class="cover-button" data-action="open-playlist" data-id="${p.id}" data-focus="open-${p.id}" aria-label="${esc(p.name)} 열기">${cover(p.art)}</button><button class="card-play ${!p.tracks.length?'add':''}" data-action="${p.tracks.length?'play-playlist':'add-empty'}" data-id="${p.id}" data-focus="play-${p.id}" aria-label="${esc(p.name)} ${p.tracks.length?'재생':'곡 추가'}" title="${p.tracks.length?'재생':'첫 곡 추가'}">${icon(p.tracks.length?'play':'plus')}</button></div><div class="card-info"><button class="card-title" data-action="open-playlist" data-id="${p.id}">${esc(p.name)}</button>${iconButton('playlist-menu',p.name+' 더보기','more',`data-id="${p.id}" data-focus="menu-${p.id}"`)}</div><p class="card-meta">${p.tracks.length?`${p.tracks.length}곡`:'아직 곡 없음'} ${p.source?`<span aria-hidden="true">·</span>${icon('link')}<span class="source-word">YouTube</span>`:''}</p></article>`;}
  function detailView(p){
    return `<section class="detail-hero"><div class="detail-cover">${cover(p.art)}</div><div class="detail-copy"><div class="detail-kicker">${icon(p.source?'link':'music')}<span>${p.source?'YouTube에서 가져온 목록':'나의 재생목록'}</span></div><h1 id="content-title" tabindex="-1">${esc(p.name)}</h1><p>${esc(p.description || '좋아하는 음악을 하나씩 담아보세요.')}</p><p class="detail-stats">${p.tracks.length}곡 <span aria-hidden="true">·</span> 이 브라우저에 저장</p></div></section><div class="detail-actions"><div class="actions"><button class="button play" data-action="play-playlist" data-id="${p.id}" data-focus="play-detail" ${!p.tracks.length?'disabled':''}>${icon('play')}전체 재생</button><button class="button secondary" data-action="toggle-add" aria-expanded="${state.addOpen||!p.tracks.length}" aria-controls="add-track" data-focus="add-toggle">${icon('plus')}곡 추가</button><button class="button ghost edit-button ${state.edit?'active':''}" data-action="toggle-edit" aria-pressed="${state.edit}" aria-label="저장 목록 순서 편집" data-focus="edit-toggle">${icon('edit')}<span class="button-label">${state.edit?'편집 완료':'편집'}</span></button></div>${iconButton('playlist-menu',p.name+' 더보기','more',`data-id="${p.id}" data-focus="detail-menu"`)}</div>${state.addOpen||!p.tracks.length?addForm():''}<section class="track-table" aria-label="저장한 곡"><div class="track-head"><span>곡 제목</span><span>${state.edit?'순서 편집':'길이'}</span></div>${p.tracks.length?p.tracks.map((t,i)=>trackView(t,i,p)).join(''):`<div class="zero-result">${icon('music')}<h2>첫 곡을 기다리고 있어요.</h2><p>위에 영상 URL을 붙여넣으면 이 목록에 저장됩니다.</p></div>`}</section><div class="source-note">${icon(p.source?'link':'lock')}<div><strong>${p.source?'원본과 분리된 나만의 편집본':'이 브라우저만의 재생목록'}</strong>${p.source?'곡 추가·삭제·순서 변경은 YouTube 원본을 바꾸지 않아요. 원본으로 되돌리기는 더보기에서 직접 선택하세요.':'저장 목록과 지금 재생 중인 큐는 서로 독립적이에요. 목록을 편집해도 듣던 음악은 계속됩니다.'}</div></div>`;
  }
  function addForm(){return `<section class="inline-add" id="add-track"><header><h2>영상 URL로 곡 추가</h2>${selectedPlaylist()?.tracks.length?iconButton('toggle-add','곡 추가 접기','close'):''}</header><form id="add-track-form"><div class="add-fields"><label class="field">YouTube 영상 URL<input name="url" id="video-url" type="url" required placeholder="https://youtu.be/…" autocomplete="off"></label><label class="field">곡 이름 <span class="sr-only">선택</span><input name="name" type="text" maxlength="120" placeholder="곡 이름 (선택)"></label><button class="button primary" type="submit">${icon('plus')}곡 추가</button></div><p class="field-note">제목은 자동으로 불러오지 않아요. <button class="text-button" type="button" data-action="fill-video-example">예시 URL 채우기</button></p><div class="form-error" id="add-error" role="alert" hidden></div></form></section>`;}
  function trackView(t,i,p){const isCurrent=current()?.videoId===t.videoId&&state.phase!=='idle';return `<div class="track-row ${isCurrent?'current':''} ${state.edit?'editing':''}"><button class="track-main" data-action="play-track" data-id="${p.id}" data-track="${t.id}" data-focus="track-${t.id}" aria-label="${esc(t.name)} 재생"><span class="track-number">${isCurrent?icon(state.phase==='playing'?'wave':'pause'):i+1}</span>${cover(t.art,'track-art')}<span class="track-text"><strong>${esc(t.name)}</strong><small>${esc(t.owner||'직접 추가한 영상')}</small></span></button><span class="track-time">${t.duration?time(t.duration):'—'}</span>${state.edit?`<div class="order-actions">${iconButton('move-track',t.name+' 위로','up',`data-track="${t.id}" data-direction="-1" data-focus="up-${t.id}" ${i===0?'disabled':''}`)}${iconButton('move-track',t.name+' 아래로','down',`data-track="${t.id}" data-direction="1" data-focus="down-${t.id}" ${i===p.tracks.length-1?'disabled':''}`)}</div>`:''}${iconButton('track-menu',t.name+' 더보기','more',`data-track="${t.id}" data-id="${p.id}" data-focus="track-menu-${t.id}"`)}</div>`;}
  function missingView(){return `<div class="zero-result">${icon('music')}<h1 id="content-title" tabindex="-1">재생목록을 찾을 수 없어요.</h1><p>목록이 삭제되었거나 주소가 바뀌었을 수 있어요.</p><button class="button primary" data-action="library">라이브러리로 돌아가기</button></div>`;}
  function seekView(suffix='dock'){const t=current(),duration=t?.duration||0;return `<div class="seek"><time class="elapsed">${time(state.elapsed)}</time><input type="range" id="seek-${suffix}" data-range="seek" aria-label="시연 재생 위치" aria-valuetext="${time(state.elapsed)} / ${time(duration)}" min="0" max="${duration||1}" step="1" value="${state.elapsed}" style="--progress:${duration?state.elapsed/duration*100:0}%" ${!duration?'disabled':''}><time>${time(duration)}</time></div>`;}
  function transport(suffix='dock'){const i=state.queue.findIndex(t=>t.id===state.currentId);return `<div class="transport">${iconButton('previous','이전 곡','previous',`${i<=0&&state.elapsed<3?'disabled':''}`)}<button class="transport-play" data-action="play-pause" data-focus="play-pause-${suffix}" aria-label="${state.phase==='playing'?'일시 정지':'시연 재생'}" ${!current()?'disabled':''}>${icon(state.phase==='playing'?'pause':'play')}</button>${iconButton('next','다음 곡','next',`${i<0||i>=state.queue.length-1?'disabled':''}`)}</div>`;}
  function volume(suffix='dock'){return `<div class="volume">${iconButton('mute',state.volume?'음소거':'음소거 해제',state.volume?'volume':'mute',`${!current()?'disabled':''}`)}<input type="range" id="volume-${suffix}" data-range="volume" aria-label="시연 음량" min="0" max="100" value="${state.volume}" style="--progress:${state.volume}%" ${!current()?'disabled':''}></div>`;}
  function renderDock(){const t=current();$('#dock').innerHTML=`<button class="dock-track" data-action="open-now" aria-label="${t?esc(t.name)+' 지금 재생 열기':'재생할 음악 선택하기'}" data-focus="dock-track">${t?cover(t.art):`<span class="dock-empty-art">${icon('wave')}</span>`}<span class="dock-text"><strong>${esc(t?.name||'듣고 싶은 음악을 골라보세요')}</strong><small>${t?`${state.phase==='error'?'재생 오류 · ':''}시연 재생 · 실제 소리 없음`:'내 목록에서 가볍게 시작해요'}</small></span></button><div class="dock-center">${transport()}${seekView()}<div class="mini-progress" role="progressbar" aria-label="시연 재생 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${t?.duration?Math.round(state.elapsed/t.duration*100):0}"><span style="width:${t?.duration?state.elapsed/t.duration*100:0}%"></span></div></div><div class="dock-right">${volume()}<span class="divider"></span><button class="icon-button queue-button ${state.queueOpen?'active':''}" data-action="toggle-queue" data-focus="dock-queue" aria-label="재생 대기열 ${state.queueOpen?'닫기':'열기'}" aria-expanded="${state.queueOpen}" aria-controls="queue-panel">${icon('queue')}</button></div>`;}
  function renderQueue(){const panel=$('#queue-panel');panel.hidden=!state.queueOpen;if(!state.queueOpen)return;const t=current();panel.innerHTML=`<header class="queue-top"><div><h2>지금 재생</h2><small>시연용 플레이어 · 실제 소리 없음</small></div>${iconButton('close-queue','플레이어와 대기열 닫기','close','id="queue-close"')}</header><div class="queue-tabs" role="tablist" aria-label="플레이어 보기"><button role="tab" id="now-tab" aria-controls="now-view" aria-selected="${state.queueTab==='now'}" tabindex="${state.queueTab==='now'?'0':'-1'}" data-action="queue-tab" data-tab="now">지금 재생</button><button role="tab" id="queue-tab" aria-controls="queue-view" aria-selected="${state.queueTab==='queue'}" tabindex="${state.queueTab==='queue'?'0':'-1'}" data-action="queue-tab" data-tab="queue">재생 대기열 <span>${state.queue.length}</span></button></div><div class="queue-body">${state.queueTab==='now'?`<section id="now-view" role="tabpanel" aria-labelledby="now-tab">${t?nowView(t):queueEmpty()}</section>`:`<section id="queue-view" role="tabpanel" aria-labelledby="queue-tab">${t?queueView(t):queueEmpty()}</section>`}</div>`;}
  function queueEmpty(){return `<div class="queue-empty">${icon('queue')}<h3>다음 음악을 기다려요.</h3><p>재생목록에서 곡을 선택하면<br>여기에 재생 대기열이 만들어져요.</p><button class="button secondary" data-action="browse">내 재생목록 보기</button></div>`;}
  function nowView(t){return `<div class="player-art">${cover(t.art)}<div class="mock-player-label">${icon('play')}<span>YouTube 플레이어 자리</span><small>시연 그래픽 · 실제 영상 연결 없음</small></div></div><div class="now-title"><h3>${esc(t.name)}</h3><p>${esc(t.owner||'직접 추가한 영상')}</p></div><div class="state-label">${({loading:'재생 준비 중…',playing:'시연 재생 중',paused:'일시 정지',ended:'재생 종료',error:'재생할 수 없는 영상'})[state.phase]||'곡을 선택하세요'}</div>${state.phase==='error'?`<div class="error-box" role="alert"><strong>${icon('warning')}이 영상을 재생할 수 없어요.</strong><p>재생 제한 오류를 보여주는 시연 상태입니다. 큐와 저장 목록은 그대로 유지됩니다.</p><div class="actions"><button class="button secondary small" data-action="retry-player">다시 시도</button><button class="button primary small" data-action="next" ${state.queue.findIndex(x=>x.id===t.id)===state.queue.length-1?'disabled':''}>다음 곡</button></div></div>`:''}<div class="player-large-controls">${seekView('panel')}${transport('panel')}${volume('panel')}</div><div class="queue-foot">YouTube 연결과 소리는 구현하지 않은 디자인 시연입니다. 실제 서비스에서는 영상 재생·오류·자동재생 제한을 별도로 확인해야 합니다.</div>`;}
  function queueView(t){return `<div class="queue-current">${cover(t.art)}<div><span>${state.phase==='playing'?'지금 재생 중':'선택한 곡'}</span><strong>${esc(t.name)}</strong></div></div><div class="queue-list-heading"><div><h3>재생 대기열</h3><small>현재곡을 포함한 ${state.queue.length}곡</small></div><div class="queue-actions">${iconButton('toggle-queue-edit','대기열 순서 편집','edit',`aria-pressed="${state.queueEdit}"`,state.queueEdit)}${iconButton('clear-queue','재생 대기열 비우기','trash')}</div></div><div class="queue-list" aria-label="재생 순서">${state.queue.map((q,i)=>`<div class="queue-row ${q.id===t.id?'current':''}" data-queue-id="${q.id}"><button class="grip" draggable="true" data-drag-id="${q.id}" aria-label="${esc(q.name)} 순서 이동. 편집 버튼으로 위아래 이동도 가능합니다.">${icon('grip')}</button><button class="track-main" data-action="select-queue-track" data-track="${q.id}" data-focus="q-${q.id}" aria-label="${esc(q.name)} 재생">${cover(q.art,'track-art')}<span class="track-text"><strong>${esc(q.name)}</strong><small>${q.id===t.id?'현재 곡':`${i+1}번째 곡`}</small></span></button>${state.queueEdit?`<div class="order-actions">${iconButton('move-queue',q.name+' 위로','up',`data-track="${q.id}" data-direction="-1" ${i===0?'disabled':''}`)}${iconButton('move-queue',q.name+' 아래로','down',`data-track="${q.id}" data-direction="1" ${i===state.queue.length-1?'disabled':''}`)}</div>`:iconButton('queue-item-menu',q.name+' 대기열 더보기','more',`data-track="${q.id}"`)}</div>`).join('')}</div><div class="queue-foot"><button class="button secondary" data-action="save-queue">${icon('save')}대기열을 재생목록에 저장</button><p>여기서 순서를 바꿔도 저장한 목록은 그대로예요.</p></div>`;}
  function applyQueueMode(){const modalQueue=state.queueOpen&&smallScreen();$('#app-shell').classList.toggle('queue-open',state.queueOpen);$('#queue-scrim').hidden=!modalQueue;for(const id of ['sidebar','main-panel','dock'])$('#'+id).inert=modalQueue;const panel=$('#queue-panel');if(modalQueue){panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');}else{panel.removeAttribute('role');panel.removeAttribute('aria-modal');}}
  function openQueue(tab='queue'){queueReturnKey=captureFocus().key||'dock-queue';state.queueTab=tab;state.queueOpen=true;render();if(smallScreen())$('#queue-close')?.focus();}
  function closeQueue(){state.queueOpen=false;render();focusKey(queueReturnKey||'dock-queue');}
  function navigate(id){state.route=id?'detail':'library';state.selected=id||null;state.edit=false;state.addOpen=false;state.query='';render();$('#main-panel').scrollTop=0;$('#content-title')?.focus({preventScroll:true});}
  function announce(text){$('#announcer').textContent='';setTimeout(()=>$('#announcer').textContent=text,20);}
  function toast(text,undo=null){clearTimeout(toastTimer);state.undo=undo;$('#toast-region').innerHTML=`<div class="toast">${icon('check')}<span>${esc(text)}</span>${undo?'<button data-action="undo">되돌리기</button>':''}</div>`;toastTimer=setTimeout(()=>{$('#toast-region').innerHTML='';state.undo=null;},undo?12000:5000);}
  function persist(next){if(state.failNextSave){state.failNextSave=false;throw new Error('저장하지 못했어요. 입력은 그대로 남아 있습니다. 다시 시도해 주세요. (실패 시연)');}localStorage.setItem(storageKey,JSON.stringify(next));state.playlists=next;}
  const clonePlaylists=()=>structuredClone(state.playlists);
  function formError(message,root=$('#modal')){let box=$('.form-error',root);if(!box){box=document.createElement('p');box.className='form-error';box.setAttribute('role','alert');($('.modal-body',root)||root).append(box);}box.hidden=false;box.textContent=message;}
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  async function commit(change,success,root=$('#modal')){if(state.busy)return;state.busy=true;const buttons=$$('button[type=submit]',root);buttons.forEach(b=>{b.dataset.original=b.innerHTML;b.disabled=true;b.innerHTML='<span class="saving-dot" aria-hidden="true"></span>저장 중…';});try{await wait(350);const next=clonePlaylists();change(next);persist(next);state.busy=false;success();}catch(e){state.busy=false;buttons.forEach(b=>{b.disabled=false;b.innerHTML=b.dataset.original;});formError(e.message||'저장하지 못했어요. 다시 시도해 주세요.',root);}}
  function startQueue(p,trackId){if(!p?.tracks.length){toast('먼저 이 재생목록에 곡을 추가해 주세요.');return;}const wasEmpty=!current();state.queue=p.tracks.map(t=>({...t,id:uid(),sourcePlaylist:p.id}));const index=trackId?p.tracks.findIndex(t=>t.id===trackId):0;state.currentId=state.queue[Math.max(index,0)].id;state.elapsed=0;simulateStart();if(wasEmpty&&!state.queueOpen)openQueue(smallScreen()?'now':'queue');}
  function simulateStart(){clearTimeout(phaseTimer);state.phase='loading';render();phaseTimer=setTimeout(()=>{if(current()){state.phase='playing';render();announce('시연 재생을 시작했습니다. 실제 소리는 없습니다.');}},450);}
  function selectQueue(id){if(!state.queue.some(t=>t.id===id))return;state.currentId=id;state.elapsed=0;simulateStart();}
  function nextTrack(delta){const index=state.queue.findIndex(t=>t.id===state.currentId);if(delta<0&&state.elapsed>=3){state.elapsed=0;updatePlayback();return;}if(state.queue[index+delta])selectQueue(state.queue[index+delta].id);}
  function updatePlayback(){const t=current();$$('[data-range=seek]').forEach(el=>{el.value=state.elapsed;el.style.setProperty('--progress',`${t?.duration?state.elapsed/t.duration*100:0}%`);el.setAttribute('aria-valuetext',`${time(state.elapsed)} / ${time(t?.duration||0)}`);});$$('.elapsed').forEach(el=>el.textContent=time(state.elapsed));const mini=$('.mini-progress');if(mini){const pct=t?.duration?state.elapsed/t.duration*100:0;mini.setAttribute('aria-valuenow',Math.round(pct));$('span',mini).style.width=pct+'%';}}
  setInterval(()=>{const t=current();if(state.phase!=='playing'||!t?.duration)return;state.elapsed=Math.min(state.elapsed+1,t.duration);updatePlayback();if(state.elapsed>=t.duration){const index=state.queue.findIndex(q=>q.id===t.id);if(index<state.queue.length-1)selectQueue(state.queue[index+1].id);else{state.phase='ended';render();}}},1000);
  function moveQueue(from,to){if(to<0||to>=state.queue.length)return;const [track]=state.queue.splice(from,1);state.queue.splice(to,0,track);render();announce(`${track.name}, ${to+1}번째로 이동했습니다. 저장 목록은 변경하지 않았습니다.`);}
  function modalHeader(title,description=''){return `<header class="modal-header"><div><h2 id="modal-title" tabindex="-1">${esc(title)}</h2>${description?`<p>${esc(description)}</p>`:''}</div>${iconButton('close-modal','대화상자 닫기','close')}</header>`;}
  function modalFooter(label,style='primary'){return `<footer class="modal-footer"><button class="button secondary" type="button" data-action="close-modal">취소</button><button class="button ${style}" type="submit">${esc(label)}</button></footer>`;}
  function openModal(kind,data={}){
    const modal=$('#modal');if(!modal.open)modalReturnKey=captureFocus().key||'';
    state.modal={kind,data};modal.className=['playlist-menu','track-menu','queue-item-menu'].includes(kind)?'action-dialog':'';
    modal.innerHTML=modalView(kind,data);if(!modal.open)modal.showModal();
    const first=$('[autofocus]',modal)||$('#modal-title');setTimeout(()=>first?.focus({preventScroll:true}),0);
  }
  function closeModal(){if(state.busy){announce('저장 중입니다. 잠시 기다려 주세요.');return;}$('#modal').close();state.modal=null;focusKey(modalReturnKey);}
  function menuItem(action,label,name,extra='',danger=false){return `<button class="menu-item ${danger?'danger':''}" data-action="${action}" ${extra}>${icon(name)}${esc(label)}</button>`;}
  function modalView(kind,data){
    if(kind==='create'||kind==='rename'){
      const p=kind==='rename'?playlist(data.id):null;
      return `${modalHeader(p?'재생목록 수정':'새 재생목록','좋아하는 음악이 머물 이름을 지어주세요.')}<form id="modal-form" data-kind="${kind}"><div class="modal-body"><label class="field">재생목록 이름<input name="name" required maxlength="120" placeholder="예: 늦은 밤의 플레이리스트" value="${esc(p?.name||'')}" autofocus></label><label class="field">설명 (선택)<textarea name="description" maxlength="300" placeholder="어떤 순간에 듣고 싶은가요?">${esc(p?.description||'')}</textarea></label><p class="note">로그인 없이 이 브라우저에 저장됩니다. 프로토타입 저장소는 실제 앱과 분리되어 있어요.</p><div class="form-error" role="alert" hidden></div></div>${modalFooter(p?'변경 저장':'만들기')}</form>`;
    }
    if(kind==='playlist-menu'){
      const p=playlist(data.id);return `${modalHeader(p.name)}<div class="menu-list">${menuItem('menu-play','전체 재생','play',`data-id="${p.id}" ${!p.tracks.length?'disabled':''}`)}${menuItem('append-playlist','대기열에 추가','queue',`data-id="${p.id}" ${!p.tracks.length?'disabled':''}`)}${menuItem('rename','이름과 설명 수정','edit',`data-id="${p.id}"`)}${p.source?menuItem('reset-source','원본으로 초기화','reset',`data-id="${p.id}"`):''}<div class="menu-separator"></div>${menuItem('delete-playlist','재생목록 삭제','trash',`data-id="${p.id}"`,true)}</div>`;
    }
    if(kind==='track-menu'||kind==='queue-item-menu'){
      const q=kind==='queue-item-menu',t=q?state.queue.find(t=>t.id===data.track):playlist(data.id)?.tracks.find(t=>t.id===data.track);if(!t)return modalHeader('곡을 찾을 수 없어요.');
      return `${modalHeader(t.name)}<div class="menu-list">${menuItem(q?'menu-select-queue':'menu-play-track','지금 재생','play',`data-id="${data.id||''}" data-track="${t.id}"`)}${!q?`${menuItem('add-next','다음 곡으로 추가','next',`data-id="${data.id}" data-track="${t.id}"`)}${menuItem('append-track','대기열에 추가','queue',`data-id="${data.id}" data-track="${t.id}"`)}`:''}${menuItem('save-track','다른 재생목록에 저장','save',`data-id="${data.id||''}" data-track="${t.id}" data-from-queue="${q}"`)}<div class="menu-separator"></div>${menuItem(q?'remove-queue-track':'delete-track',q?'대기열에서 삭제':'저장 목록에서 삭제','trash',`data-id="${data.id||''}" data-track="${t.id}"`,true)}</div>`;
    }
    if(kind==='delete-playlist'){
      const p=playlist(data.id);return `${modalHeader('재생목록을 삭제할까요?')}<form id="modal-form" data-kind="delete-playlist"><div class="modal-body"><div class="warning-box"><strong>${esc(p.name)} · ${p.tracks.length}곡</strong>이 브라우저에 저장된 목록을 삭제합니다. 삭제한 목록은 복구할 수 없어요.</div><p class="note">YouTube 원본과 지금 재생 중인 큐는 그대로 유지됩니다.</p><div class="form-error" role="alert" hidden></div></div>${modalFooter('목록 삭제','danger')}</form>`;
    }
    if(kind==='clear-queue')return `${modalHeader('재생 대기열을 비울까요?')}<form id="modal-form" data-kind="clear-queue"><div class="modal-body"><p class="note">현재 시연 재생이 멈추고 대기열 ${state.queue.length}곡이 제거됩니다. 저장한 재생목록은 바뀌지 않아요.</p></div>${modalFooter('대기열 비우기','danger')}</form>`;
    if(kind==='save-queue'||kind==='save-track')return `${modalHeader(kind==='save-queue'?'대기열을 재생목록에 저장':'곡을 재생목록에 저장',`${data.tracks?.length||state.queue.length}곡을 복사해 저장합니다. 현재 큐는 그대로 유지돼요.`)}<form id="modal-form" data-kind="${kind}"><div class="modal-body"><label class="field">저장할 재생목록<select name="destination" id="save-destination" autofocus><option value="new">+ 새 재생목록</option>${state.playlists.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.tracks.length}곡</option>`).join('')}</select></label><label class="field" id="new-list-name">새 재생목록 이름<input name="name" maxlength="120" value="지금의 플레이리스트" required></label><p class="note">기존 목록을 선택하면 끝에 추가합니다. 같은 영상도 별도의 곡 항목으로 보존됩니다.</p><div class="form-error" role="alert" hidden></div></div>${modalFooter('저장하기')}</form>`;
    if(kind==='import')return importModal(data);
    if(kind==='scenarios')return `${modalHeader('프로토타입 시연 설정','화면과 상태를 직접 확인하기 위한 도구입니다.')}<div class="modal-body"><div class="demo-banner">실제 YouTube 연결·오디오 재생·외부 전송은 없습니다. 예시와 입력한 내용은 이 프로토타입의 독립 저장소에서만 다뤄요.</div><div class="scenario-grid"><button class="scenario-button" data-action="scene-library"><span><strong>예시 라이브러리</strong><small>8개 목록과 다양한 곡 수</small></span>${icon('grid')}</button><button class="scenario-button" data-action="scene-empty"><span><strong>빈 라이브러리 보기</strong><small>현재 데모 목록을 빈 시연 데이터로 전환</small></span>${icon('music')}</button><button class="scenario-button ${state.failNextSave?'active':''}" data-action="scene-save-failure"><span><strong>${state.failNextSave?'다음 저장 실패 예약됨':'다음 저장 1회 실패'}</strong><small>입력 유지 → 다시 시도 확인</small></span>${icon('warning')}</button><button class="scenario-button" data-action="scene-read-error"><span><strong>목록 읽기 오류 보기</strong><small>데이터를 지우지 않는 복구 화면</small></span>${icon('reset')}</button><button class="scenario-button" data-action="scene-player-error"><span><strong>플레이어 제한 오류 보기</strong><small>재시도 · 다음 곡으로 복구</small></span>${icon('play')}</button></div><p class="note">빈 화면 전환/예시 복원은 현재 화면의 데모 데이터를 바꿉니다. 실제 SMP 앱 데이터에는 접근하지 않습니다. 이 설정 UI는 실제 앱에 포함하지 않습니다.</p></div><footer class="modal-footer"><button class="button secondary" data-action="close-modal">닫기</button></footer>`;
    return modalHeader('확인');
  }
  function importModal(data){
    const original=data.original?playlist(data.original):null,step=data.step||0;
    if(step===2)return `${modalHeader('편집본을 원본으로 교체할까요?')}<form id="modal-form" data-kind="import-confirm"><div class="modal-body"><div class="step-label">3 / 3 · 교체 확인</div><div class="warning-box"><strong>${esc(original.name)}</strong>현재 ${original.tracks.length}곡과 로컬에서 바꾼 순서를 지우고, 미리본 예시 원본 ${data.preview.length}곡으로 교체합니다. 이 교체는 되돌릴 수 없어요.</div><p class="note">YouTube 원본과 현재 재생 대기열에는 영향을 주지 않습니다.</p><div class="form-error" role="alert" hidden></div></div><footer class="modal-footer"><button class="button secondary" type="button" data-action="back-import-preview">미리보기로</button><button class="button danger" type="submit">편집본 교체</button></footer></form>`;
    return `${modalHeader(original?'원본으로 초기화':'YouTube 재생목록 가져오기',original?'미리본 다음, 편집본을 바꿀지 직접 결정하세요.':'공개 재생목록 URL을 넣고 저장할 내용을 먼저 확인하세요.')}<form id="modal-form" data-kind="import"><div class="modal-body"><div class="step-label">${step===0?'1 / '+(original?'3':'2')+' · 링크 확인':'2 / '+(original?'3':'2')+' · 미리보기'}</div>${step===0?`<label class="field">공개 YouTube 재생목록 URL<input name="url" type="url" required placeholder="https://www.youtube.com/playlist?list=…" value="${esc(data.url||original?.source||'')}" ${original?'readonly':'autofocus'}></label><label class="field">목록 이름<input name="name" maxlength="120" required placeholder="나만의 재생목록" value="${esc(data.name||original?.name||'')}" ${original?'autofocus':''}></label><p class="field-note"><button type="button" class="text-button" data-action="fill-import-example">예시 링크와 이름 채우기</button></p><div class="demo-banner">프로토타입 미리보기는 YouTube에 접속하지 않고 예시 6곡을 보여줍니다. 실제 가져오기 성공을 뜻하지 않아요.</div>`:`<div class="import-preview"><div class="mock-preview">${icon('play')}<span>YouTube 미리보기 자리</span><small>실제 연결 없음 · 예시 결과</small></div><div class="preview-summary"><strong>${esc(data.name)} · 예시 ${data.preview.length}곡</strong><p>곡 ID와 썸네일을 가져오는 구조의 시연입니다. 실제 앱은 제목 자동 조회와 원본 전체 포함을 보장하지 않아요.</p><div class="preview-list">${data.preview.slice(0,4).map((t,i)=>`<span>${i+1}. ${esc(t.name)}</span>`).join('')}<span>외 ${data.preview.length-4}곡</span></div></div></div><p class="note">저장 후 원본 변경이 편집본을 자동으로 덮어쓰지 않습니다.${original?' 다음 단계에서 로컬 변경을 지울지 다시 확인합니다.':''}</p>`}<div class="form-error" role="alert" hidden></div></div><footer class="modal-footer"><button type="button" class="button secondary" data-action="${step?'back-import':'close-modal'}">${step?'링크로 돌아가기':'취소'}</button><button type="submit" class="button primary">${step?(original?'교체 내용 확인':'예시 목록 저장'):'예시 미리보기'}</button></footer></form>`;
  }
  function parseVideo(value){const url=new URL(value);if(!['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(url.hostname))throw new Error('YouTube 영상 URL을 넣어 주세요.');const id=url.hostname==='youtu.be'?url.pathname.slice(1).split('/')[0]:url.searchParams.get('v')||url.pathname.match(/^\/(?:shorts|embed)\/([\w-]{11})/)?.[1];if(!/^[\w-]{11}$/.test(id||''))throw new Error('재생목록이 아닌 개별 영상 URL을 넣어 주세요.');return id;}
  function parsePlaylist(value){const url=new URL(value);if(!['youtube.com','www.youtube.com','m.youtube.com'].includes(url.hostname)||!url.searchParams.get('list'))throw new Error('list가 포함된 공개 YouTube 재생목록 URL을 넣어 주세요.');return `https://www.youtube.com/playlist?list=${encodeURIComponent(url.searchParams.get('list'))}`;}
  $('#modal').addEventListener('cancel',e=>{if(state.busy)e.preventDefault();});
  $('#modal').addEventListener('close',()=>{state.modal=null;focusKey(modalReturnKey);});
  $('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
  document.addEventListener('submit',async e=>{
    if(e.target.id==='add-track-form'){
      e.preventDefault();const form=e.target,p=selectedPlaylist(),fields=new FormData(form);if(!p)return;
      let videoId;try{videoId=parseVideo(String(fields.get('url')));}catch(err){formError(err.message,form);return;}
      if(p.tracks.some(t=>t.videoId===videoId)&&!form.dataset.duplicateConfirmed){const box=$('#add-error');box.hidden=false;box.innerHTML='이 영상이 이미 목록에 있어요. 별도의 곡으로 한 번 더 추가할까요? <button class="text-button" type="button" data-action="confirm-duplicate">중복해서 추가</button>';return;}
      const track={id:uid(),videoId,name:String(fields.get('name')||'').trim()||`동영상 (${videoId})`,owner:'',duration:0,art:hash(videoId)};
      await commit(next=>{next.find(x=>x.id===p.id).tracks.push(track);},()=>{render();$('#video-url')?.focus();toast('곡을 저장했어요. 현재 재생 대기열은 그대로예요.');},form);return;
    }
    if(e.target.id!=='modal-form')return;e.preventDefault();if(state.busy)return;const form=e.target,fields=new FormData(form),kind=form.dataset.kind,data=state.modal.data;
    if(kind==='create'||kind==='rename'){
      const name=String(fields.get('name')||'').trim();if(!name){formError('재생목록 이름을 입력해 주세요.');return;}
      const description=String(fields.get('description')||'').trim(),id=kind==='create'?uid():data.id;
      await commit(next=>{if(kind==='create')next.push({id,name,description,createdAt:Date.now(),art:hash(id),source:'',tracks:[]});else Object.assign(next.find(p=>p.id===id),{name,description});},()=>{closeModal();if(kind==='create'){navigate(id);state.addOpen=true;render();$('#video-url')?.focus();}else render();toast(kind==='create'?'빈 재생목록을 만들었어요. 첫 곡을 담아보세요.':'재생목록 정보를 저장했어요.');});
    } else if(kind==='delete-playlist'){
      const p=playlist(data.id);await commit(next=>{next.splice(next.findIndex(p=>p.id===data.id),1);},()=>{closeModal();if(state.selected===data.id)navigate();else render();toast(`“${p.name}” 목록을 삭제했어요.`);});
    } else if(kind==='clear-queue'){
      clearTimeout(phaseTimer);state.queue=[];state.currentId=null;state.elapsed=0;state.phase='idle';closeModal();render();toast('대기열을 비웠어요. 저장 목록은 그대로예요.');
    } else if(kind==='save-queue'||kind==='save-track'){
      const dest=fields.get('destination'),name=String(fields.get('name')||'').trim(),tracks=(data.tracks||state.queue).map(t=>({...t,id:uid()}));if(dest==='new'&&!name){formError('새 재생목록 이름을 입력해 주세요.');return;}
      await commit(next=>{if(dest==='new'){const id=uid();next.push({id,name,description:'재생 대기열에서 저장한 목록',createdAt:Date.now(),art:hash(id),source:'',tracks});}else next.find(p=>p.id===dest).tracks.push(...tracks);},()=>{closeModal();render();toast(`${tracks.length}곡을 재생목록에 저장했어요.`);});
    } else if(kind==='import'){
      if(!data.step){let url;try{url=parsePlaylist(String(fields.get('url')));}catch(err){formError(err.message);return;}const name=String(fields.get('name')||'').trim();if(!name){formError('목록 이름을 입력해 주세요.');return;}state.busy=true;const b=$('button[type=submit]',form);b.disabled=true;b.innerHTML='<span class="saving-dot" aria-hidden="true"></span>예시 준비 중…';await wait(500);state.busy=false;openModal('import',{...data,url,name,step:1,preview:Array.from({length:6},(_,i)=>({...makeTrack(i,'import-preview'),name:`동영상 ${i+1} (DEMO${String(i).padStart(7,'0')})`,owner:'시연용 가져오기 결과'}))});}
      else if(data.original)openModal('import',{...data,step:2});
      else{const id=uid();await commit(next=>next.push({id,name:data.name,description:'YouTube 목록에서 가져온 로컬 편집본 · 프로토타입 예시',createdAt:Date.now(),source:data.url,art:hash(id),tracks:data.preview.map(t=>({...t,id:uid()}))}),()=>{closeModal();navigate(id);toast('예시 목록을 저장했어요. 실제 YouTube 가져오기는 수행하지 않았어요.');});}
    } else if(kind==='import-confirm'){
      await commit(next=>{const p=next.find(p=>p.id===data.original);p.tracks=data.preview.map(t=>({...t,id:uid()}));},()=>{closeModal();render();toast('편집본을 예시 원본으로 교체했어요. 재생 중인 큐는 그대로예요.');});
    }
  });
  function getTrackData(el){return el.dataset.fromQueue==='true'?state.queue.find(t=>t.id===el.dataset.track):playlist(el.dataset.id)?.tracks.find(t=>t.id===el.dataset.track);}
  function appendTracks(tracks,next=false){const copies=tracks.map(t=>({...t,id:uid()}));if(!state.queue.length){state.queue=copies;state.currentId=copies[0]?.id||null;state.phase=state.currentId?'paused':'idle';}else{const at=next?state.queue.findIndex(t=>t.id===state.currentId)+1:state.queue.length;state.queue.splice(at,0,...copies);}render();toast(next?'다음 곡으로 추가했어요.':'재생 대기열에 추가했어요.');}
  function toastError(text){clearTimeout(toastTimer);$('#toast-region').innerHTML=`<div class="toast" role="alert">${icon('warning')}<span>${esc(text)}</span></div>`;toastTimer=setTimeout(()=>$('#toast-region').innerHTML='',7000);}
  document.addEventListener('click',async e=>{
    const el=e.target.closest('[data-action]');if(!el||el.disabled)return;const action=el.dataset.action,id=el.dataset.id,trackId=el.dataset.track;
    if(action==='library'){navigate();}
    else if(action==='open-playlist'){navigate(id);}
    else if(action==='create'){openModal('create');}
    else if(action==='import'){openModal('import');}
    else if(action==='toggle-queue'){state.queueOpen?closeQueue():openQueue('queue');}
    else if(action==='close-queue'){closeQueue();}
    else if(action==='open-now'){current()?openQueue('now'):navigate();}
    else if(action==='browse'){closeQueue();navigate();}
    else if(action==='queue-tab'){state.queueTab=el.dataset.tab;render();$('#'+(state.queueTab==='now'?'now-tab':'queue-tab'))?.focus();}
    else if(action==='toggle-queue-edit'){state.queueEdit=!state.queueEdit;render();}
    else if(action==='toggle-add'){state.addOpen=!(state.addOpen||!selectedPlaylist()?.tracks.length);render();if(state.addOpen)$('#video-url')?.focus();}
    else if(action==='toggle-edit'){state.edit=!state.edit;render();announce(state.edit?'저장 목록 편집 모드. 위아래 버튼으로 순서를 바꿀 수 있어요.':'편집 모드를 종료했습니다.');}
    else if(action==='play-playlist'||action==='menu-play'){if(action==='menu-play')closeModal();startQueue(playlist(id));}
    else if(action==='play-track'||action==='menu-play-track'){if(action==='menu-play-track')closeModal();startQueue(playlist(id),trackId);}
    else if(action==='add-empty'){navigate(id);state.addOpen=true;render();$('#video-url')?.focus();}
    else if(action==='play-pause'){if(!current())return;if(state.phase==='error'){openQueue('now');return;}if(state.phase==='ended')state.elapsed=0;state.phase=state.phase==='playing'?'paused':'playing';render();}
    else if(action==='next'){nextTrack(1);}
    else if(action==='previous'){nextTrack(-1);}
    else if(action==='mute'){state.volume=state.volume?0:70;render();}
    else if(action==='retry-player'){simulateStart();}
    else if(action==='select-queue-track'||action==='menu-select-queue'){if(action==='menu-select-queue')closeModal();selectQueue(trackId);}
    else if(action==='clear-search'){state.query='';render();$('#library-search')?.focus();}
    else if(action==='playlist-menu'){openModal('playlist-menu',{id});}
    else if(action==='track-menu'){openModal('track-menu',{id,track:trackId});}
    else if(action==='queue-item-menu'){openModal('queue-item-menu',{track:trackId});}
    else if(action==='rename'){openModal('rename',{id});}
    else if(action==='delete-playlist'){openModal('delete-playlist',{id});}
    else if(action==='reset-source'){openModal('import',{original:id});}
    else if(action==='clear-queue'){openModal('clear-queue');}
    else if(action==='save-queue'){openModal('save-queue',{tracks:structuredClone(state.queue)});}
    else if(action==='save-track'){const t=getTrackData(el);if(t)openModal('save-track',{tracks:[structuredClone(t)]});}
    else if(action==='append-playlist'){const p=playlist(id);closeModal();appendTracks(p.tracks);}
    else if(action==='add-next'||action==='append-track'){const t=playlist(id).tracks.find(t=>t.id===trackId);closeModal();appendTracks([t],action==='add-next');}
    else if(action==='delete-track'){
      const p=playlist(id),at=p.tracks.findIndex(t=>t.id===trackId),saved=structuredClone(p.tracks[at]);
      try{const next=clonePlaylists();next.find(p=>p.id===id).tracks.splice(at,1);persist(next);closeModal();render();toast('저장 목록에서 곡을 삭제했어요.',()=>{const next=clonePlaylists(),target=next.find(p=>p.id===id);if(!target)throw new Error('원래 재생목록이 없어 곡을 복구할 수 없어요.');if(!target.tracks.some(t=>t.id===saved.id))target.tracks.splice(Math.min(at,target.tracks.length),0,saved);persist(next);render();toast('곡을 원래 목록으로 되돌렸어요.');});}catch(err){formError('삭제하지 못했어요. 곡은 그대로입니다. 다시 시도해 주세요.');}
    } else if(action==='remove-queue-track'){
      const index=state.queue.findIndex(t=>t.id===trackId);const [removed]=state.queue.splice(index,1);if(state.currentId===trackId){state.currentId=state.queue[Math.min(index,state.queue.length-1)]?.id||null;state.elapsed=0;state.phase=state.currentId?'paused':'idle';}closeModal();render();toast('대기열에서 곡을 삭제했어요.',()=>{if(!state.queue.some(t=>t.id===removed.id))state.queue.splice(Math.min(index,state.queue.length),0,removed);if(!state.currentId){state.currentId=removed.id;state.phase='paused';}render();toast('대기열에 곡을 되돌렸어요.');});
    } else if(action==='move-track'){
      const p=selectedPlaylist(),from=p.tracks.findIndex(t=>t.id===trackId),to=from+Number(el.dataset.direction);if(to<0||to>=p.tracks.length)return;try{const next=clonePlaylists(),tracks=next.find(p=>p.id===state.selected).tracks;const[t]=tracks.splice(from,1);tracks.splice(to,0,t);persist(next);render();announce(`${t.name}, ${to+1}번째로 저장했습니다. 재생 큐는 그대로입니다.`);}catch(err){toastError('순서를 저장하지 못했어요. 원래 순서를 유지합니다.');}
    } else if(action==='move-queue'){const from=state.queue.findIndex(t=>t.id===trackId);moveQueue(from,from+Number(el.dataset.direction));}
    else if(action==='undo'){const fn=state.undo;state.undo=null;try{fn?.();}catch(err){toastError(err.message);}}
    else if(action==='close-modal'){closeModal();}
    else if(action==='fill-video-example'){const form=$('#add-track-form');form.elements.url.value='https://youtu.be/DEMO0000099';form.elements.name.value='직접 추가한 예시곡';form.elements.url.focus();}
    else if(action==='confirm-duplicate'){$('#add-track-form').dataset.duplicateConfirmed='true';$('#add-track-form').requestSubmit();}
    else if(action==='fill-import-example'){const form=$('#modal-form');if(!form.elements.url.readOnly)form.elements.url.value='https://www.youtube.com/playlist?list=PL_DEMO_IMPORT';form.elements.name.value=state.modal.data.original?playlist(state.modal.data.original).name:'나의 새로운 발견';}
    else if(action==='back-import'){openModal('import',{...state.modal.data,step:0});}
    else if(action==='back-import-preview'){openModal('import',{...state.modal.data,step:1});}
    else if(action==='scenarios'){openModal('scenarios');}
    else if(action==='scene-library'){state.playlists=seedPlaylists();state.readError=false;closeModal();navigate();toast('예시 8개 목록으로 돌아왔어요. 아직 저장소는 바꾸지 않았어요.');}
    else if(action==='scene-empty'){state.playlists=[];state.readError=false;closeModal();navigate();toast('빈 라이브러리 시연입니다. 실제 앱 데이터는 바뀌지 않아요.');}
    else if(action==='scene-save-failure'){state.failNextSave=!state.failNextSave;closeModal();toast(state.failNextSave?'다음 저장 1회가 실패하도록 설정했어요.':'저장 실패 시연을 해제했어요.');}
    else if(action==='scene-read-error'){state.readError=true;closeModal();navigate();}
    else if(action==='retry-read'){state.readError=false;render();$('#content-title')?.focus();}
    else if(action==='scene-player-error'){if(!current()){state.queue=seedPlaylists()[0].tracks.map(t=>({...t,id:uid()}));state.currentId=state.queue[0].id;}clearTimeout(phaseTimer);state.phase='error';closeModal();openQueue('now');}
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='library-search'){state.query=e.target.value;render();}
    if(e.target.dataset.range==='seek'){state.elapsed=Number(e.target.value);updatePlayback();}
    if(e.target.dataset.range==='volume'){state.volume=Number(e.target.value);$$('[data-range=volume]').forEach(el=>{el.value=state.volume;el.style.setProperty('--progress',`${state.volume}%`);});}
    if(e.target.name==='url'&&e.target.closest('#add-track-form'))delete $('#add-track-form').dataset.duplicateConfirmed;
  });
  document.addEventListener('change',e=>{if(e.target.id==='sort'){state.sort=e.target.value;render();}if(e.target.id==='save-destination'){const isNew=e.target.value==='new';$('#new-list-name').hidden=!isNew;$('#new-list-name input').required=isNew;}});
  $('#queue-scrim').addEventListener('click',closeQueue);
  document.addEventListener('keydown',e=>{
    if(e.target.getAttribute?.('role')==='tab'&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();state.queueTab=e.key==='Home'?'now':e.key==='End'?'queue':state.queueTab==='now'?'queue':'now';render();$('#'+(state.queueTab==='now'?'now-tab':'queue-tab'))?.focus();return;}
    if($('#modal').open)return;
    if(e.key==='Escape'&&state.queueOpen){e.preventDefault();closeQueue();return;}
    if(e.key==='Tab'&&state.queueOpen&&smallScreen()){const f=$$('button:not(:disabled),input:not(:disabled),[tabindex="0"]',$('#queue-panel')).filter(el=>!el.closest('[hidden]'));if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  });
  document.addEventListener('dragstart',e=>{const handle=e.target.closest('[data-drag-id]');if(!handle)return;dragId=handle.dataset.dragId;e.dataTransfer?.setData('text/plain',dragId);if(e.dataTransfer)e.dataTransfer.effectAllowed='move';});
  document.addEventListener('dragover',e=>{const row=e.target.closest('[data-queue-id]');if(!row||!dragId)return;e.preventDefault();$$('.drop-target').forEach(el=>el.classList.remove('drop-target'));row.classList.add('drop-target');});
  document.addEventListener('drop',e=>{const row=e.target.closest('[data-queue-id]');if(!row||!dragId)return;e.preventDefault();const from=state.queue.findIndex(t=>t.id===dragId),to=state.queue.findIndex(t=>t.id===row.dataset.queueId);if(from>=0&&to>=0)moveQueue(from,to);dragId=null;});
  document.addEventListener('dragend',()=>{dragId=null;$$('.drop-target').forEach(el=>el.classList.remove('drop-target'));});
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{render();if(state.queueOpen&&smallScreen()&&!$('#queue-panel').contains(document.activeElement)&&!$('#modal').open)$('#queue-close')?.focus();},100);});
  window.addEventListener('popstate',()=>{if($('#modal').open)closeModal();const match=location.hash.match(/^#playlist\/(.+)$/);state.route=match?'detail':'library';state.selected=match?decodeURIComponent(match[1]):null;state.addOpen=false;state.edit=false;render();});
  const originalNavigate=navigate;
  navigate=function(id){history.pushState({view:id||'library'},'',id?'#playlist/'+encodeURIComponent(id):'#library');originalNavigate(id);};
  const params=new URLSearchParams(location.search),scene=params.get('scene');if(params.has('fresh'))state.playlists=seedPlaylists();
  const initialId=location.hash.match(/^#playlist\/(.+)$/)?.[1];if(initialId){state.route='detail';state.selected=decodeURIComponent(initialId);}
  if(scene==='empty')state.playlists=[];
  if(scene==='detail'){state.route='detail';state.selected=state.playlists[0]?.id;}
  if(['playing','queue','error'].includes(scene)){state.queue=seedPlaylists()[0].tracks.map(t=>({...t,id:uid()}));state.currentId=state.queue[0].id;state.elapsed=73;state.phase=scene==='error'?'error':'paused';state.queueOpen=true;state.queueTab=scene==='queue'?'queue':'now';}
  if(scene==='read-error')state.readError=true;
  render();if(state.queueOpen&&smallScreen())$('#queue-close')?.focus();if(scene==='import')openModal('import');
  // Read-only hook for reproducible prototype tests. No production API is called.
  window.SMPPrototype={snapshot:()=>({...structuredClone({...state,undo:null}),canUndo:!!state.undo}),version:'Electric Night 1.0'};
})();
