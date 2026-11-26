import {spawnSync} from 'node:child_process';
import {readdir,readFile} from 'node:fs/promises';
const result=spawnSync(process.execPath,['eval/run-eval.mjs'],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
const names=(await readdir('eval/reports')).filter(n=>/^lingograb-eval-\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort();
const report=JSON.parse(await readFile('eval/reports/'+names.at(-1),'utf8'));
if(!report.routing.total||report.routing.failures.length)throw Error('Routing regressions: '+JSON.stringify(report.routing.failures));
console.log('Routing gate: '+report.routing.total+' cases passed');
