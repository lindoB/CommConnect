const router=require('express').Router();
const mongoose=require('mongoose');
router.get('/',(req,res)=>res.json({success:true,service:'CivicConnect API',status:'ok',time:new Date().toISOString(),database:mongoose.connection.readyState===1?'connected':'disconnected'}));
module.exports=router;
