import { useEffect, useState } from 'react';
import { Alert, Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import { apiRequest } from '../services/api';
import { useApp } from '../context/AppContext';

export default function RequestCommentsPanel({ request }) {
 const { user } = useApp();
 const [comments, setComments] = useState([]);
 const [draft, setDraft] = useState('');
 const [error, setError] = useState('');
 const [success, setSuccess] = useState('');
 const [loading, setLoading] = useState(false);
 const [busy, setBusy] = useState(false);
 useEffect(() => {
  if (request.source !== 'mongodb') return;
  let active = true;
  setLoading(true);setError('');
  apiRequest(`/requests/${encodeURIComponent(request.id)}`)
   .then(r => { if (active) setComments(r.data?.comments||[]); })
   .catch(e => { if (active) setError(e.message); })
   .finally(()=>{if (active) setLoading(false);});
  return ()=>{active=false;};
 }, [request.id, request.source]);
 async function submit() {
  if (!draft.trim()) return;
  setBusy(true);setError('');setSuccess('');
  try {
   await apiRequest(`/requests/${encodeURIComponent(request.id)}/comments`, { method:'POST',body:JSON.stringify({body:draft.trim(),visibility:'Public'}) });
   const result = await apiRequest(`/requests/${encodeURIComponent(request.id)}`);
   setComments(result.data?.comments || []);setDraft('');setSuccess('Comment saved to MongoDB.');
  }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 return <Stack spacing={2}>
  <Box className="timeline">{(request.events||[]).map((ev,i)=><Box className={`timeline-item ${ev.done?'timeline-done':''}`} key={i}><span className="timeline-dot"/><Box><Typography className="timeline-title">{ev.label}</Typography><Typography className="timeline-date">{ev.date}</Typography></Box></Box>)}</Box>
  <Divider/>
  <Typography className="detail-label">SAVED COMMENTS</Typography>
  {loading&&<Typography color="text.secondary" variant="body2">Loading comments…</Typography>}
  {!loading&&!comments.length&&<Typography color="text.secondary" variant="body2">No saved comments yet.</Typography>}
  {comments.map((c,i)=><Box key={c._id||i} sx={{px:2,py:1.5,bgcolor:'action.hover',borderRadius:2}}>
   <Typography variant="body2" sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{c.body}</Typography>
   <Typography variant="caption" color="text.secondary">{c.author?.name||'Account'} · {c.createdAt?new Date(c.createdAt).toLocaleString():''} {c.visibility==='Internal'?'· Internal':''}</Typography>
  </Box>)}
  {request.source==='mongodb'?<>
   <TextField fullWidth multiline minRows={2} label="Add a comment" placeholder="Share a service request update…" value={draft} onChange={e=>setDraft(e.target.value)} inputProps={{maxLength:3000}}/>
   <Box sx={{display:'flex',justifyContent:'flex-end'}}><Button disabled={!draft.trim()||busy} onClick={submit} variant="contained">{busy?'Posting…':'Post comment'}</Button></Box>
  </>:<Alert severity="info">Comments on demo requests cannot be saved. Use MongoDB mode.</Alert>}
  {error&&<Alert severity="error">{error}</Alert>}
  {success&&<Alert severity="success">{success}</Alert>}
 </Stack>;
}
