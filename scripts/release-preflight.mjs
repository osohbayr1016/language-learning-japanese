import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export const ACCOUNT_ID='aabe952df5d4e4b780339bf3b4217ed7';
export const DATABASE_ID='696b88cc-4d5a-4751-b25f-49cc2acfd475';
export async function checkpoint({token,fetcher=fetch}={}){
 if(!token)throw Error('CLOUDFLARE_API_TOKEN is required; no database changes were made.');
 const get=async path=>{
  const response=await fetcher('https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT_ID+path,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});
  const result=await response.json();
  if(!response.ok||result.success!==true)throw Error('Cloudflare preflight denied: '+response.status+' (check token access to Workers and the Japanese D1 account).');
  return result.result;
 };
 const database=await get('/d1/database/'+DATABASE_ID);
 if(database.name!=='nihongo-mn-db')throw Error('Database identity differs from the dedicated Japanese database.');
 const secrets=await get('/workers/scripts/nihongo-mn-api/secrets');
 const names=new Set(Array.isArray(secrets)?secrets.map(item=>item.name):[]);
 if(!names.has('JWT_SECRET'))throw Error('JWT_SECRET must exist on nihongo-mn-api before deployment. Existing credentials were not changed.');
 const point=await get('/d1/database/'+DATABASE_ID+'/time_travel/bookmark');
 if(typeof point?.bookmark!=='string'||!/^[a-zA-Z0-9-]{20,200}$/.test(point.bookmark))throw Error('A valid D1 restore point could not be verified.');
 return {account:ACCOUNT_ID,database:DATABASE_ID,bookmark:point.bookmark,recordedAt:new Date().toISOString(),commit:process.env.GITHUB_SHA??null};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const point=await checkpoint({token:process.env.CLOUDFLARE_API_TOKEN});
 writeFileSync('release-checkpoint.json',JSON.stringify(point,null,2));
 console.log('Verified Japanese database, signing-secret presence and a D1 Time Travel restore point. No credential values or user rows are exported.');
}
