const router=require('express').Router();
const {body,validationResult}=require('express-validator');
const Category=require('../models/Category');
const {authenticate,authorize}=require('../middleware/auth');
const asyncHandler=require('../utils/asyncHandler');
const {recordAudit}=require('../services/auditService');
router.use(authenticate);
router.get('/',asyncHandler(async(req,res)=>{const filter=req.user.role==='Administrator'?{}:{active:true};res.json({success:true,data:await Category.find(filter).sort({name:1})});}));
router.post('/',authorize('Administrator'),body('name').trim().isLength({min:2,max:80}),body('description').optional().isString().isLength({max:300}),asyncHandler(async(req,res)=>{
 const e=validationResult(req);if(!e.isEmpty())return res.status(400).json({success:false,errors:e.array()});
 const data=await Category.create({name:req.body.name,description:req.body.description||'',color:req.body.color||'#dceefa'});
 await recordAudit(req,'CATEGORY_CREATED','Category',data._id,{name:data.name});res.status(201).json({success:true,data});
}));
router.patch('/:id',authorize('Administrator'),asyncHandler(async(req,res)=>{
 const data=await Category.findByIdAndUpdate(req.params.id,{$set:{...(req.body.name!==undefined?{name:req.body.name}:{}),...(req.body.description!==undefined?{description:req.body.description}:{}),...(req.body.active!==undefined?{active:Boolean(req.body.active)}:{}),...(req.body.color!==undefined?{color:req.body.color}:{})}},{new:true,runValidators:true});
 if(!data)return res.status(404).json({success:false,message:'Category not found.'});
 await recordAudit(req,'CATEGORY_UPDATED','Category',data._id,{name:data.name,active:data.active});res.json({success:true,data});
}));
module.exports=router;
