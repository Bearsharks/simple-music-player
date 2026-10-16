# 배포 및 도메인 준비

## 현재 배포

- GitHub Pages: https://bearsharks.github.io/simple-music-player/
- 확인한 설정: gh-pages 브랜치 루트, HTTPS 강제, legacy branch build
- Vite base와 BrowserRouter basename은 /simple-music-player/
- `npm ci`, `npm run check` 후 dist를 gh-pages에 배포한다. 소스는 별도 작업 브랜치에 보존한다.
- 정적 리소스와 Pages 상태, 실제 재생은 각각 별도로 확인한다. 단위 테스트를 실제 YouTube 재생 증거로 쓰지 않는다.

## 준비만 하는 사용자 도메인

후보: smp.bearsharks.dev (사용자 소유 bearsharks.dev, Cloudflare 관리).
2026-10-16 최신 사용자 지시: 기존 GitHub URL을 유지하고 도메인은 준비만 한다. CNAME 파일, GitHub Custom domain, Cloudflare DNS를 현재 변경하지 않는다.

추후 전환 승인 시:
1. GitHub 소유권 검증과 기존 DNS 충돌 확인.
2. 앱 base/basename을 새 루트에 맞게 변경하고 데이터 이전 방안 결정.
3. GitHub Pages Custom domain에 smp.bearsharks.dev 설정.
4. Cloudflare CNAME smp → bearsharks.github.io (저장소 경로를 붙이지 않음).
5. DNS 전파·Pages 도메인 검증·인증서 상태 확인 후 HTTPS 검증.
6. 기존 github.io 주소 리디렉션과 정적 리소스·로컬 저장·YouTube 재생을 확인.

도메인 변경은 localStorage origin도 바꾼다. 자동 데이터 이전을 약속하지 않는다. ChatGPT Sites 전환도 사용자 지시로 보류했다.

공식 문서: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
