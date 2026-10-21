import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { initializeAuth } from './services/chiroAuth';
initializeAuth().then(()=>createRoot(document.getElementById("root")!).render(<App data-id="8sypmaxqu" data-path="src/main.tsx" />)).catch(()=>{document.getElementById("root")!.textContent="Unable to initialize Chiro Auth. Please reload and try again.";});