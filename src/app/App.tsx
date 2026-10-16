import 'app/App.scss';
import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { checkAuth } from 'shared/api/api'
import { ReactElement, useEffect, useState } from 'react';
import Spinner from 'shared/ui/Spinner';
import Login from 'features/auth/pages/LoginPage';
const OauthCallback = React.lazy(() => import('features/auth/pages/OauthCallback'));
const Main = React.lazy(() => import('features/navigation/pages/Main'));

function PrivateRoute({ children }: { children: ReactElement }) {
    const [auth, setAuth] = useState('pending');
    useEffect(() => {
        const check = async () => {
            const isAuthed = await checkAuth();
            setAuth(isAuthed ? 'true' : 'false');
        }
        check();
    }, [])
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