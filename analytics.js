/* Programmatic Notes — tiny analytics client.
   Sends events straight to Supabase's REST API. Does nothing if config.js has no keys. */
(function(){
  var cfg=window.PN_CONFIG||{};
  var url=(cfg.supabaseUrl||'').replace(/\/+$/,''), key=cfg.supabaseKey||'';
  var enabled=!!(url&&key);
  function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(e){return null}}
  function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);sessionStorage.setItem(k,v);}catch(e){return null}}
  function uid(){return (crypto&&crypto.randomUUID)?crypto.randomUUID():'v'+Date.now().toString(36)+Math.random().toString(36).slice(2,10)}
  var visitor=ls('pn-visitor');if(!visitor){visitor=uid();ls('pn-visitor',visitor);}
  var session=ss('pn-session');var isNew=!session;if(!session){session=uid();ss('pn-session',session);}
  function who(){var w={};try{w=JSON.parse(ls('pn-who')||'{}')}catch(e){}return w;}
  function setWho(name,batch){if(!name&&!batch)ls('pn-who',null);else ls('pn-who',JSON.stringify({name:name,batch:batch}));track('identify');}
  var lastView={};
  function track(event,o){
    if(!enabled)return;o=o||{};
    if(event==='module_view'){var now=Date.now();if(lastView.m===o.module&&now-lastView.t<3000)return;lastView={m:o.module,t:now};}
    var w=who();
    var row={visitor_id:visitor,session_id:session,name:w.name||null,batch:w.batch||null,event:event,module:o.module||null,
      score:(typeof o.score==='number')?o.score:null,total:(typeof o.total==='number')?o.total:null,meta:o.meta||null,
      device:(window.innerWidth<700?'mobile':'desktop')};
    var h={'apikey':key,'Content-Type':'application/json','Prefer':'return=minimal'};
    if(/^eyJ/.test(key))h['Authorization']='Bearer '+key; // legacy anon JWT key
    try{fetch(url+'/rest/v1/events',{method:'POST',headers:h,body:JSON.stringify(row),keepalive:true}).catch(function(){});}catch(e){}
  }
  window.PN={enabled:enabled,track:track,who:who,setWho:setWho};
  if(isNew)track('visit',{meta:{ref:document.referrer||null}});
})();
