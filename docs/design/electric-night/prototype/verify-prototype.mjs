import fs from 'node:fs';
import assert from 'node:assert/strict';
const { JSDOM } = await import(process.env.SMP_JSDOM_MODULE || 'jsdom');
const dir=new URL('.',import.meta.url);
const html=fs.readFileSync(new URL('index.html',dir),'utf8').replace('<script defer src="prototype.js"></script>','');
const dom=new JSDOM(html,{url:'https://prototype.invalid/?fresh=1',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;w.structuredClone=structuredClone;
w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
let networkCalls=0;w.fetch=()=>{networkCalls++;throw new Error('Unexpected network request');};
const errors=[];w.addEventListener('error',e=>errors.push(e.message));
w.eval(fs.readFileSync(new URL('prototype.js',dir),'utf8'));
const d=w.document,$=q=>d.querySelector(q),all=q=>[...d.querySelectorAll(q)],s=()=>w.SMPPrototype.snapshot();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function click(q){const el=typeof q==='string'?$(q):q;assert.ok(el,`Missing click target ${q}`);el.click();}
function fill(q,value){const el=$(q);assert.ok(el,`Missing input ${q}`);el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));}
function submit(q='#modal-form'){const el=$(q);assert.ok(el);el.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
const checks=[];function pass(text){checks.push(text);console.log('PASS '+text);}
try{
 assert.equal(s().playlists.length,8);assert.equal(all('.playlist-card').length,8);pass('8 seeded playlists; production source and storage are not used');
 click('[data-action=create]');fill('#modal-form [name=name]','검증 새 목록');submit();await sleep(400);
 const created=s().playlists.find(p=>p.name==='검증 새 목록');assert.ok(created);assert.equal(created.tracks.length,0);assert.ok(!d.body.textContent.includes('NaN'));assert.equal(s().selected,created.id);pass('Actual create form makes a valid empty playlist and opens add-track flow');
 fill('#video-url','https://youtu.be/DEMO0000099');fill('#add-track-form [name=name]','검증 곡');submit('#add-track-form');await sleep(400);assert.equal(s().playlists.find(p=>p.id===created.id).tracks.length,1);pass('Video URL addition saves title and track count');
 click('[data-action=library]');click('[data-action=play-playlist][data-id=night-drive]');await sleep(500);const playing=s();assert.equal(playing.phase,'playing');assert.equal(playing.queue.length,7);pass('Playback is explicitly simulated and creates an independent queue');
 click('[data-action=add-empty][data-id=new-space]');assert.deepEqual(s().queue,playing.queue);assert.equal(s().currentId,playing.currentId);pass('Empty playlist action adds a track; it does not clear existing playback');
 click('[data-action=open-playlist][data-id=night-drive]');click('[data-action=toggle-edit]');const originalQueue=s().queue,firstTrack=s().playlists[0].tracks[0];click('[data-action=move-track][data-direction="1"]');assert.equal(s().playlists[0].tracks[1].id,firstTrack.id);assert.deepEqual(s().queue,originalQueue);pass('Saved reorder does not change the active queue');
 click('[data-action=track-menu]');const count=s().playlists[0].tracks.length;click('[data-action=delete-track]');assert.equal(s().playlists[0].tracks.length,count-1);click('[data-action=undo]');assert.equal(s().playlists[0].tracks.length,count);pass('Single-track deletion has functional Undo without extra confirmation');
 click('[data-action=scenarios]');click('[data-action=scene-save-failure]');click('[data-action=create]');fill('#modal-form [name=name]','실패 후 재시도');submit();await sleep(400);assert.ok($('#modal').open);assert.equal($('#modal-form [name=name]').value,'실패 후 재시도');assert.ok(!$('#modal .form-error').hidden);assert.ok(!s().playlists.some(p=>p.name==='실패 후 재시도'));submit();await sleep(400);assert.ok(s().playlists.some(p=>p.name==='실패 후 재시도'));pass('Injected write failure preserves input; identical retry succeeds');
 click('[data-action=open-playlist][data-id="'+created.id+'"]');click('[data-action=playlist-menu][data-id="'+created.id+'"]');click('[data-action=delete-playlist]');click('[data-action=close-modal]');assert.ok(s().playlists.some(p=>p.id===created.id));
 click('[data-action=playlist-menu]');const deletingId=s().modal.data.id;click('[data-action=delete-playlist]');submit();await sleep(400);assert.ok(!s().playlists.some(p=>p.id===deletingId));assert.equal(s().route,'library');assert.deepEqual(s().queue,originalQueue);pass('Whole-playlist deletion confirms, returns to library and preserves playback');
 click('[data-action=import]');click('[data-action=fill-import-example]');submit();await sleep(550);assert.equal(s().modal.data.preview.length,6);assert.equal(s().modal.data.step,1);const beforeImport=s().playlists.length;submit();await sleep(400);assert.equal(s().playlists.length,beforeImport+1);const imported=s().playlists.find(p=>p.id===s().selected);assert.equal(imported.tracks.length,6);assert.ok(imported.source);pass('Import has explicit mock preview and a separate save step');
 click('[data-action=playlist-menu]');click('[data-action=reset-source]');submit();await sleep(550);assert.equal(s().modal.data.step,1);submit();assert.equal(s().modal.data.step,2);assert.deepEqual(s().queue,originalQueue);submit();await sleep(400);assert.equal(s().playlists.find(p=>p.id===imported.id).tracks.length,6);assert.deepEqual(s().queue,originalQueue);pass('Source reset previews, confirms, and replaces only the saved copy');
 if(!s().queueOpen)click('[data-action=toggle-queue]');click('[data-action=queue-tab][data-tab=queue]');click('[data-action=toggle-queue-edit]');const currentId=s().currentId;click('[data-action=move-queue][data-direction="1"]');assert.equal(s().currentId,currentId);pass('Queue reorder keeps the current track identity');
 click('[data-action=save-queue]');fill('#modal-form [name=name]','큐 저장 검증');submit();await sleep(400);assert.equal(s().playlists.find(p=>p.name==='큐 저장 검증').tracks.length,7);pass('Queue can be saved into a new independent playlist');
 click('[data-action=scenarios]');click('[data-action=scene-player-error]');assert.equal(s().phase,'error');assert.ok($('#queue-panel [role=alert]'));click('[data-action=retry-player]');await sleep(500);assert.equal(s().phase,'playing');pass('Simulated playback error offers retry without losing queue');
 Object.defineProperty(w,'innerWidth',{value:390,writable:true});w.dispatchEvent(new w.Event('resize'));await sleep(140);assert.equal($('#queue-panel').getAttribute('aria-modal'),'true');assert.equal($('#main-panel').inert,true);d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(s().queueOpen,false);assert.equal($('#main-panel').inert,false);pass('Narrow-screen queue acts as modal; Escape returns to the app');
 assert.equal(networkCalls,0);assert.deepEqual(errors,[]);assert.ok(w.localStorage.getItem('smp-electric-night-prototype-v1'));pass('No fetch calls, no JavaScript runtime errors; isolated persistence only');
 const result={date:'2026-10-16',mode:'jsdom with native dialog polyfill; no visual-layout or live-media claim',passed:checks.length,checks,networkCalls,errors};fs.writeFileSync(new URL('VERIFICATION.json',dir),JSON.stringify(result,null,2)+'\n');
 console.log(`\n${checks.length} interaction checks passed.`);
}finally{dom.window.close();}
