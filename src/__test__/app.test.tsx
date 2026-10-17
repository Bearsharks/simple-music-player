import {render,screen} from '@testing-library/react';
import {vi,it,expect} from 'vitest';
import type {ReactNode} from 'react';
vi.mock('features/navigation/pages/Main',()=>({default:({tools}:{tools:ReactNode})=><main>{tools}<h1>작업 공간</h1></main>}));
vi.mock('features/youtube/import/ExtensionImport',()=>({default:()=> <button>연결 확인</button>}));
import App from 'app/App';
it('mounts the workspace and YouTube tools through the product entrypoint',async()=>{
  render(<App/>);expect(await screen.findByRole('heading',{name:'작업 공간'})).toBeVisible();expect(screen.getByRole('button',{name:'연결 확인'})).toBeVisible();
});
