import { useCallback, useEffect, useState } from 'react';
import {
 Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
 FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody,
 TableCell, TableHead, TableRow, TextField, Typography
} from '@mui/material';
import { apiRequest } from '../services/api';
import { useApp } from '../context/AppContext';

const roles = ['Requester', 'Staff', 'Manager', 'Administrator'];
const empty = { name: '', email: '', password: '', role: 'Staff', department: '' };
export default function UsersDatabasePage() {
 const { user } = useApp();
 const [records, setRecords] = useState([]);
 const [role, setRole] = useState('Staff');
 const [search, setSearch] = useState('');
 const [page, setPage] = useState(1);
 const [pages, setPages] = useState(1);
 const [total, setTotal] = useState(0);
 const [loading, setLoading] = useState(false);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [success, setSuccess] = useState('');
 const [open, setOpen] = useState(false);
 const [editing, setEditing] = useState(null);
 const [form, setForm] = useState(empty);
 const load = useCallback(async () => {
  setLoading(true); setError('');
  try {
   const params = new URLSearchParams({ page: String(page), limit: '25' });
   if (role !== 'All') params.set('role', role);
   if (search.trim()) params.set('q', search.trim());
   const result = await apiRequest(`/users?${params}`);
   setRecords(result.data || []);
   setPages(result.pagination?.pages || 1);
   setTotal(result.pagination?.total || 0);
  } catch (err) { setError(err.message); }
  finally { setLoading(false); }
 }, [page, role, search]);
 useEffect(() => { if (user?.role === 'Administrator') load(); }, [user?.role, load]);
 function startCreate() { setForm(empty); setEditing(null); setOpen(true); setError(''); }
 function startEdit(entry) {
  setForm({ name: entry.name, email: entry.email, role: entry.role, department: entry.department || '', password: '' });
  setEditing(entry); setOpen(true); setError('');
 }
 async function save() {
  setError(''); setSuccess(''); setBusy(true);
  try {
   const payload = { name: form.name.trim(), email: form.email.trim(), role: form.role, department: form.department.trim() };
   if (!editing || form.password) payload.password = form.password;
   if (!editing && (!form.password || form.password.length < 10)) throw new Error('A new account needs a password of at least 10 characters.');
   await apiRequest(editing ? `/users/${encodeURIComponent(editing.id)}` : '/users', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
   setOpen(false);setEditing(null);setForm(empty);
   setSuccess(editing ? 'Account changes saved in MongoDB.' : 'Staff/user account created in MongoDB.');
   await load();
  } catch (err) { setError(err.message); }
  finally { setBusy(false); }
 }
 async function changeActive(entry, enabled) {
  const text = enabled ? `Reactivate ${entry.name}?` : `Deactivate ${entry.name}? Their login will stop working, but request history will be retained.`;
  if (!window.confirm(text)) return;
  setBusy(true);setError('');setSuccess('');
  try {
   if (!enabled && entry.role === 'Staff') await apiRequest(`/users/${encodeURIComponent(entry.id)}`, { method: 'DELETE' });
   else await apiRequest(`/users/${encodeURIComponent(entry.id)}`, { method: 'PATCH', body: JSON.stringify({ active: enabled }) });
   setSuccess(enabled ? 'Account reactivated in MongoDB.' : 'Account deactivated in MongoDB (soft delete).');
   await load();
  } catch (err) { setError(err.message); }
  finally { setBusy(false); }
 }
 if (user?.role !== 'Administrator') return <Alert severity="error">Only Administrators can manage user accounts.</Alert>;
 return <Stack spacing={2.5}>
  <Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:2}}>
   <Box><Typography variant="h5" fontWeight={800}>Staff and user management</Typography>
    <Typography color="text.secondary" variant="body2">Create, view, edit and deactivate MongoDB accounts. Staff are shown by default.</Typography></Box>
   <Button variant="contained" onClick={startCreate}>Add staff / user</Button>
  </Box>
  <Paper sx={{p:2,borderRadius:2}}>
   <Stack direction={{xs:'column',sm:'row'}} spacing={2}>
    <TextField fullWidth size="small" label="Search staff by name or email" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} />
    <FormControl size="small" sx={{minWidth:190}}><InputLabel>Account role</InputLabel>
     <Select label="Account role" value={role} onChange={e=>{setRole(e.target.value);setPage(1);}}>
      {['All', ...roles].map(value=><MenuItem key={value} value={value}>{value==='All'?'All roles':value}</MenuItem>)}
     </Select></FormControl>
    <Button variant="outlined" onClick={load} disabled={loading}>Refresh</Button>
   </Stack>
  </Paper>
  {error&&<Alert severity="error" onClose={()=>setError('')}>{error}</Alert>}
  {success&&<Alert severity="success" onClose={()=>setSuccess('')}>{success}</Alert>}
  <Paper sx={{overflowX:'auto',borderRadius:2}}>
   <Table size="small"><TableHead><TableRow>{['Name / email', 'Role', 'Department', 'Status', 'Actions'].map(c=><TableCell key={c} sx={{fontWeight:800}}>{c}</TableCell>)}</TableRow></TableHead>
    <TableBody>{records.map(entry=><TableRow key={entry.id}>
     <TableCell><Typography fontWeight={600} variant="body2">{entry.name}</Typography><Typography variant="caption" color="text.secondary">{entry.email}</Typography></TableCell>
     <TableCell>{entry.role}</TableCell><TableCell>{entry.department||'—'}</TableCell>
     <TableCell><Chip size="small" color={entry.active?'success':'default'} label={entry.active?'Active':'Inactive'}/></TableCell>
     <TableCell><Stack direction="row" spacing={1}><Button size="small" onClick={()=>startEdit(entry)} disabled={busy}>Edit</Button>
      <Button size="small" color={entry.active?'error':'success'} disabled={busy||entry.id===user.id} onClick={()=>changeActive(entry,!entry.active)}>{entry.active?'Deactivate':'Reactivate'}</Button>
     </Stack></TableCell>
    </TableRow>)}
    {!records.length&&<TableRow><TableCell colSpan={5}>{loading?'Loading accounts…':'No matching accounts found in MongoDB.'}</TableCell></TableRow>}
   </TableBody></Table>
   <Box sx={{p:2,display:'flex',gap:2,justifyContent:'space-between',alignItems:'center'}}>
    <Typography variant="body2" color="text.secondary">{total} matching accounts · Page {page} of {pages}</Typography>
    <Stack direction="row"><Button size="small" disabled={page<=1||loading} onClick={()=>setPage(p=>p-1)}>Previous</Button><Button size="small" disabled={page>=pages||loading} onClick={()=>setPage(p=>p+1)}>Next</Button></Stack>
   </Box>
  </Paper>
  <Alert severity="info">Deleting a staff member deactivates the account; the user record is retained for audit and historic requests. Open assigned requests must be reassigned before deactivation.</Alert>
  <Dialog open={open} onClose={()=>!busy&&setOpen(false)} fullWidth maxWidth="sm">
   <DialogTitle>{editing?'Edit account':'Create staff / user account'}</DialogTitle>
   <DialogContent><Stack spacing={2} sx={{pt:1}}>
    <TextField autoFocus required label="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
    <TextField required label="Email address" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
    <FormControl fullWidth><InputLabel>Role</InputLabel><Select label="Role" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{roles.map(r=><MenuItem key={r} value={r}>{r}</MenuItem>)}</Select></FormControl>
    <TextField label="Department (optional)" value={form.department} onChange={e=>setForm({...form,department:e.target.value})}/>
    <TextField label={editing?'New password (leave blank to keep current)':'Password (at least 10 characters)'} type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
    {error&&<Alert severity="error">{error}</Alert>}
   </Stack></DialogContent>
   <DialogActions><Button disabled={busy} onClick={()=>setOpen(false)}>Cancel</Button><Button disabled={busy||form.name.trim().length<2||!form.email.includes('@')||(!editing&&form.password.length<10)} variant="contained" onClick={save}>{busy?'Saving…':'Save to MongoDB'}</Button></DialogActions>
  </Dialog>
 </Stack>;
}
