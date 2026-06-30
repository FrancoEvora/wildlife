
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const brl=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(v||0));
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f));}catch(e){return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const dist=(a,b,c,d)=>{const R=6371000,toRad=x=>x*Math.PI/180;const dLat=toRad(c-a),dLng=toRad(d-b);const s=Math.sin(dLat/2)**2+Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(s));};
function toast(msg){let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';document.body.appendChild(el)}el.textContent=msg;el.classList.add('show');clearTimeout(window.__t);window.__t=setTimeout(()=>el.classList.remove('show'),2500)}
function modal(html){let m=$('#modal');if(!m){m=document.createElement('div');m.id='modal';m.className='modal';document.body.appendChild(m)}m.innerHTML=`<div class="modal-card">${html}</div>`;m.classList.add('show');$$('[data-close]',m).forEach(b=>b.onclick=()=>m.classList.remove('show'))}
const logo='assets/futura-casa-logo-v1-1.webp';
function lotName(l){return `Solaris Home Resort · Quadra ${l.quadra} · Lote ${l.lote}`}
function mapsUrl(l){const dest=`${lotName(l)} @ ${l.lat},${l.lng}`;return `https://www.google.com/maps/dir/?${new URLSearchParams({api:'1',destination:dest,travelmode:'driving'}).toString()}`}
function openRoute(id){const l=FC.lots.find(x=>x.id===id);if(!l)return;const url=mapsUrl(l);const w=window.open(url,'_blank','noopener');if(!w)location.href=url;toast('Abrindo rota no Google Maps.')}
function state(){return read(FC.storage.sales,{mode:'combo',lotId:'H14',houseId:'harmonia'})}
function setState(s){write(FC.storage.sales,s)}
function selectedLot(){const s=state();return FC.lots.find(l=>l.id===s.lotId)||FC.lots[0]}
function selectedHouse(){const s=state();return FC.houses.find(h=>h.id===s.houseId)||FC.houses[0]}
function total(){const s=state(),l=selectedLot(),h=selectedHouse();return (s.mode!=='home'?l.valor:0)+(s.mode!=='lot'?h.valor:0)}
function selectMode(mode){const s=state();s.mode=mode;setState(s);renderSales()}
function selectLot(id){const s=state();s.lotId=id;if(s.mode==='home')s.mode='combo';setState(s);renderSales();toast('Lote selecionado.')}
function selectHouse(id){const s=state();s.houseId=id;if(s.mode==='lot')s.mode='combo';setState(s);renderSales();toast('Casa selecionada.')}
function details(id){const l=FC.lots.find(x=>x.id===id);if(!l)return;modal(`<div style="display:flex;justify-content:space-between;gap:12px"><div><span class="pill">Solaris</span><h2>${lotName(l)}</h2><p style="color:var(--muted)">Rua: ${l.rua}</p></div><button class="btn secondary" data-close>Fechar</button></div><div class="info-grid"><div class="info"><small>Área</small><b>${l.area.toLocaleString('pt-BR')} m²</b></div><div class="info"><small>Valor</small><b>${brl(l.valor)}</b></div><div class="info"><small>Dimensões</small><b>${l.dims}</b></div><div class="info"><small>Status</small><b>${l.status}</b></div></div><div class="actions"><button class="btn primary" onclick="selectLot('${l.id}')">Escolher este lote</button><button class="btn secondary" onclick="openRoute('${l.id}')">Abrir rota no Google Maps</button><button class="btn ghost" onclick="openAR('${l.id}')">Ver no local (AR)</button></div>`)}
function reserve(id){const l=FC.lots.find(x=>x.id===id);const arr=read(FC.storage.reservations,[]);const p='RES-'+String(arr.length+1).padStart(4,'0');arr.unshift({protocol:p,lotId:id,lot:lotName(l),status:'Aguardando contato',date:new Date().toISOString()});write(FC.storage.reservations,arr);toast(`Reserva de visita registrada: ${p}`)}

// OpenStreetMap / Leaflet helpers
function osmBounds(pad=0.0009){
  const lats=FC.lots.map(l=>l.lat), lngs=FC.lots.map(l=>l.lng);
  return [[Math.min(...lats)-pad, Math.min(...lngs)-pad],[Math.max(...lats)+pad, Math.max(...lngs)+pad]];
}
function destroyMapIfAny(id){
  const el=document.getElementById(id);
  if(el && el._leaflet_map){el._leaflet_map.remove(); el._leaflet_map=null;}
}
function buildMap(id, options={}){
  const el=document.getElementById(id);
  if(!el || typeof L==='undefined') return null;
  destroyMapIfAny(id);
  const map=L.map(el,{zoomControl:options.zoomControl!==false, scrollWheelZoom:options.scrollWheelZoom!==false, dragging:options.dragging!==false, tap:true, attributionControl:true});
  el._leaflet_map=map;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20, attribution:'&copy; OpenStreetMap'}).addTo(map);
  if(options.fit !== false) map.fitBounds(osmBounds(options.pad||0.0006),{padding:[20,20]});
  if(options.center) map.setView(options.center, options.zoom || 17);
  setTimeout(()=>map.invalidateSize(), 60);
  return map;
}
function statusClass(status){return status==='Disponível' ? 'disp' : status==='Reservado' ? 'res' : 'vend'}
function lotStatusColors(status,selected=false){
  if(status==='Reservado') return selected?{stroke:'#8f3d1e',fill:'#e9c1b4',text:'#622611'}:{stroke:'#c95a35',fill:'#f4d9cf',text:'#8f3d1e'};
  if(status==='Vendido') return selected?{stroke:'#4b5563',fill:'#d6dae0',text:'#243042'}:{stroke:'#7b8794',fill:'#eceff3',text:'#4b5563'};
  return selected?{stroke:'#0d4f53',fill:'#9ee1df',text:'#0d3f42'}:{stroke:'#209f9f',fill:'#d8f2f1',text:'#0b6060'};
}
function parseDims(str){
  const nums=(str||'').match(/(\d+[\.,]?\d*)/g)||[];
  if(nums.length>=2){
    const a=parseFloat(nums[0].replace(',','.'));
    const b=parseFloat(nums[1].replace(',','.'));
    return {w:a,h:b};
  }
  const side=Math.sqrt(Number(arguments[1]?.area)||450);
  return {w:side,h:side};
}
const lotAngles={H14:-28,A39:26,A12:62,B08:6,D07:74,F09:0};
function getLotAngle(lot){return lotAngles[lot.id] ?? 0}
function metersToLat(m){return m/111320}
function metersToLng(m,lat){return m/(111320*Math.cos(lat*Math.PI/180))}
function buildLotPolygon(lot){
  const dims=parseDims(lot.dims,lot);
  const w=(dims.w||15)+1.5, h=(dims.h||30)+1.5;
  const a=getLotAngle(lot)*Math.PI/180;
  const hw=w/2, hh=h/2;
  const pts=[[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([x,y])=>{
    const xr=x*Math.cos(a)-y*Math.sin(a);
    const yr=x*Math.sin(a)+y*Math.cos(a);
    return [lot.lat+metersToLat(yr), lot.lng+metersToLng(xr,lot.lat)];
  });
  return pts;
}
function lotPopup(l){
  return `<div class="map-popup"><b>Q${l.quadra} · Lote ${l.lote}</b><br>${l.status} · ${l.area.toLocaleString('pt-BR')} m²<br>${l.rua}<br><small>${brl(l.valor)}</small><div class="popup-actions"><button class="mini-btn" onclick="details('${l.id}')">Detalhes</button><button class="mini-btn" onclick="openRoute('${l.id}')">Rota</button></div></div>`;
}
function addLotMarkers(map, opts={}){
  const selectedId=opts.selectedId || null;
  const lotList=opts.onlyIds ? FC.lots.filter(l=>opts.onlyIds.includes(l.id)) : FC.lots;
  const group=[];
  lotList.forEach(l=>{
    const isSelected=l.id===selectedId;
    const colors=lotStatusColors(l.status,isSelected);
    const poly=L.polygon(buildLotPolygon(l),{
      color:colors.stroke,
      weight:isSelected?3:1.8,
      fillColor:colors.fill,
      fillOpacity:isSelected?0.92:0.78,
      className:'lot-footprint'
    }).addTo(map);
    const labelIcon=L.divIcon({className:'lot-label-wrap',html:`<div class="lot-label ${statusClass(l.status)} ${isSelected?'selected':''}">${l.quadra}-${String(l.lote).padStart(2,'0')}</div>`});
    const label=L.marker([l.lat,l.lng],{icon:labelIcon,keyboard:false}).addTo(map);
    poly.bindPopup(lotPopup(l));
    label.bindPopup(lotPopup(l));
    const handle=()=>{ if(opts.onSelect) opts.onSelect(l); if(opts.openPopup!==false) poly.openPopup(); };
    poly.on('click',handle); label.on('click',handle);
    group.push({poly,label,lot:l});
  });
  return group;
}
function renderSalesMap(lot){
  const map=buildMap('salesMap',{fit:true,pad:0.00045,zoomControl:true});
  if(!map) return;
  addLotMarkers(map,{selectedId:lot.id, permanentLabels:true, showAllLabels:true, onSelect:(l)=>{ if(l.id!==selectedLot().id){ selectLot(l.id); toast(`Lote Q${l.quadra}-${l.lote} selecionado no mapa.`);} }});
}
function renderDashMap(){
  const map=buildMap('gestaoMap',{fit:true,pad:0.0005, dragging:true});
  if(!map) return;
  addLotMarkers(map,{onlyIds:FC.lots.slice(0,4).map(l=>l.id), selectedId:selectedLot().id, permanentLabels:true, showAllLabels:true, onSelect:(l)=>details(l.id)});
}
function renderOccurrenceMap(currentGeo, inside){
  const box=document.getElementById('occMap');
  if(!box) return;
  if(!currentGeo || inside){
    const map=buildMap('occMap',{fit:true,pad:0.00055});
    if(!map) return;
    addLotMarkers(map,{selectedId:selectedLot().id, permanentLabels:true, showAllLabels:true, onSelect:(l)=>details(l.id), openPopup:false});
    if(currentGeo){
      L.circle([currentGeo.lat,currentGeo.lng],{radius:Math.max(8,currentGeo.accuracy||12), color:'#1d4ed8', fillColor:'#2563eb', fillOpacity:0.14, weight:2}).addTo(map);
      const m=L.circleMarker([currentGeo.lat,currentGeo.lng],{radius:8,color:'#fff',weight:2,fillColor:'#1d4ed8',fillOpacity:1}).addTo(map);
      m.bindTooltip('Você está aqui',{permanent:true,direction:'top',offset:[0,-8],className:'lot-tip selected'});
      map.setView([currentGeo.lat,currentGeo.lng],18);
    }
  } else {
    box.innerHTML=`<iframe src="${googleEmbed(currentGeo)}" loading="lazy"></iframe>`;
  }
}
function renderModalLotMap(id, lot, mode='selected'){
  const map=buildMap(id,{center:[lot.lat,lot.lng], zoom:18, fit:false});
  if(!map) return;
  addLotMarkers(map,{selectedId:lot.id, permanentLabels:true, showAllLabels:true, onSelect:null, openPopup:false});
}

function openAR(id){
  const l=FC.lots.find(x=>x.id===id);
  modal(`<div style="display:flex;justify-content:space-between;gap:12px"><div><span class="pill brand">Realidade aumentada</span><h2>Você está aqui</h2><p style="color:var(--muted)">Use no local para confirmar a posição do lote.</p></div><button class="btn secondary" data-close>Fechar</button></div><div class="map-box map-box-osm" style="border-radius:22px;margin-top:16px"><div id="arMap" class="leaflet-holder"></div></div><div class="actions"><button class="btn primary" onclick="openRoute('${l.id}')">Abrir rota</button></div>`);
  setTimeout(()=>renderModalLotMap('arMap', l), 80);
}
function generateAI(){
  const l=selectedLot(),h=selectedHouse();
  modal(`<div style="display:flex;justify-content:space-between;gap:12px"><div><span class="pill brand">Imagem por IA</span><h2>Casa no lote</h2><p style="color:var(--muted)">Prévia da ${h.nome} aplicada ao lote escolhido.</p></div><button class="btn secondary" data-close>Fechar</button></div><div class="card card-pad" style="margin-top:16px;text-align:center"><div class="map-box map-box-osm" style="border-radius:20px"><div id="aiPreviewMap" class="leaflet-holder small"></div></div><p>Solicitação: <b>${h.nome}</b> no <b>Q${l.quadra} · Lote ${l.lote}</b>.</p><button class="btn primary full" onclick="toast('Solicitação de renderização registrada.')">Solicitar renderização</button></div>`);
  setTimeout(()=>renderModalLotMap('aiPreviewMap', l), 80);
}

function renderSales(){
  const app=$('#salesApp');
  if(!app)return;
  const s=state(),l=selectedLot(),h=selectedHouse();
  app.innerHTML=`<div class="phone-head"><div class="phone-title"><img src="${logo}" alt="">Futura Casa Pro</div><button class="bell">○</button></div><div class="section-head"><h2>Modo Vendas</h2><p>Escolha sua jornada e avance com orientação.</p></div><div class="route-grid"><button class="route-btn ${s.mode==='lot'?'active':''}" onclick="selectMode('lot')"><i>▱</i><b>Quero um lote</b></button><button class="route-btn ${s.mode==='combo'?'active':''}" onclick="selectMode('combo')"><i>⌂</i><b>Quero lote + casa</b></button><button class="route-btn ${s.mode==='home'?'active':''}" onclick="selectMode('home')"><i>□</i><b>Já tenho lote</b></button></div><div class="map-box map-box-osm"><div id="salesMap" class="leaflet-holder"></div><div class="map-tools"><button onclick="openRoute('${l.id}')">↗</button><button onclick="openAR('${l.id}')">◎</button></div></div><div class="lot-card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><span class="pill">${s.mode==='home'?'Casa para seu lote':l.status}</span><span class="pill brand">${s.mode==='lot'?'Lote':s.mode==='combo'?'Lote + casa':'Casa'}</span></div><h3>${s.mode==='home'?h.nome:`Quadra ${l.quadra} · Lote ${l.lote}`}</h3><div class="info-grid">${s.mode==='home'?`<div class="info"><small>Área</small><b>${h.area} m²</b></div><div class="info"><small>Valor</small><b>${brl(h.valor)}</b></div>`:`<div class="info"><small>Área</small><b>${l.area.toLocaleString('pt-BR')} m²</b></div><div class="info"><small>Valor</small><b>${brl(l.valor)}</b></div><div class="info"><small>Dimensão</small><b>${l.dims}</b></div><div class="info"><small>Perfil</small><b>${l.perfil}</b></div>`}</div><div class="actions"><button class="btn primary" onclick="${s.mode==='home'?'generateAI()':`details('${l.id}')`}">${s.mode==='home'?'Aplicar casa ao meu lote':'Ver detalhes'}</button><button class="btn secondary" onclick="${s.mode==='home'?'generateAI()':`reserve('${l.id}')`}">${s.mode==='home'?'Gerar imagem por IA':'Reservar visita'}</button>${s.mode==='combo'?`<button class="btn ghost" onclick="generateAI()">Gerar imagem por IA</button>`:''}</div></div>${s.mode!=='lot'?`<div class="lot-card"><span class="pill brand">Casa</span><h3>${h.nome}</h3><div class="grid cols-3">${FC.houses.map(x=>`<button class="btn ${x.id===h.id?'primary':'secondary'}" onclick="selectHouse('${x.id}')">${x.nome.replace('Casa ','')}</button>`).join('')}</div></div>`:''}<div class="tabs"><button class="active"><i>▱</i>Mapa</button><a href="gestao.html"><i>◫</i>Gestão</a><a class="plus" href="pos-venda.html"><i>＋</i>Obra</a><a href="ocorrencias.html"><i>!</i>Ocorrência</a><button><i>◎</i>Perfil</button></div>`;
  const picker=$('#lotPicker');
  if(picker)picker.innerHTML=FC.lots.map(x=>`<div class="card card-pad"><div style="display:flex;justify-content:space-between;gap:10px"><b>Q${x.quadra} · Lote ${x.lote}</b><span class="pill ${x.status==='Reservado'?'brand':''}">${x.status}</span></div><div class="info-grid"><div class="info"><small>Área</small><b>${x.area.toLocaleString('pt-BR')} m²</b></div><div class="info"><small>Valor</small><b>${brl(x.valor)}</b></div></div><div class="actions two"><button class="btn primary" onclick="selectLot('${x.id}')">Selecionar</button><button class="btn secondary" onclick="details('${x.id}')">Detalhes</button></div></div>`).join('');
  setTimeout(()=>renderSalesMap(l), 60);
}

function renderGestao(){
  const el=$('#gestaoApp');if(!el)return;
  const occ=read(FC.storage.occurrences,[]),works=read(FC.storage.works,defaultWorks()),res=read(FC.storage.reservations,[]);
  const open=occ.filter(o=>o.status!=='Resolvida').length,resolved=occ.filter(o=>o.status==='Resolvida').length;
  el.innerHTML=`<div class="grid cols-4"><div class="card card-pad metric"><small>Lotes consultados</small><b>348</b><small>+18% no período</small></div><div class="card card-pad metric"><small>Reservas</small><b>${42+res.length}</b><small>+12% no período</small></div><div class="card card-pad metric"><small>Ocorrências abertas</small><b>${open}</b><small>${resolved} resolvidas</small></div><div class="card card-pad metric"><small>Obras</small><b>${works.loteamento.percent}%</b><small>Implantação do loteamento</small></div></div><div class="grid cols-2" style="margin-top:14px"><div class="card card-pad"><div style="display:flex;justify-content:space-between;gap:10px"><b>Mapa do empreendimento</b><span class="pill">Atividade</span></div><div class="dash-map map-box-osm" style="margin-top:12px"><div id="gestaoMap" class="leaflet-holder"></div></div></div><div class="card card-pad"><b>Status comercial</b><div class="donut"><div><b>251</b><small>lotes</small></div></div><div class="grid"><span class="pill">62% disponíveis</span><span class="pill brand">16% reservados</span></div></div></div><div class="grid cols-2" style="margin-top:14px"><div class="card card-pad"><h3>Ocorrências</h3>${occ.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Protocolo</th><th>Categoria</th><th>Local</th><th>Status</th><th>Ação</th></tr></thead><tbody>${occ.map(o=>`<tr><td>${o.protocol}</td><td>${o.category}</td><td>${o.locationLabel||'-'}</td><td>${o.status}</td><td><button class="btn secondary" onclick="manageOcc('${o.id}')">Atualizar</button></td></tr>`).join('')}</tbody></table></div>`:'<p style="color:var(--muted)">Nenhuma ocorrência registrada.</p>'}</div><div class="card card-pad"><h3>Atualizar obras</h3>${workEditor('loteamento','Obras do loteamento',works.loteamento)}${workEditor('casa','Obras da casa',works.casa)}</div></div>`;
  setTimeout(()=>renderDashMap(),60);
}
function defaultWorks(){return{loteamento:{percent:42,status:'Drenagem e redes em andamento',updated:new Date().toISOString()},casa:{percent:58,status:'Estrutura em andamento',updated:new Date().toISOString()}}}
function workEditor(key,title,w){return `<div class="card card-pad" style="margin-top:12px"><b>${title}</b><div class="field"><label>Percentual</label><input type="number" min="0" max="100" value="${w.percent}" id="work-${key}-percent"></div><div class="field"><label>Status</label><input value="${w.status}" id="work-${key}-status"></div><button class="btn primary full" onclick="saveWork('${key}')">Salvar atualização</button></div>`}
function saveWork(key){const w=read(FC.storage.works,defaultWorks());w[key].percent=Number($(`#work-${key}-percent`).value||0);w[key].status=$(`#work-${key}-status`).value;w[key].updated=new Date().toISOString();write(FC.storage.works,w);toast('Obra atualizada.');renderGestao()}
function manageOcc(id){const arr=read(FC.storage.occurrences,[]);const o=arr.find(x=>x.id===id);if(!o)return;modal(`<div style="display:flex;justify-content:space-between;gap:12px"><div><span class="pill brand">${o.protocol}</span><h2>Atualizar ocorrência</h2><p style="color:var(--muted)">${o.category} · ${o.locationLabel||'Localização registrada'}</p></div><button class="btn secondary" data-close>Fechar</button></div><div class="field"><label>Status</label><select id="occStatus"><option>Em análise</option><option>Em atendimento</option><option>Resolvida</option></select></div><div class="field"><label>Resolução / observação</label><textarea id="occResolution">${o.resolution||''}</textarea></div><button class="btn primary full" onclick="saveOcc('${id}')">Salvar ocorrência</button>`);$('#occStatus').value=o.status}
function saveOcc(id){const arr=read(FC.storage.occurrences,[]);const o=arr.find(x=>x.id===id);if(!o)return;o.status=$('#occStatus').value;o.resolution=$('#occResolution').value;o.resolvedAt=o.status==='Resolvida'?new Date().toISOString():o.resolvedAt;write(FC.storage.occurrences,arr);toast('Ocorrência atualizada.');$('.modal').classList.remove('show');renderGestao()}
function renderPos(){const el=$('#posApp');if(!el)return;const layer=localStorage.getItem('fc25_work_layer')||'loteamento',works=read(FC.storage.works,defaultWorks());el.innerHTML=`<div class="layer-tabs"><button class="${layer==='loteamento'?'active':''}" onclick="setLayer('loteamento')">Obras do loteamento</button><button class="${layer==='casa'?'active':''}" onclick="setLayer('casa')">Obras da casa</button></div>${layer==='loteamento'?workView('Implantação Solaris','Acompanhe a infraestrutura do empreendimento.',works.loteamento,['Terraplenagem','Drenagem e redes','Pavimentação','Iluminação','Paisagismo'],['Drenagem','Pavimentação','Iluminação pública','Paisagismo','Portaria','Sinalização']):workView('Minha Obra','Acompanhe cada etapa até sua casa ganhar vida.',works.casa,['Projeto aprovado','Fundação','Estrutura','Acabamento','Entrega'],['Água','Energia','Acesso para prestadores','Vistorias','Documentos','Visitas'])}`}
function setLayer(l){localStorage.setItem('fc25_work_layer',l);renderPos()}
function workView(tag,title,w,steps,services){return `<div class="card card-pad"><span class="pill">${tag}</span><h2 style="margin:12px 0 6px">${title}</h2><p style="color:var(--muted)">${w.status} · ${w.percent}% concluído</p><div class="progress">${steps.map((s,i)=>`<div class="step ${i*25<w.percent?'done':i*25<=w.percent?'active':''}"><i>${i*25<w.percent?'✓':i*25<=w.percent?'▦':'○'}</i><b>${s}</b><small>${i*25<w.percent?'Concluído':i*25<=w.percent?'Em andamento':'Pendente'}</small></div>`).join('')}</div></div><div class="grid cols-2" style="margin-top:14px"><div class="card card-pad"><h3>Entregas</h3>${steps.map((s,i)=>`<div style="display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid var(--line);padding:12px 0"><span>${s}</span><span class="pill ${i*25<w.percent?'':'brand'}">${i*25<w.percent?'Concluída':'Programada'}</span></div>`).join('')}</div><div class="card card-pad"><h3>Solicitações</h3><div class="grid cols-2">${services.map(s=>`<button class="btn secondary" onclick="requestService('${s}')">${s}</button>`).join('')}</div></div></div>`}
function requestService(s){const arr=read(FC.storage.services,[]);arr.unshift({id:crypto.randomUUID(),service:s,date:new Date().toISOString()});write(FC.storage.services,arr);toast(`${s}: solicitação registrada.`)}
let currentGeo=read('fc25_geo',null), currentCat='Buraco';
function insideSolaris(g){return dist(g.lat,g.lng,FC.solarisCenter.lat,FC.solarisCenter.lng)<=FC.geofenceMeters}
function googleEmbed(g){return `https://www.google.com/maps?q=${g.lat},${g.lng}&z=17&output=embed`}
function renderOcc(){
  const el=$('#occApp');if(!el)return;
  const list=read(FC.storage.occurrences,[]), inside=currentGeo&&insideSolaris(currentGeo);
  el.innerHTML=`<form class="form-grid card card-pad" id="occForm"><div><div class="map-box map-box-osm google-map" style="border-radius:20px"><div id="occMap" class="leaflet-holder"></div></div></div><div class="geo-card"><b>Localização da ocorrência</b><small>${currentGeo?`${inside?'Dentro do empreendimento · usando OpenStreetMap':'Fora do mapa do empreendimento · usando Google Maps'}<br>Lat ${currentGeo.lat.toFixed(6)} · Lng ${currentGeo.lng.toFixed(6)} · precisão aprox. ${Math.round(currentGeo.accuracy||0)} m`:'Use o GPS do aparelho para registrar o ponto real da ocorrência.'}</small><div class="actions two"><button class="btn primary" type="button" onclick="useGeo()">Usar minha localização</button><button class="btn secondary" type="button" onclick="clearGeo()">Limpar ponto</button></div></div><div><b>Foto do local</b><div class="photo-grid" style="margin-top:8px"><div class="photo-box" id="photoBox">Nenhuma foto selecionada</div><label class="photo-box"><input type="file" id="photoInput" accept="image/*" hidden>📷<br>Adicionar foto</label></div></div><div><b>Categoria</b><div class="chips">${['Buraco','Iluminação','Alagamento','Segurança','Outro'].map((c,i)=>`<button type="button" class="chip ${c===currentCat?'active':''}" onclick="setCat('${c}')">${c}</button>`).join('')}</div></div><div class="field"><label>Descrição</label><textarea id="occDesc">Buraco grande na via, oferecendo risco para veículos e pedestres.</textarea></div><button class="btn primary" type="submit">Enviar ocorrência</button></form><div class="card card-pad" style="margin-top:14px"><h3>Protocolos</h3>${list.length?list.map(o=>`<div style="border-bottom:1px solid var(--line);padding:12px 0"><b>${o.protocol}</b> · ${o.category}<br><small style="color:var(--muted)">${o.locationLabel} · ${o.status}</small></div>`).join(''):'<p style="color:var(--muted)">Nenhum protocolo registrado.</p>'}</div>`;
  bindOcc();
  setTimeout(()=>renderOccurrenceMap(currentGeo, inside), 60);
}
function setCat(c){currentCat=c;renderOcc()}
function useGeo(){if(!navigator.geolocation){toast('Geolocalização não disponível.');return}toast('Localizando...');navigator.geolocation.getCurrentPosition(p=>{currentGeo={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,at:new Date().toISOString()};write('fc25_geo',currentGeo);renderOcc();toast('Localização registrada.')},()=>toast('Não foi possível acessar o GPS.'),{enableHighAccuracy:true,timeout:12000,maximumAge:30000})}
function clearGeo(){currentGeo=null;localStorage.removeItem('fc25_geo');renderOcc()}
function bindOcc(){const form=$('#occForm');if(!form)return;const input=$('#photoInput');if(input)input.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>$('#photoBox').innerHTML=`<img src="${r.result}">`;r.readAsDataURL(f)};form.onsubmit=e=>{e.preventDefault();const arr=read(FC.storage.occurrences,[]), inside=currentGeo&&insideSolaris(currentGeo);const o={id:crypto.randomUUID(),protocol:'#'+(2481+arr.length),category:currentCat,description:$('#occDesc').value,status:'Em análise',date:new Date().toISOString(),geo:currentGeo,insideSolaris:!!inside,locationLabel:currentGeo?(inside?'Dentro do empreendimento':'Fora do empreendimento'):'Localização não informada'};arr.unshift(o);write(FC.storage.occurrences,arr);toast(`Ocorrência ${o.protocol} enviada.`);renderOcc()}}
document.addEventListener('DOMContentLoaded',()=>{renderSales();renderGestao();renderPos();renderOcc()})
