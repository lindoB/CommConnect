require('dotenv').config();
const app=require('./app');
const {connectDatabase}=require('./config/db');
const PORT=Number(process.env.PORT||5000);
let server;
async function start(){
  await connectDatabase();
  server=app.listen(PORT,()=>console.log(`CivicConnect API listening on port ${PORT}`));
}
async function shutdown(signal){
  console.log(`${signal} received; shutting down.`);
  if(server)server.close(()=>{require('mongoose').connection.close(false).finally(()=>process.exit(0));});
  else process.exit(0);
  setTimeout(()=>process.exit(1),10000).unref();
}
process.on('SIGTERM',()=>shutdown('SIGTERM'));
process.on('SIGINT',()=>shutdown('SIGINT'));
start().catch(err=>{console.error('Startup failed:',err.message);process.exit(1);});
