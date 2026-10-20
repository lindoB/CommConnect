require('dotenv').config();
const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const User=require('../src/models/User');
const Category=require('../src/models/Category');
async function main(){
 if(!process.env.MONGODB_URI)throw new Error('Set MONGODB_URI in backend/.env first.');
 if(!process.env.SEED_ADMIN_EMAIL||!process.env.SEED_ADMIN_PASSWORD||!process.env.SEED_ADMIN_NAME)throw new Error('Set SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD and SEED_ADMIN_NAME before seeding.');
 if(process.env.SEED_ADMIN_PASSWORD.length<12)throw new Error('Seed admin password must be at least 12 characters.');
 await mongoose.connect(process.env.MONGODB_URI);
 const email=process.env.SEED_ADMIN_EMAIL.toLowerCase().trim();
 const exists=await User.findOne({email});
 if(exists)throw new Error('An account with SEED_ADMIN_EMAIL already exists; refusing to change it.');
 const user=await User.create({name:process.env.SEED_ADMIN_NAME,email,passwordHash:await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD,Number(process.env.BCRYPT_ROUNDS||12)),role:'Administrator'});
 const defaults=[
  {name:'Water & sanitation',description:'Leaks, water supply and sewer issues',color:'#dceefa'},
  {name:'Roads & potholes',description:'Road damage, potholes and signage',color:'#f9ead8'},
  {name:'Electricity',description:'Streetlights and power infrastructure',color:'#f8edc9'},
  {name:'Waste management',description:'Missed collections and illegal dumping',color:'#dcefe5'},
  {name:'Parks & public spaces',description:'Public facilities and green spaces',color:'#e8e3f8'}
 ];
 for(const c of defaults)await Category.updateOne({name:c.name},{$setOnInsert:c},{upsert:true});
 console.log(`Created administrator ${user.email}; ensured ${defaults.length} default categories.`);
 await mongoose.disconnect();
}
main().catch(async e=>{console.error(e.message);await mongoose.disconnect().catch(()=>{});process.exit(1);});
