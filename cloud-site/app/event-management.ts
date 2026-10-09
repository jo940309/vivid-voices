// @ts-nocheck
import {env} from 'cloudflare:workers';
import {randomBytes} from 'node:crypto';
export function calculateChampion(state){
  if(state.rounds.length!==6||state.rounds.some(r=>r.status!=='settled'))throw Object.assign(Error('請先結算全部六輪競賽'),{status:400});
  const totals=state.totals;
  const highest=Math.max(...totals.map(t=>t.total));
  return {totals,winners:totals.filter(t=>t.total===highest).map(t=>t.name),settledAt:Date.now()};
}
export async function championResult(){const r=await env.DB.prepare("SELECT value FROM event_settings WHERE key='champion'").first();return r?JSON.parse(r.value):null;}
export async function archives(){return (await env.DB.prepare('SELECT id,created FROM event_archives ORDER BY created DESC').all()).results;}
export async function isResetting(){const r=await env.DB.prepare("SELECT value FROM event_settings WHERE key='maintenance'").first();return !!r?.value;}
export async function finalize(state){const champion=calculateChampion(state);await env.DB.prepare("INSERT INTO event_settings VALUES('champion',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(champion)).run();return champion;}
export async function resetEvent(body,getState){
  if(body.confirm!=='重設投票'||typeof body.resetTeams!=='boolean')throw Object.assign(Error('請輸入「重設投票」以確認'),{status:400});
  const id=randomBytes(16).toString('hex');
  const lock=await env.DB.prepare("INSERT INTO event_settings VALUES('maintenance',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE event_settings.value=''").bind(id).run();
  if(!lock.meta.changes)throw Object.assign(Error('活動正在重設，請稍後'),{status:409});
  try{
    await env.DB.prepare("UPDATE rounds SET status='closed' WHERE status='open'").run();
    const snapshot={format:1,created:Date.now(),state:await getState(),votes:(await env.DB.prepare('SELECT round,voter,team FROM votes').all()).results};
    const objectKey='archives/'+id+'.json';
    await env.BUCKET.put(objectKey,JSON.stringify(snapshot),{httpMetadata:{contentType:'application/json'}});
    const commands=[env.DB.prepare('INSERT INTO event_archives VALUES(?,?,?)').bind(id,snapshot.created,objectKey),env.DB.prepare('DELETE FROM votes'),env.DB.prepare("UPDATE rounds SET status='ready',winner=NULL"),env.DB.prepare("DELETE FROM event_settings WHERE key='champion'")];
    if(body.resetTeams){const groups=['草莓','檸檬','肉桂'];for(let g=0;g<3;g++)for(let p=1;p<=6;p++)commands.push(env.DB.prepare('UPDATE teams SET group_id=?,position=?,name=?,song=?,members=?,photo=? WHERE id=?').bind(g,p,groups[g]+'第'+p+'小組','待填歌曲','待填成員','',g*6+p));}
    await env.DB.batch(commands);
    return {ok:true,archiveId:id};
  }finally{await env.DB.prepare("UPDATE event_settings SET value='' WHERE key='maintenance' AND value=?").bind(id).run();}
}
export async function readArchive(id){
  const row=await env.DB.prepare('SELECT object_key FROM event_archives WHERE id=?').bind(id).first();
  if(!row)throw Object.assign(Error('紀錄不存在'),{status:404});
  const object=await env.BUCKET.get(row.object_key);
  if(!object)throw Object.assign(Error('備份檔案不存在'),{status:404});
  return new Response(object.body,{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="event-${id}.json"`,'Cache-Control':'no-store'}});
}
