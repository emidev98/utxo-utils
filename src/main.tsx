import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { SpeedInsights } from "@vercel/speed-insights/react"

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <SpeedInsights />
    </BrowserRouter>
  </React.StrictMode>
);