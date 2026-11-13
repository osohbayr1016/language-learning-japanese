import {readdirSync,statSync} from 'node:fs';
const files=readdirSync('dist/assets').filter(f=>f.endsWith('.js')).map(file=>({file,size:statSync('dist/assets/'+file).size})).sort((a,b)=>b.size-a.size);if(!files.length||files[0].size>600000)throw Error('Missing production JS or chunk exceeds 600 KB');console.log('Largest JS chunk:',files[0]);
