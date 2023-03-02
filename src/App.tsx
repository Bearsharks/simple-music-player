import './App.scss';
import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { checkAuth } from 'refs/api'
import { ReactElement, useEffect, useState } from 'react';
import Spinner from 'components/Spinner';
import Login from 'pages/LoginPage';
import {
    QueryClient,
    QueryClientProvider,
} from 'react-query'
const OauthCallback = React.lazy(() => import('pages/OauthCallback'));
const Main = React.lazy(() => import('pages/Main'));

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

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter basename='/simple-music-player'>
                <Suspense fallback={<Spinner />}>
                    <Routes>
                        <Route path="/login" element={<Login />}></Route>
                        <Route path="/callback/:token" element={<OauthCallback />}></Route>
                        <Route path="*" element={<PrivateRoute><Main /></PrivateRoute>}></Route>
                    </Routes>
                </Suspense>
            </BrowserRouter >
        </QueryClientProvider>
    );
}
export default App;