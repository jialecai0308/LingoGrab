import {mkdir, readdir, readFile, writeFile, copyFile, lstat, rm} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const sources = [["index.html","site/index.html"],["admin.html","site/admin.html"],["assets","site/assets"],["data","site/data"],["favicon.svg","site/favicon.svg"],["robots.txt","site/robots.txt"],["sitemap.xml","site/sitemap.xml"],["site.webmanifest","site/site.webmanifest"],["middleware.js","site/middleware.js"]];
const root = process.cwd(), out = path.join(root, 'delivery');
await rm(out, {recursive:true, force:true});
await mkdir(out, {recursive:true});
const files = [];
async function copy(source, destination) {
  const absolute = path.join(root, source), stat = await lstat(absolute);
  if (stat.isSymbolicLink()) throw Error('Delivery cannot contain symlinks: '+source);
  if (stat.isDirectory()) {
    for (const name of (await readdir(absolute)).sort()) await copy(path.join(source,name),path.join(destination,name));
    return;
  }
  if (!stat.isFile() || /(^|\/)(\.env(?:\..*)?|\.git|node_modules|\.DS_Store)$|\.(log|pem|key)$/i.test(source))
    throw Error('Unexpected delivery file: '+source);
  const bytes = await readFile(absolute);
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9]{32,}/.test(bytes.toString('utf8')))
    throw Error('Potential credential in delivery: '+source);
  const target = path.join(out,destination);
  await mkdir(path.dirname(target),{recursive:true}); await copyFile(absolute,target);
  files.push({path:destination.split(path.sep).join('/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
for (const [source,destination] of sources) await copy(source,destination);
const commit = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const tree = execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim();
const manifest = {schemaVersion:1,commit,tree,published:false,releaseGate:'Explicit production approval and deployment SHA verification required',runUrl:process.env.GITHUB_ACTIONS?'https://github.com/'+process.env.GITHUB_REPOSITORY+'/actions/runs/'+process.env.GITHUB_RUN_ID:null,files:files.sort((a,b)=>a.path.localeCompare(b.path))};
await writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({commit,files:files.length,published:false,output:'delivery/'}));
