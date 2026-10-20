import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';
import { AppProvider } from './context/AppContext';
import './styles.css';
const theme = createTheme({ palette:{ primary:{main:'#176b67',dark:'#104b4b'}, secondary:{main:'#e4a64f'}, background:{default:'#f5f7f8',paper:'#ffffff'}, text:{primary:'#1e3039',secondary:'#6b7b83'}, success:{main:'#2e8068'}, warning:{main:'#bd7c26'}, error:{main:'#bf5551'} }, typography:{fontFamily:'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',button:{textTransform:'none',fontWeight:650}}, shape:{borderRadius:12}, components:{MuiButton:{styleOverrides:{root:{borderRadius:10,boxShadow:'none',padding:'9px 16px'}}},MuiPaper:{styleOverrides:{root:{backgroundImage:'none'}}}} });
createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><ThemeProvider theme={theme}><CssBaseline/><AppProvider><App/></AppProvider></ThemeProvider></BrowserRouter></React.StrictMode>);
