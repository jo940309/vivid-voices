export function pageLoading(target,label='載入中…'){
  target.innerHTML=`<div class="loading-state" role="status" aria-live="polite"><span class="spinner" aria-hidden="true"></span><span>${label}</span></div>`;
  target.setAttribute('aria-busy','true');
}
export async function withBusy(button,label,work){
  if(button?.disabled)return;
  const text=button?.innerHTML;
  if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.innerHTML=`<span class="spinner" aria-hidden="true"></span>${label}`;}
  try{return await work();}finally{if(button){button.innerHTML=text;button.disabled=false;button.removeAttribute('aria-busy');}}
}
