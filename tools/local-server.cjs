const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const handler=require('../api/[action].js');
const root=path.resolve(__dirname,'../public');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.pdf':'application/pdf'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/')){let raw='';try{for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>300000){res.writeHead(413,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'Conteúdo muito grande.'}));}}req.body=raw||{};return handler(req,res);}catch{res.writeHead(400);return res.end('Invalid request');}}
 let file;try{file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));}catch{res.writeHead(400);return res.end();}
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end('Not found');}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);
});
if(require.main===module)server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Allbooks em http://localhost:'+(Number(process.env.PORT)||3000)));
module.exports=server;
