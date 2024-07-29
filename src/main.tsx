import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './style.less';
import './logic';
import { Store } from './store';

Store.connectToConnectServer();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
