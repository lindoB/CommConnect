const router=require('express').Router();
const Request=require('../models/ServiceRequest');
const AuditLog=require('../models/AuditLog');
const {authenticate,authorize}=require('../middleware/auth');
const asyncHandler=require('../utils/asyncHandler');
router.use(authenticate);
function scope(user){if(user.role==='Administrator')return {};if(user.role==='Requester')return {requester:user._id};if(user.role==='Staff')return {$or:[{assignee:user._id},{requester:user._id}]};return user.department?{department:user.department}:{_id:null};}
router.get('/summary',authorize('Manager','Administrator'),asyncHandler(async(req,res)=>{
 const match=scope(req.user), now=new Date();
 const [total,byStatus,byCategory,overdue,recent]=await Promise.all([
 Request.countDocuments(match),
 Request.aggregate([{$match:match},{$group:{_id:'$status',count:{$sum:1}}},{$sort:{_id:1}}]),
 Request.aggregate([{$match:match},{$lookup:{from:'categories',localField:'category',foreignField:'_id',as:'category'}},{$unwind:{path:'$category',preserveNullAndEmptyArrays:true}},{$group:{_id:'$category.name',count:{$sum:1}}},{$sort:{count:-1}}]),
 Request.countDocuments({...match,dueAt:{$lt:now},status:{$nin:['Resolved','Closed','Rejected']}}),
 Request.countDocuments({...match,createdAt:{$gte:new Date(Date.now()-7*86400000)}})
 ]);
 res.json({success:true,data:{total,overdue,createdLast7Days:recent,byStatus:byStatus.map(x=>({status:x._id,count:x.count})),byCategory:byCategory.map(x=>({category:x._id||'Uncategorised',count:x.count}))}});
}));
router.get('/audit',authorize('Administrator'),asyncHandler(async(req,res)=>{
 const page=Math.max(1,Number(req.query.page)||1),limit=Math.min(100,Math.max(1,Number(req.query.limit)||50));
 const filter={};if(req.query.action)filter.action=req.query.action;if(req.query.entityType)filter.entityType=req.query.entityType;
 const [data,total]=await Promise.all([AuditLog.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),AuditLog.countDocuments(filter)]);
 res.json({success:true,data,pagination:{page,limit,total,pages:Math.ceil(total/limit)}});
}));
module.exports=router;
