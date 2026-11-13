import {pathToFileURL} from 'node:url';
export async function verifyApi({base='https://nihongo-mn-api.osohoo691016.workers.dev',sha,fetcher=fetch}={}){
 const response=await fetcher(base+'/health',{signal:AbortSignal.timeout(20000),cache:'no-store'});
 const data=await response.json();
 if(!response.ok||data.status!=='ok'||data.course_schema!==4)throw Error('API schema 4 is required before web rollout.');
 if(sha&&data.release!==sha)throw Error('The deployed API does not match the release commit.');
 return data;
}
export async function verifyWeb({base='https://nihongo-mn-web.osohoo691016.workers.dev',sha,fetcher=fetch}={}){
 const get=async path=>{const r=await fetcher(base+path,{signal:AbortSignal.timeout(20000),cache:'no-store'});if(!r.ok)throw Error('Web release check failed: '+path);return r;};
 const release=await(await get('/release.json')).json();
 if(sha&&release.sha!==sha)throw Error('The deployed website does not match the release commit.');
 const html=await(await get('/course')).text();
 if(!html.includes('lang="mn"')||!html.includes('/assets/'))throw Error('The guided course shell was not served.');
 const manifest=await(await get('/manifest.webmanifest')).json();
 if(manifest.start_url!=='/course')throw Error('PWA must start in the guided course.');
 const offline=await(await get('/offline-manifest.json')).json();
 if(!Array.isArray(offline.files)||!offline.files.includes('/dictionary/kanji.json')||offline.files.some(path=>path.startsWith('/api/')))throw Error('Offline pack contract is invalid.');
 return release;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const sha=process.env.GITHUB_SHA;
 await verifyApi({sha});
 if(!process.argv.includes('--api-only')){
  await verifyWeb({sha});
  const response=await fetch('https://nihongo-mn-api.osohoo691016.workers.dev/api/user/course',{signal:AbortSignal.timeout(20000)});
  if(response.status!==401)throw Error('Anonymous course-sync access must be denied.');
  const flags=await(await fetch('https://nihongo-mn-api.osohoo691016.workers.dev/api/auth/capabilities',{signal:AbortSignal.timeout(20000)})).json();
  console.log('Optional service availability:',JSON.stringify(flags.data));
 }
 console.log('Release smoke checks passed for '+sha);
}
