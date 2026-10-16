import React from 'react';
import ReactDOM from 'react-dom';
import 'app/index.css';
import App from 'app/App';
import { RecoilRoot } from 'recoil';
ReactDOM.render(
  <React.StrictMode>
    <RecoilRoot>
      <App />
    </RecoilRoot>
  </React.StrictMode>,
  document.getElementById('root')
);
