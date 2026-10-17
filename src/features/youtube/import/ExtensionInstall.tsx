import { useRef, useState } from "react";
import Dialog from "shared/ui/Dialog";
import { Button } from "shared/ui/shadcn/button";
import { Input } from "shared/ui/shadcn/input";
import { Label } from "shared/ui/shadcn/label";

export const EXTENSION_RELEASE_URL = "https://github.com/Bearsharks/loop-yt-player/releases/latest/download/loopy-extension.zip";
export const EXTENSION_ZIP_URL = import.meta.env.DEV
  ? `${import.meta.env.BASE_URL}downloads/loopy-extension.zip`
  : EXTENSION_RELEASE_URL;

export default function ExtensionInstall({ checking, onCheck, onClose }: {
  checking: boolean; onCheck: () => void; onClose: () => void;
}) {
  const manager = /Edg\//.test(navigator.userAgent) ? "edge://extensions" : "chrome://extensions";
  const [copyStatus, setCopyStatus] = useState("");
  const address = useRef<HTMLInputElement>(null);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(manager);
      setCopyStatus("주소를 복사했습니다.");
    } catch {
      address.current?.focus();
      address.current?.select();
      setCopyStatus("선택한 주소를 복사하세요.");
    }
  }

  return <Dialog label="확장 프로그램 설치" onClose={onClose}>
    <section className="li-install">
      <header><h2>확장 프로그램 설치</h2><Button variant="ghost" size="icon" aria-label="설치 안내 닫기" onClick={onClose}>×</Button></header>
      <p className="li-install-note">Chrome·Edge 데스크톱용</p>
      <Button asChild><a href={EXTENSION_ZIP_URL} download="loopy-extension.zip" target="_blank" rel="noopener noreferrer">확장 프로그램 다운로드</a></Button>
      <ol>
        <li>다운로드한 ZIP의 압축을 풉니다.</li>
        <li>아래 주소를 새 탭에서 열고 <strong>개발자 모드</strong>를 켭니다.</li>
        <li><strong>압축해제된 확장 프로그램을 로드</strong>에서 <code>loopy-extension</code> 폴더를 선택합니다.</li>
      </ol>
      <Label htmlFor="li-extension-address">확장 관리 주소</Label>
      <div className="li-install-address"><Input ref={address} id="li-extension-address" value={manager} readOnly onFocus={e=>e.target.select()}/><Button variant="outline" onClick={()=>void copyAddress()}>복사</Button></div>
      <p className="li-install-note">설치 폴더를 유지하세요. 업데이트는 새 ZIP으로 파일을 교체한 뒤 확장 관리에서 새로고침합니다.</p>
      <p className="li-install-status" role="status">{copyStatus || (checking ? "연결 확인 중…" : "연결되지 않으면 Loopy를 새로고침하세요.")}</p>
      <footer><Button variant="outline" onClick={onClose}>닫기</Button><Button disabled={checking} onClick={onCheck}>{checking?"연결 확인 중…":"연결 확인"}</Button></footer>
    </section>
  </Dialog>;
}
