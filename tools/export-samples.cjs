const fs=require('node:fs'),path=require('node:path');
const PDF=require('../public/shared/pdf.js'),D=require('../public/shared/domain.js');
(async()=>{const folder=path.resolve(__dirname,'../exports');fs.mkdirSync(folder,{recursive:true});for(const sample of require('../public/samples.json')){const file=path.join(folder,D.slug(sample.title)+'.pdf');fs.writeFileSync(file,await PDF.create(D.validate(sample),{reviewed:false}));console.log(file);}})().catch(e=>{console.error(e);process.exitCode=1;});
