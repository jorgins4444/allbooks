const {handle,HttpError}=require('../lib/backend.cjs');
module.exports=async function(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 try{
  let body=req.body||{};if(typeof body==='string'){try{body=JSON.parse(body);}catch{throw new HttpError(400,'JSON inválido.');}}
  if(Buffer.byteLength(JSON.stringify(body))>300000)throw new HttpError(413,'Conteúdo muito grande.');
  if(!body||typeof body!=='object'||Array.isArray(body))throw new HttpError(400,'Conteúdo inválido.');
  const url=new URL(req.url,'https://allbooks.local');const action=typeof req.query?.action==='string'?req.query.action:url.pathname.split('/').pop();
  const result=await handle(action,{method:req.method,token:(req.headers.authorization||'').replace(/^Bearer\s+/i,''),body,query:Object.fromEntries(url.searchParams)});
  if(result.redirect){res.statusCode=302;res.setHeader('Location',result.redirect);return res.end();}
  res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(result));
 }catch(e){res.statusCode=e.status||500;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify({error:e.status?e.message:'Não foi possível concluir a operação. Tente novamente.'}));}
};
