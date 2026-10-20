const router=require('express').Router();
const {body,validationResult}=require('express-validator');
const Notification=require('../models/Notification');
const {authenticate,authorize}=require('../middleware/auth');
const asyncHandler=require('../utils/asyncHandler');
const {recordAudit}=require('../services/auditService');
router.use(authenticate);
router.get('/',asyncHandler(async(req,res)=>{
 const now=new Date();let filter={status:'Published',startAt:{$lte:now},$or:[{expiresAt:null},{expiresAt:{$gt:now}}]};
 if(req.user.role==='Administrator')filter={};
 if(req.user.role==='Staff')filter.audience={$in:['Everyone','Staff']};
 if(req.user.role==='Manager')filter.audience={$in:['Everyone','Managers']};
 if(req.user.role==='Requester')filter.audience={$in:['Everyone','Requesters']};
 res.json({success:true,data:await Notification.find(filter).sort({startAt:-1}).limit(100).lean()});
}));
router.post('/',authorize('Administrator'),body('title').trim().isLength({min:3,max:160}),body('message').trim().isLength({min:3,max:5000}),asyncHandler(async(req,res)=>{
 const e=validationResult(req);if(!e.isEmpty())return res.status(400).json({success:false,errors:e.array()});
 const doc=await Notification.create({...req.body,createdBy:req.user._id,updatedBy:req.user._id});
 await recordAudit(req,'NOTIFICATION_CREATED','Notification',doc._id,{title:doc.title,status:doc.status});res.status(201).json({success:true,data:doc});
}));
router.patch('/:id',authorize('Administrator'),asyncHandler(async(req,res)=>{
 const doc=await Notification.findById(req.params.id);if(!doc)return res.status(404).json({success:false,message:'Notification not found.'});
 const allowed=['title','message','category','priority','audience','status','startAt','expiresAt'];
 for(const k of allowed)if(req.body[k]!==undefined)doc[k]=req.body[k];
 doc.updatedBy=req.user._id;await doc.save();await recordAudit(req,'NOTIFICATION_UPDATED','Notification',doc._id,{status:doc.status});
 res.json({success:true,data:doc});
}));
module.exports=router;
