import assert from 'node:assert/strict';
const base='http://127.0.0.1:8787';
async function call(p,b,c){const r=await fetch(base+'/api/'+p,{method:b?'POST':'GET',headers:{...(b?{'Content-Type':'application/json'}:{}),...(c?{Cookie:c}:{})},body:b?JSON.stringify(b):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
assert.equal((await call('admin/finalize',{})).status,401);
assert.equal((await call('admin/reset',{confirm:'重設投票',resetTeams:true})).status,401);
const admin=(await call('admin/login',{password:process.env.ADMIN_PASSWORD})).cookie;
assert.ok(admin);
assert.equal((await call('admin/reset',{confirm:'錯誤',resetTeams:false},admin)).status,400);
let reset=await call('admin/reset',{confirm:'重設投票',resetTeams:false},admin);assert.equal(reset.status,200);
assert.equal((await call('admin/finalize',{},admin)).status,400);
let state=(await call('admin/state',null,admin)).data;
const original=state.teams.find(t=>t.id===6);
await call('admin/team',{...original,name:'測試資料保留'},admin);
const ids=state.teams.filter(t=>t.group_id===0).map(t=>t.id).reverse();
await call('admin/order',{ids},admin);
const winners=[0,1,2,0,1,2];
for(let i=1;i<=6;i++){
  await call('admin/round',{id:i,action:'open'},admin);
  state=(await call('admin/state',null,admin)).data;
  const teams=state.rounds[i-1].teams,win=teams.find(t=>t.group_id===winners[i-1]);
  for(let v=0;v<3;v++){
    const chosen=(v<2||i===3)?win:teams.find(t=>t.group_id!==winners[i-1]);
    assert.equal((await call('vote',{round:i,team:chosen.id},'voter_session=event-test-'+v)).status,200);
  }
  assert.equal((await call('vote',{round:i,team:win.id},'voter_session=event-test-0')).status,409);
  assert.equal((await call('admin/round',{id:i,action:'settle'},admin)).status,200);
}
let final=await call('admin/finalize',{},admin);assert.equal(final.status,200);
assert.deepEqual(final.data.champion.totals.map(t=>t.total),[4,4,5]);
assert.deepEqual(final.data.champion.winners,['肉桂']);
const publicState=(await call('state')).data;
assert.equal(publicState.champion,undefined);assert.deepEqual(publicState.totals,[]);
assert.ok(publicState.rounds.every(r=>r.winner===null&&r.counts.length===0));
assert.deepEqual((await call('admin/finalize',{},admin)).data.champion.totals.map(t=>t.total),[4,4,5]);
reset=await call('admin/reset',{confirm:'重設投票',resetTeams:false},admin);
assert.equal(reset.status,200);
assert.equal((await call('admin/archive/'+reset.data.archiveId)).status,401);
const backup=(await call('admin/archive/'+reset.data.archiveId,null,admin)).data;
assert.equal(backup.votes.length,18);assert.deepEqual(backup.state.champion.winners,['肉桂']);
state=(await call('admin/state',null,admin)).data;
assert.equal(state.champion,null);assert.ok(state.rounds.every(r=>r.status==='ready'&&!r.winner));
assert.equal(state.teams.find(t=>t.id===6).name,'測試資料保留');assert.equal(state.teams.find(t=>t.id===6).position,1);
assert.deepEqual(state.totals.map(t=>t.total),[0,0,0]);
for(let i=1;i<=6;i++){
  await call('admin/round',{id:i,action:'open'},admin);
  state=(await call('admin/state',null,admin)).data;
  const win=state.rounds[i-1].teams.find(t=>t.group_id===winners[i-1]);
  assert.equal((await call('vote',{round:i,team:win.id},'voter_session=event-test-0')).status,200);
  await call('admin/round',{id:i,action:'settle'},admin);
}
final=await call('admin/finalize',{},admin);assert.deepEqual(final.data.champion.winners,['草莓','檸檬','肉桂']);
await call('admin/reset',{confirm:'重設投票',resetTeams:true},admin);
state=(await call('admin/state',null,admin)).data;
assert.equal(state.teams.find(t=>t.id===6).name,'草莓第6小組');assert.equal(state.teams.find(t=>t.id===6).position,6);
assert.ok(state.rounds.every(r=>r.status==='ready'));assert.equal(state.champion,null);
console.log('通過：私有總冠軍、僅勝者計分、平手、重複投票、重設確認、資料保留、完整重設與備份下載。');
