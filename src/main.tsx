import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
const node=document.getElementById('root');
if(!node)throw new Error('Root missing');
createRoot(node).render(<StrictMode><App/></StrictMode>);
