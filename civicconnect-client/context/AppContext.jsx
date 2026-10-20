import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { apiRequest, getAccessToken, setAccessToken } from '../services/api';

const Context = createContext(null);
export function AppProvider({children}) {
 const [user,setUser] = useState(null);
 const [authLoading,setAuthLoading] = useState(Boolean(getAccessToken()));
 useEffect(() => {
   let alive = true;
   if (!getAccessToken()) { setAuthLoading(false); return () => { alive = false; }; }
   apiRequest('/auth/me').then(result => { if (alive) setUser(result.user); })
     .catch(() => { setAccessToken(null); if (alive) setUser(null); })
     .finally(() => { if (alive) setAuthLoading(false); });
   return () => { alive = false; };
 }, []);
 const [requests,setRequests] = useState([]);
 const [users,setUsers] = useState([]);
 const [categoryList,setCategoryList] = useState([]);
 const [emergency,setEmergency] = useState({isActive:false,simulated:false,title:'Municipal service interruption',message:'Our online request service is temporarily unavailable. Requests may not be saved to the main database. Please use the alternative reporting channel.',fallbackFormUrl:'',severity:'High',detectedAt:null,estimatedRecovery:'Unknown'});
 const [dataSource,setDataSource] = useState('mongodb');
 const [notifications,setNotifications] = useState([{id:'N-1001',title:'Planned water maintenance',message:'Water maintenance is planned for selected areas. Please check municipal updates.',category:'Maintenance',priority:'Medium',startAt:'2026-10-15T08:00',expiresAt:'2026-10-30T18:00',status:'Published',audience:'Everyone'}]);
 const [imports,setImports] = useState([]);
 const [audit,setAudit] = useState([]);
 useEffect(()=>{
  let active=true;
  apiRequest('/settings/public-alert').then(r=>{if(active)setEmergency(prev=>({...prev,...r.data,simulated:false}))}).catch(()=>{});
  return ()=>{active=false};
 },[]);
 const [liveRequests,setLiveRequests] = useState([]);
 const [liveError,setLiveError] = useState('');
 const mapLiveRequest = (r) => ({
  id:r._id,number:r.number,title:r.title,description:r.description,
  requesterId:String(r.requester?._id||r.requester||''),assigneeId:r.assignee?._id||r.assignee||null,
  category:r.category?.name||'Uncategorised',priority:r.priority,status:r.status,
  location:r.location,requester:r.requester?.name||'',assignee:r.assignee?.name||'Unassigned',
  createdAt:r.createdAt,updatedAt:r.updatedAt,source:'mongodb',
  events:(r.events||[]).map(ev=>({
   label:ev.label,date:ev.createdAt?new Date(ev.createdAt).toLocaleString():ev.date||'',done:true
  }))
 });
 async function refreshLiveRequests(){
  try{
   const result=await apiRequest('/requests?limit=100');
   const items=(result.data||[]).map(mapLiveRequest);
   setLiveRequests(items);setLiveError('');
   return items;
  }catch(err){setLiveError(err.message);throw err;}
 }
 useEffect(()=>{
  if (!user) {setLiveRequests([]);setLiveError('');return;}
  let active=true;
  apiRequest('/requests?limit=100')
   .then(result=>{if(active){setLiveRequests((result.data||[]).map(mapLiveRequest));setLiveError('');}})
   .catch(err=>{if(active){setLiveRequests([]);setLiveError(err.message);}});
  return ()=>{active=false};
 },[user?.id,user?.role]);
 const displayedRequests=liveRequests;
 const value = useMemo(()=>({user,setUser,authLoading,requests:displayedRequests,liveError,refreshLiveRequests,setRequests,users,setUsers,categoryList,setCategoryList,emergency,setEmergency,audit,setAudit,dataSource,setDataSource,notifications,setNotifications,imports,setImports}),[user,authLoading,requests,users,categoryList,emergency,audit,dataSource,notifications,imports,liveRequests,liveError]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useApp = () => useContext(Context);
