const {test}=require('node:test');const assert=require('node:assert/strict');
const {handle}=require('../lib/backend.cjs');const sample=require('../public/samples.json')[0];
const uid='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',pid='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
test('autorização, propriedade e revisão são conferidas antes de escrever',async t=>{
 const savedFetch=global.fetch,oldURL=process.env.SUPABASE_URL,oldKey=process.env.SUPABASE_SECRET_KEY;
 process.env.SUPABASE_URL='https://testing.invalid';process.env.SUPABASE_SECRET_KEY='sb_secret_test_only';
 try{
  let writes=0;
  const response=data=>new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
  global.fetch=async(url,options)=>{if(options.method&&options.method!=='GET')writes++;if(String(url).includes('/auth/v1/user'))return response({id:uid,user_metadata:{role:'admin'}});return response([]);};
  await assert.rejects(handle('projects',{token:'test'}),e=>e.status===403);assert.equal(writes,0);
  await t.test('user_metadata não concede acesso',()=>assert.equal(writes,0));
  global.fetch=async(url,options)=>{if(options.method&&options.method!=='GET')writes++;if(String(url).includes('/auth/v1/user'))return response({id:uid});if(String(url).includes('ebook_admins'))return response([{user_id:uid}]);assert.ok(String(url).includes('owner_id=eq.'+uid));return response([]);};
  await assert.rejects(handle('review',{method:'POST',token:'test',body:{id:pid,revision:1,quality:true,rights:true}}),e=>e.status===404);assert.equal(writes,0);
  global.fetch=async(url,options)=>{if(options.method&&options.method!=='GET')writes++;if(String(url).includes('/auth/v1/user'))return response({id:uid});if(String(url).includes('ebook_admins'))return response([{user_id:uid}]);return response([{id:pid,book:sample,revision:2,status:'draft'}]);};
  await assert.rejects(handle('publish',{method:'POST',token:'test',body:{id:pid,revision:2}}),e=>e.status===409);
  await assert.rejects(handle('review',{method:'POST',token:'test',body:{id:pid,revision:1,quality:true,rights:true}}),e=>e.status===409);assert.equal(writes,0);
 }finally{global.fetch=savedFetch;if(oldURL===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=oldURL;if(oldKey===undefined)delete process.env.SUPABASE_SECRET_KEY;else process.env.SUPABASE_SECRET_KEY=oldKey;}
});
