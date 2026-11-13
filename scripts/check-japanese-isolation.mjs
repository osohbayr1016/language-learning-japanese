import {readdirSync,readFileSync} from 'node:fs';import {join} from 'node:path';
const roots=['src','apps/mobile/src','apps/mobile/app','apps/api/src','packages/types'];const failures=[];
const pattern=/\b(?:hsk(?:[1-6_]|\b)|pinyin\b|hanzi\b|chineseLevel\b|title_cn\b|title_zh\b|example_zh\b|zh-CN\b)|hanzi-writer-data|chinese-learning-(?:db|api|assets)/i;
for(const root of roots)walk(root);
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory()){walk(path);continue}if(!/\.tsx?$/.test(path)||path.endsWith('lessonContentValidation.ts'))continue;const source=readFileSync(path,'utf8');source.split('\n').forEach((line,i)=>{if(pattern.test(line))failures.push(`${path}:${i+1}: ${line.trim()}`)})}}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}else console.log('Japanese isolation: active schemas, routes, voices and stroke sources are clean.');
