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

  // Location for the visit: city / region / country only (no IP or coordinates are stored).
  var GEO_URL='https://get.geojs.io/v1/ip/geo.json',GEO_TIMEOUT_MS=4000;
  function clip(v){return v?String(v).slice(0,60):null}
  function lookupPlace(){
    var tz=null;try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||null}catch(e){}
    var base={ref:document.referrer||null,tz:tz};
    if(!window.fetch)return Promise.resolve(base);
    var timeout=new Promise(function(res){setTimeout(function(){res(null)},GEO_TIMEOUT_MS)});
    var geo=fetch(GEO_URL).then(function(r){return r.ok?r.json():null}).catch(function(){return null});
    return Promise.race([geo,timeout]).then(function(g){
      if(!g)return base;
      return {ref:base.ref,tz:base.tz,country:clip(g.country),region:clip(g.region),city:clip(g.city)};
    });
  }
  if(isNew&&enabled)lookupPlace().then(function(meta){track('visit',{meta:meta})});

  // Session length: seconds this tab was visible, kept in sessionStorage so auto-reloads continue the same session.
  var HEARTBEAT_MS=60000;
  var activeBefore=+(ss('pn-active')||0)||0,visibleSince=document.visibilityState==='hidden'?0:Date.now();
  function activeSeconds(){return Math.round(activeBefore+(visibleSince?(Date.now()-visibleSince)/1000:0))}
  function pauseClock(){if(!visibleSince)return;activeBefore+=(Date.now()-visibleSince)/1000;visibleSince=0;ss('pn-active',String(activeBefore))}
  function beat(){var s=activeSeconds();if(s>0)track('heartbeat',{meta:{active_s:s}})}
  if(enabled){
    setInterval(function(){if(visibleSince){ss('pn-active',String(activeSeconds()));beat()}},HEARTBEAT_MS);
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'){pauseClock();beat()}else if(!visibleSince)visibleSince=Date.now()});
    window.addEventListener('pagehide',function(){pauseClock();beat()});
  }
})();
