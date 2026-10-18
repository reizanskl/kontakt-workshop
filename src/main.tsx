import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Workshop from './components/workshop';
import './styles/globals.css';
import './styles/workshop.css';

createRoot(document.getElementById('root')!).render(<StrictMode><Workshop /></StrictMode>);
