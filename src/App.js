
import './App.scss';
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import OauthCallback from './oauth2/OauthCallback';
import Login from './LoginPage';
import { checkAuth } from './refs/api'
import Main from './Main';
import { useEffect, useState } from 'react';
import Spinner from './components/Spinner';

function PrivateRoute({ children }) {
    const [auth, setAuth] = useState('pending');
    useEffect(() => {
        const check = async () => {
            const isAuthed = await checkAuth();
            setAuth(isAuthed ? 'true' : 'false');
        }
        check();
    }, [])
    return auth === 'pending' ? <Spinner /> : auth === 'true' ? children : <Navigate to="/login" replace={true} />;
}

function App() {
    return (
        <BrowserRouter basename='/simple-music-player'>
            <Routes>
                <Route path="/login" element={<Login />}></Route>
                <Route path="/callback/:token" element={<OauthCallback />}></Route>
                <Route path="*" element={<PrivateRoute><Main /></PrivateRoute>}></Route>
            </Routes>
        </BrowserRouter >
    );
};
export default App;