import { useEffect, useState } from 'react';
import { Alert, Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { apiRequest } from '../services/api';
import { useApp } from '../context/AppContext';

export default function StaffAssignmentControl({ request, onSaved }) {
 const { user } = useApp();
 const [staff, setStaff] = useState([]);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [info, setInfo] = useState('');
 useEffect(() => {
  let live = true;
  apiRequest('/users/assignable')
   .then(r => { if (live) setStaff(r.data || []); })
   .catch(e => { if (live) setError(e.message); });
  return () => { live = false; };
 }, [user?.role]);
 async function assign(id) {
  if (request.source !== 'mongodb') { setError('Switch to MongoDB mode to save staff assignments.'); return; }
  setBusy(true);setError('');setInfo('');
  try {
   await apiRequest(`/requests/${encodeURIComponent(request.id)}/assignment`, {method:'PATCH',body:JSON.stringify({assignee:id||null})});
   await onSaved();
   setInfo('Assignment saved to MongoDB.');
  } catch(e) {setError(e.message);}
  finally {setBusy(false);}
 }
 const current = staff.find(s=>s.id===request.assigneeId);
 const selected = request.assigneeId || '';
 return <Box>
  <FormControl fullWidth size="small"><InputLabel>Assign staff</InputLabel>
   <Select label="Assign staff" value={selected} onChange={e=>assign(e.target.value)} disabled={busy||request.source!=='mongodb'}>
    <MenuItem value="">Unassigned</MenuItem>
    {staff.map(person=><MenuItem value={person.id} key={person.id}>{person.name} ({person.department||'No department'})</MenuItem>)}
    {selected&&!current&&<MenuItem value={selected}>{request.assignee||'Assigned staff'} (not in active list)</MenuItem>}
   </Select>
  </FormControl>
  {busy&&<Typography variant="caption" color="text.secondary">Saving staff assignment…</Typography>}
  {error&&<Alert severity="error" sx={{mt:1}}>{error}</Alert>}
  {info&&<Alert severity="success" sx={{mt:1}}>{info}</Alert>}
 </Box>;
}
