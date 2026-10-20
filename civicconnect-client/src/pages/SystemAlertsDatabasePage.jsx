import {useEffect,useState} from 'react';
import {Alert,Box,Button,Paper,Stack,Switch,TextField,Typography} from '@mui/material';
import {apiRequest} from '../services/api';
import {useApp} from '../context/AppContext';
const empty={isActive:false,title:'',message:'',fallbackFormUrl:'',severity:'High',estimatedRecovery:'Unknown'};
export default function SystemAlertsDatabasePage(){
 const {setEmergency}=useApp();const [draft,setDraft]=useState(empty),[error,setError]=useState(''),[saved,setSaved]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{apiRequest('/settings').then(r=>{setDraft({...empty,...(r.data?.downtime||{}),fallbackFormUrl:r.data?.fallbackFormUrl||r.data?.downtime?.fallbackFormUrl||''})}).catch(e=>setError(e.message))},[]);
 async function save(){setBusy(true);setSaved(false);setError('');try{
  const notice={...draft,simulated:false,detectedAt:draft.isActive?(draft.detectedAt||new Date().toISOString()):null};
  await apiRequest('/settings/fallbackFormUrl',{method:'PUT',body:JSON.stringify({value:draft.fallbackFormUrl.trim()})});
  await apiRequest('/settings/downtime',{method:'PUT',body:JSON.stringify({value:notice})});
  setEmergency(notice);setSaved(true);
 }catch(e){setError(e.message)}finally{setBusy(false)}}
 return <Box><Typography variant="h4" sx={{mb:1}}>System alerts</Typography><Typography color="text.secondary" sx={{mb:3}}>Manage actual service notices saved in MongoDB. No outage simulation.</Typography>{error&&<Alert severity="error" sx={{mb:2}}>{error}</Alert>}{saved&&<Alert severity="success" sx={{mb:2}}>Alert settings saved in MongoDB.</Alert>}<Paper sx={{p:3,maxWidth:720}}><Stack spacing={2}><Stack direction="row" alignItems="center" justifyContent="space-between"><Typography fontWeight={700}>Show public service interruption notice</Typography><Switch checked={Boolean(draft.isActive)} onChange={e=>setDraft({...draft,isActive:e.target.checked})}/></Stack><TextField label="Alert heading" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/><TextField label="Public message" multiline minRows={3} value={draft.message} onChange={e=>setDraft({...draft,message:e.target.value})}/><TextField label="Google Forms fallback URL (optional)" value={draft.fallbackFormUrl} onChange={e=>setDraft({...draft,fallbackFormUrl:e.target.value})}/><Button variant="contained" disabled={busy||Boolean(draft.isActive&&(!draft.title.trim()||!draft.message.trim()))} onClick={save}>Save alert settings</Button></Stack></Paper></Box>
}
