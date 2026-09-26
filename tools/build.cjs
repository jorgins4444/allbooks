const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
fs.rmSync(path.join(root, 'dist'), {recursive:true, force:true});
fs.cpSync(path.join(root, 'public'), path.join(root, 'dist'), {recursive:true});
console.log('Interface estática preparada em dist. Funções disponíveis em api.');
