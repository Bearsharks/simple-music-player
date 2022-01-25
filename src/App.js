
import './App.scss';
import { BrowserRouter, Route, NavLink, Redirect, Routes, useNavigate } from "react-router-dom";
import OauthCallback from './oauth2/OauthCallback';
import Init from './InitPage';

import Login from './LoginPage';
//import Main from './Main';
import Main from './TestPage';

import Spinner from './components/Spinner';
import { Suspense } from 'react';
function App() {
    return (
        <BrowserRouter basename='/simple-music-player'>

            <Routes>
                <Route path="/main" element={<Suspense fallback={<Spinner></Spinner>}><Main /></Suspense>}></Route>
                <Route path="/login" element={<Login />}></Route>
                <Route path="/callback/:token" element={<OauthCallback />}></Route>
                <Route path="/" element={<Init />}></Route>
                <Route path="*" element={<div />}></Route>
            </Routes>
        </BrowserRouter >
    );
};
export default App;