const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const uploadDir = path.join(__dirname, '..', '..', 'private-uploads');
fs.mkdirSync(uploadDir, {recursive:true});
const allowed = new Set(['image/jpeg','image/png','image/webp','application/pdf']);
const upload = multer({storage:multer.diskStorage({destination:uploadDir,filename:(_req,_file,cb)=>cb(null,crypto.randomUUID())}),limits:{fileSize:5*1024*1024,files:3},fileFilter:(_req,file,cb)=>cb(null,allowed.has(file.mimetype))});

const { body, query, validationResult } = require('express-validator');
const Request = require('../models/ServiceRequest');
const Category = require('../models/Category');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { recordAudit } = require('../services/auditService');
const { canTransition } = require('../domain/requestWorkflow');
router.use(authenticate);
const validate = (req,res,next) => { const e=validationResult(req); if(!e.isEmpty()) return res.status(400).json({success:false,message:'Validation failed.',errors:e.array().map(x=>({field:x.path,message:x.msg}))}); next(); };
function scopeFor(user) {
  if (user.role === 'Administrator') return {};
  if (user.role === 'Requester') return { requester: user._id };
  if (user.role === 'Staff') return { $or: [{ assignee: user._id }, { requester: user._id }] };
  // Manager scope is explicitly department-bound; unscoped managers see no private requests.
  return user.department ? { department: user.department } : { _id: null };
}
function canManage(reqDoc, user) {
  if (user.role === 'Administrator') return true;
  if (user.role === 'Manager') return Boolean(user.department && user.department === reqDoc.department);
  return user.role === 'Staff' && String(reqDoc.assignee || '') === String(user._id);
}
function populateQuery(q) { return q.populate('category','name color').populate('requester','name email').populate('assignee','name email').populate('comments.author','name'); }
router.get('/', asyncHandler(async (req,res) => {
  const page=Math.max(1,Number(req.query.page)||1), limit=Math.min(100,Math.max(1,Number(req.query.limit)||20));
  const filter={...scopeFor(req.user)};
  for (const key of ['status','priority']) if (req.query[key]) filter[key]=req.query[key];
  if (req.query.category) filter.category=req.query.category;
  if (req.query.q) filter.$text={$search:String(req.query.q).slice(0,100)};
  if (req.query.overdue==='true') { filter.dueAt={$lt:new Date()}; filter.status={$nin:['Resolved','Closed','Rejected']}; }
  const [items,total]=await Promise.all([populateQuery(Request.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit)),Request.countDocuments(filter)]);
  res.json({success:true,data:items, pagination:{page,limit,total,pages:Math.ceil(total/limit)}});
}));
router.post('/', authorize('Requester','Administrator'), [
  body('title').trim().isLength({min:4,max:160}),
  body('description').trim().isLength({min:10,max:10000}),
  body('category').isMongoId(),
  body('location').trim().isLength({min:2,max:300}),
  body('priority').optional().isIn(['Low','Medium','High','Critical'])
],validate, asyncHandler(async(req,res)=>{
  if (!['Requester','Administrator','Staff','Manager'].includes(req.user.role)) throw httpError(403,'Not authorised.');
  const category=await Category.findOne({_id:req.body.category,active:true});
  if(!category) throw httpError(400,'Select an active request category.');
  const now=new Date(), number=`REQ-${now.toISOString().slice(0,10).replaceAll('-','')}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
  const doc=await Request.create({number,title:req.body.title,description:req.body.description,category:category._id,location:req.body.location,priority:req.body.priority||'Medium',requester:req.user._id,department:req.user.department||null,events:[{type:'CREATED',label:'Request submitted',actor:req.user._id}]});
  await recordAudit(req,'REQUEST_CREATED','ServiceRequest',doc._id,{number:doc.number});
  res.status(201).json({success:true,data:await populateQuery(Request.findById(doc._id))});
}));
// Uploads are private: authentication and request-level scoping are checked before streaming files.
router.post('/:id/attachments', authorize('Requester','Administrator'), (req,res,next)=>{
  const middleware=upload.array('files',3);
  middleware(req,res,err=>err?next(err):next());
}, asyncHandler(async(req,res)=>{
  const cleanup=()=>Promise.all((req.files||[]).map(f=>fs.promises.unlink(f.path).catch(()=>{})));
  try {
    const doc=await Request.findOne({_id:req.params.id,...scopeFor(req.user)});
    if(!doc) throw httpError(404,'Request not found or not accessible.');
    if(!req.files?.length) throw httpError(400,'Select JPEG, PNG, WebP or PDF files (up to 5 MB each).');
    if(doc.attachments.length+req.files.length>3) throw httpError(400,'Maximum 3 attachments per request.');
    const attachments=req.files.map(file=>({originalName:path.basename(file.originalname).slice(0,150),storedName:file.filename,mimeType:file.mimetype,size:file.size}));
    doc.attachments.push(...attachments);
    await doc.save();
    await recordAudit(req,'REQUEST_ATTACHMENTS_ADDED','ServiceRequest',doc._id,{count:attachments.length});
    res.status(201).json({success:true,data:doc.attachments.map(({_id,originalName,mimeType,size})=>({_id,originalName,mimeType,size}))});
  } catch(err){await cleanup();throw err;}
}));
router.get('/:id/attachments/:attachmentId', asyncHandler(async(req,res)=>{
  const doc=await Request.findOne({_id:req.params.id,...scopeFor(req.user)});
  if(!doc) throw httpError(404,'Request not found.');
  const attachment=doc.attachments.id(req.params.attachmentId);
  if(!attachment) throw httpError(404,'Attachment not found.');
  const filename=path.join(uploadDir,attachment.storedName);
  if(!fs.existsSync(filename)) throw httpError(404,'Attachment file missing.');
  res.setHeader('Content-Type',attachment.mimeType);
  res.setHeader('Content-Disposition',`attachment; filename="${attachment.originalName.replace(/["\r\n]/g,'_')}"`);
  res.sendFile(filename);
}));
router.get('/:id', asyncHandler(async(req,res)=>{
  const doc=await populateQuery(Request.findOne({_id:req.params.id,...scopeFor(req.user)}));
  if(!doc) throw httpError(404,'Request not found.');
  const data=doc.toObject();
  if(req.user.role==='Requester') data.comments=data.comments.filter(c=>c.visibility==='Public');
  res.json({success:true,data});
}));
router.patch('/:id/status', authorize('Staff','Manager','Administrator'), [
  body('status').isIn(['Under Review','In Progress','Resolved','Closed','Rejected']),
  body('note').optional().isString().isLength({max:2000}),
  body('version').optional().isInt({min:0})
],validate, asyncHandler(async(req,res)=>{
  const doc=await Request.findOne({_id:req.params.id,...scopeFor(req.user)});
  if(!doc) throw httpError(404,'Request not found.');
  if(!canManage(doc,req.user)) throw httpError(403,'You may only update requests assigned to you or within your authorised department.');
  if(!canTransition(doc.status, req.body.status)) throw httpError(409,`Status transition from ${doc.status} to ${req.body.status} is not permitted.`);
  if(req.body.version !== undefined && req.body.version !== doc.version) throw httpError(409,'This request was updated by another user. Refresh and try again.');
  const old=doc.status, nextStatus=req.body.status, now=new Date();
  // Single-document atomic update with optimistic version check. Unlike a MongoDB
  // transaction, this also works when the local MongoDB server is a standalone.
  const updated=await Request.findOneAndUpdate(
    {_id:doc._id,version:doc.version,status:old},
    {$set:{status:nextStatus,...(['Resolved','Closed'].includes(nextStatus)?{resolvedAt:now}:{})},
     $inc:{version:1},
     $push:{events:{type:'STATUS_CHANGED',label:`Status changed to ${nextStatus}`,from:old,to:nextStatus,note:req.body.note||'',actor:req.user._id,createdAt:now}}},
    {new:true,runValidators:true}
  );
  if(!updated) throw httpError(409,'This request was updated by another user. Refresh and try again.');
  await recordAudit(req,'REQUEST_STATUS_CHANGED','ServiceRequest',doc._id,{from:old,to:nextStatus,note:req.body.note||''});
  res.json({success:true,data:await populateQuery(Request.findById(doc._id))});
}));
router.patch('/:id/priority', authorize('Staff', 'Manager', 'Administrator'), [
  body('priority').isIn(['Low', 'Medium', 'High', 'Critical'])
], validate, asyncHandler(async (req, res) => {
  const doc = await Request.findOne({ _id: req.params.id, ...scopeFor(req.user) });
  if (!doc) throw httpError(404, 'Request not found.');
  if (!canManage(doc, req.user)) throw httpError(403, 'Only the assigned staff member or an authorised manager/administrator can change priority.');
  if (doc.priority === req.body.priority) return res.json({ success: true, data: await populateQuery(Request.findById(doc._id)) });
  const updated = await Request.findOneAndUpdate(
    { _id: doc._id, version: doc.version },
    { $set: { priority: req.body.priority }, $inc: { version: 1 },
      $push: { events: { type: 'PRIORITY_CHANGED', label: `Priority changed to ${req.body.priority}`, from: doc.priority, to: req.body.priority, actor: req.user._id } } },
    { new: true, runValidators: true }
  );
  if (!updated) throw httpError(409, 'This request changed since you opened it. Refresh and try again.');
  await recordAudit(req, 'REQUEST_PRIORITY_CHANGED', 'ServiceRequest', doc._id, { from: doc.priority, to: req.body.priority });
  res.json({ success: true, data: await populateQuery(Request.findById(doc._id)) });
}));
router.patch('/:id/assignment', authorize('Manager','Administrator'), [
  body('assignee').optional({nullable:true}).isMongoId(),
  body('department').optional().isString().isLength({max:100})
],validate, asyncHandler(async(req,res)=>{
  const doc=await Request.findOne({_id:req.params.id,...scopeFor(req.user)});
  if(!doc) throw httpError(404,'Request not found.');
  if(req.user.role==='Manager' && (!req.user.department || req.user.department!==doc.department)) throw httpError(403,'Outside your department scope.');
  let assignee=null;
  if(req.body.assignee){assignee=await User.findOne({_id:req.body.assignee,active:true,role:{$in:['Staff','Manager']}});if(!assignee)throw httpError(400,'Assignee must be an active staff member or manager.');if(req.user.role==='Manager'&&assignee.department!==req.user.department)throw httpError(403,'You may assign staff only within your department.');}
  const previous=doc.assignee; doc.assignee=assignee?assignee._id:null;
  if(req.body.department && req.user.role==='Administrator') doc.department=req.body.department;
  doc.version+=1; doc.events.push({type:'ASSIGNED',label:assignee?`Assigned to ${assignee.name}`:'Assignment removed',from:previous?String(previous):null,to:assignee?String(assignee._id):null,actor:req.user._id});
  await doc.save(); await recordAudit(req,'REQUEST_ASSIGNED','ServiceRequest',doc._id,{assignee:assignee?.name||null,department:doc.department});
  res.json({success:true,data:await populateQuery(Request.findById(doc._id))});
}));
router.post('/:id/comments', [
  body('body').trim().isLength({min:1,max:3000}),
  body('visibility').optional().isIn(['Public','Internal'])
],validate, asyncHandler(async(req,res)=>{
  const doc=await Request.findOne({_id:req.params.id,...scopeFor(req.user)});
  if(!doc) throw httpError(404,'Request not found.');
  if(req.user.role==='Requester' && String(doc.requester)!==String(req.user._id)) throw httpError(403,'Not authorised.');
  if(req.user.role==='Staff' && !canManage(doc,req.user)) throw httpError(403,'Not authorised.');
  const visibility=req.user.role==='Requester'?'Public':(req.body.visibility||'Public');
  doc.comments.push({author:req.user._id,body:req.body.body,visibility}); doc.version+=1; await doc.save();
  await recordAudit(req,'REQUEST_COMMENT_ADDED','ServiceRequest',doc._id,{visibility});
  res.status(201).json({success:true,data:doc.comments[doc.comments.length-1]});
}));
module.exports=router;
