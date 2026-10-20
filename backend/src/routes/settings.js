const router=require('express').Router();
const SystemSetting=require('../models/SystemSetting');
const {authenticate,authorize}=require('../middleware/auth');
const asyncHandler=require('../utils/asyncHandler');
const {recordAudit}=require('../services/auditService');
router.get('/public-alert',asyncHandler(async(req,res)=>{
 const [downtime,fallback]=await Promise.all([SystemSetting.findOne({key:'downtime'}).lean(),SystemSetting.findOne({key:'fallbackFormUrl'}).lean()]);
 const value=downtime?.value||{};
 res.json({success:true,data:{isActive:value.isActive===true,title:value.title||'',message:value.message||'',severity:value.severity||'High',detectedAt:value.detectedAt||null,estimatedRecovery:value.estimatedRecovery||'Unknown',fallbackFormUrl:fallback?.value||''}});
}));
router.use(authenticate);
router.get('/',authorize('Administrator'),asyncHandler(async(req,res)=>{
 const docs=await SystemSetting.find().lean();const settings={};
 for(const d of docs)settings[d.key]=d.value;
 res.json({success:true,data:settings});
}));
router.put('/:key',authorize('Administrator'),asyncHandler(async(req,res)=>{
 const allowed=['dataSourceMode','downtime','fallbackFormUrl','systemSettings'];
 if(!allowed.includes(req.params.key))return res.status(400).json({success:false,message:'Unsupported setting key.'});
 if(req.params.key==='dataSourceMode'&&!['dummy','mongodb','both'].includes(req.body.value))return res.status(400).json({success:false,message:'Invalid data source mode.'});
 if(req.params.key==='fallbackFormUrl'&&req.body.value&&!/^https:\/\/(docs\.google\.com\/forms|forms\.gle)\//i.test(req.body.value))return res.status(400).json({success:false,message:'Fallback URL must be a Google Forms URL using HTTPS.'});
 const doc=await SystemSetting.findOneAndUpdate({key:req.params.key},{$set:{value:req.body.value,updatedBy:req.user._id}},{upsert:true,new:true,runValidators:true});
 await recordAudit(req,'SETTING_UPDATED','SystemSetting',doc._id,{key:doc.key});
 res.json({success:true,data:{key:doc.key,value:doc.value}});
}));
module.exports=router;
