import 'app/App.scss';
import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import api from 'shared/api/apiSelector'
import { ReactElement, useEffect, useState } from 'react';
import Spinner from 'shared/ui/Spinner';
import Login from 'features/auth/pages/LoginPage';
const OauthCallback = React.lazy(() => import('features/auth/pages/OauthCallback'));
const Main = React.lazy(() => import('features/navigation/pages/Main'));

function PrivateRoute({ children }: { children: ReactElement }) {
    const [auth, setAuth] = useState('pending');
    useEffect(() => {
        let active = true;
        const check = async () => {
            try { const isAuthed = await api.checkAuth(); if (active) setAuth(isAuthed ? 'true' : 'false'); } catch { if (active) setAuth('error'); }
        }
        check();
        return () => { active = false; };
    }, [])
    if (auth === 'error') return <div role="alert">서버에 연결하지 못했습니다. 설정과 연결을 확인한 뒤 <button onClick={() => window.location.reload()}>다시 시도</button>해 주세요.</div>;
    return (auth === 'pending' ? <Spinner /> : auth === 'true' ? children : <Navigate to="/login" replace={true} />);
}

function App() {
    return (
        <BrowserRouter basename='/simple-music-player'>
            <Suspense fallback={<Spinner />}>
                <Routes>
                    <Route path="/login" element={<Login />}></Route>
                    <Route path="/callback/:token" element={<OauthCallback />}></Route>
                    <Route path="*" element={<PrivateRoute><Main /></PrivateRoute>}></Route>
                </Routes>
            </Suspense>

        </BrowserRouter >
    );
};
export default App;
