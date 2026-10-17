import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const base = process.env.TEST_URL || 'http://127.0.0.1:4173/simple-music-player/';
const source = 'https://i.ytimg.com/vi/abcdefghijk/default.jpg';
try {
  for (const mode of ['normal', 'missing-standard', 'unavailable']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 });
    const requests = [];
    await page.route('https://i.ytimg.com/vi/**', async route => {
      const name = new URL(route.request().url()).pathname.split('/').pop();
      requests.push(name);
      if (mode === 'unavailable') return route.fulfill({ status: 404, body: '' });
      let [width, height] = ({ 'mqdefault.jpg': [320,180], 'hqdefault.jpg': [480,360], 'sddefault.jpg': [640,480], 'default.jpg': [120,90] })[name] || [120,90];
      if (mode === 'missing-standard' && name === 'sddefault.jpg') [width,height] = [120,90];
      await route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#7655aa"/></svg>` });
    });
    await page.goto(base);
    await expect(page.getByRole('button', { name: '새 재생목록', exact: true })).toBeVisible();
    await page.evaluate(async source => {
      const r = indexedDB.open('simple-music-player-local-v1', 1);
      const db = await new Promise((resolve,reject) => { r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error); });
      await new Promise((resolve,reject) => {
        const tx=db.transaction('playlists','readwrite'); tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error);
        tx.objectStore('playlists').put({ info:{ id:'thumbnail-check',name:'썸네일 검증',description:'',createdAt:1,itemCount:1,thumbnails:[source] },items:[{key:'t1',videoID:'abcdefghijk',name:'테스트',owner:'',query:'',thumbnail:source}] });
      }); db.close();
    }, source);
    await page.reload();
    const card = page.getByRole('button', { name: '썸네일 검증 열기', exact:true });
    await expect(card).toBeVisible();
    // Exercise the shared cover at a large rendered size without changing product CSS.
    await card.locator('.wave-cover').evaluate(element => { element.style.width = '400px'; });
    if (mode === 'unavailable') {
      await expect(card.locator('img')).toHaveCount(0);
      await expect(card.locator('svg')).toBeVisible();
    } else {
      const img = card.locator('img');
      await expect.poll(() => img.evaluate(i=>i.complete && i.naturalWidth>120)).toBe(true);
      const width = await img.evaluate(i=>i.parentElement.getBoundingClientRect().width);
      const pixels=width*2;
      const expected = pixels<=180?'mqdefault.jpg':pixels<=360?'hqdefault.jpg':mode==='missing-standard'?'hqdefault.jpg':'sddefault.jpg';
      await expect(img).toHaveAttribute('src', new RegExp(`${expected}$`));
    }
    expect(requests.some(name=>name.includes('maxres'))).toBe(false);
    const stored = await page.evaluate(async()=>{
      const r=indexedDB.open('simple-music-player-local-v1',1);
      const db=await new Promise(resolve=>{r.onsuccess=()=>resolve(r.result)});
      const value=await new Promise(resolve=>{const q=db.transaction('playlists').objectStore('playlists').get('thumbnail-check');q.onsuccess=()=>resolve(q.result)});db.close();return value.items[0].thumbnail;
    });
    expect(stored).toBe(source);
    await page.close();
  }
  console.log('Bounded cover image selection, fallback and stored URL preservation passed');
} finally { await browser.close(); }
