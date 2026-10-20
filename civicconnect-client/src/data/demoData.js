export const categories = [
 {id:'water',name:'Water & sanitation',description:'Leaks, water supply and sewer issues',color:'#dceefa'},
 {id:'roads',name:'Roads & potholes',description:'Road damage, potholes and signage',color:'#f9ead8'},
 {id:'electricity',name:'Electricity',description:'Streetlights and power infrastructure',color:'#f8edc9'},
 {id:'waste',name:'Waste management',description:'Missed collections and illegal dumping',color:'#dcefe5'},
 {id:'parks',name:'Parks & public spaces',description:'Public facilities and green spaces',color:'#e8e3f8'},
];
export const initialRequests = [
 {id:'1',number:'REQ-20261012-0041',title:'Water leak outside community clinic',category:'Water & sanitation',status:'In Progress',priority:'High',location:'12 Madiba Street, Equestria',requester:'Lerato Mokoena',assignee:'Thabo Ndlovu',createdAt:'2026-10-12T08:42:00',updatedAt:'2026-10-13T09:12:00',description:'A pipe is leaking continuously on the pavement outside the clinic. Water is flowing into the road.',events:[{label:'Request submitted',date:'12 Oct 2026, 08:42',done:true},{label:'Reviewed by municipal team',date:'12 Oct 2026, 11:20',done:true},{label:'Technician assigned',date:'13 Oct 2026, 09:12',done:true},{label:'Resolution confirmed',date:'Awaiting update',done:false}]},
 {id:'2',number:'REQ-20261011-0038',title:'Large pothole near school entrance',category:'Roads & potholes',status:'Submitted',priority:'Critical',location:'Corner of Oak Avenue and 3rd Road',requester:'Sipho Dlamini',assignee:'Unassigned',createdAt:'2026-10-11T14:15:00',updatedAt:'2026-10-11T14:15:00',description:'A deep pothole is making it difficult for cars and school transport to enter the street safely.',events:[{label:'Request submitted',date:'11 Oct 2026, 14:15',done:true},{label:'Municipal review',date:'Pending',done:false}]},
 {id:'3',number:'REQ-20261010-0034',title:'Streetlight not working',category:'Electricity',status:'Resolved',priority:'Medium',location:'Mahlangu Street, Ward 6',requester:'Nandi Khumalo',assignee:'Kabelo Maseko',createdAt:'2026-10-10T18:20:00',updatedAt:'2026-10-12T16:30:00',description:'The streetlight outside the pedestrian crossing has been off for several nights.',events:[{label:'Request submitted',date:'10 Oct 2026, 18:20',done:true},{label:'Technician assigned',date:'11 Oct 2026, 09:05',done:true},{label:'Repair completed',date:'12 Oct 2026, 16:30',done:true}]},
 {id:'4',number:'REQ-20261009-0029',title:'Missed waste collection',category:'Waste management',status:'In Progress',priority:'Low',location:'44 Acacia Crescent, Ward 3',requester:'Mpho Nkosi',assignee:'Nomsa Dube',createdAt:'2026-10-09T07:50:00',updatedAt:'2026-10-12T10:00:00',description:'Household bins were not collected on the scheduled collection day.',events:[{label:'Request submitted',date:'9 Oct 2026, 07:50',done:true},{label:'Collection team notified',date:'12 Oct 2026, 10:00',done:true},{label:'Collection confirmed',date:'Pending',done:false}]},
 {id:'5',number:'REQ-20261008-0021',title:'Blocked stormwater drain',category:'Water & sanitation',status:'Closed',priority:'High',location:'Main Road, Ward 8',requester:'Palesa Molefe',assignee:'Thabo Ndlovu',createdAt:'2026-10-08T11:34:00',updatedAt:'2026-10-10T13:40:00',description:'Leaves and debris have blocked the drain and water pools during rainfall.',events:[{label:'Request submitted',date:'8 Oct 2026, 11:34',done:true},{label:'Drain cleared',date:'10 Oct 2026, 13:40',done:true},{label:'Request closed',date:'10 Oct 2026, 15:00',done:true}]},
 {id:'6',number:'REQ-20261007-0017',title:'Damaged traffic sign',category:'Roads & potholes',status:'Submitted',priority:'Medium',location:'School Road, Ward 2',requester:'Karabo Molefe',assignee:'Unassigned',createdAt:'2026-10-07T09:00:00',updatedAt:'2026-10-07T09:00:00',description:'A traffic sign has fallen and is lying beside the road.',events:[{label:'Request submitted',date:'7 Oct 2026, 09:00',done:true},{label:'Municipal review',date:'Pending',done:false}]},
];
export const staff = ['Thabo Ndlovu','Kabelo Maseko','Nomsa Dube','Lindiwe Mokoena'];
export const demoUsers = [
 {id:'u1',name:'Lerato Mokoena',email:'lerato@example.com',role:'Requester',active:true},
 {id:'u2',name:'Thabo Ndlovu',email:'thabo@civicconnect.gov.za',role:'Staff',active:true},
 {id:'u3',name:'Naledi Ramokgopa',email:'naledi@civicconnect.gov.za',role:'Manager',active:true},
 {id:'u4',name:'Admin User',email:'admin@civicconnect.gov.za',role:'Administrator',active:true},
 {id:'u5',name:'Kabelo Maseko',email:'kabelo@civicconnect.gov.za',role:'Staff',active:true},
];
