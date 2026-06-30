
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const store = (k,v)=>localStorage.setItem(k,JSON.stringify(v));
const get = (k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f));}catch(e){return f;}};
const brl = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(v||0));

const LOTS = [
  {id:'H14', quadra:'H', lote:'14', area:456.05, valor:478000, status:'Disponível', x:52, y:22, lat:-18.72852376, lng:-47.52405936},
  {id:'A39', quadra:'A', lote:'39', area:580.11, valor:592000, status:'Disponível', x:55, y:47, lat:-18.73086484, lng:-47.52674825},
  {id:'B08', quadra:'B', lote:'08', area:450.07, valor:464000, status:'Disponível', x:52, y:68, lat:-18.73238612, lng:-47.52423413},
  {id:'D07', quadra:'D', lote:'07', area:487.92, valor:496000, status:'Reservado', x:61, y:70, lat:-18.73186089, lng:-47.52336923}
];
const HOUSES = [
  {id:'essenza', nome:'Casa Essenza', area:124, valor:490000},
  {id:'harmonia', nome:'Casa Harmonia', area:152, valor:640000},
  {id:'vista', nome:'Casa Vista', area:188, valor:820000}
];
function toast(msg){
  let t = $('#toast'); if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t);}
  t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2400);
}
function modal(html){
  let m = $('#modal'); if(!m){m=document.createElement('div');m.id='modal';m.className='modal';document.body.appendChild(m);}
  m.innerHTML = `<div class="modalCard">${html}</div>`;
  m.classList.add('show');
  $$('[data-close]',m).forEach(b=>b.onclick=()=>m.classList.remove('show'));
}
function maps(lot){
  const name = `Solaris Home Resort - Quadra ${lot.quadra} - Lote ${lot.lote}`;
  const dest = `${name} @ ${lot.lat},${lot.lng}`;
  const url = `https://www.google.com/maps/dir/?${new URLSearchParams({api:'1',destination:dest,travelmode:'driving'}).toString()}`;
  const w = window.open(url,'_blank','noopener');
  if(!w) location.href = url;
}
function renderMapMarker(lot){
  return `<span class="mapPin" style="--x:${lot.x}%;--y:${lot.y}%"><b>Q${lot.quadra} · Lote ${lot.lote}</b><i></i></span>`;
}
function renderGestao(){
  const el = $('#gestaoApp'); if(!el)return;
  const occ = get('fc_mod_occ',[]);
  const reservas = get('fc_mod_reservas',[]);
  el.innerHTML = `
    <div class="metricGrid">
      ${[
        ['Lotes consultados','348','+18% no período'],
        ['Reservas',String(42+reservas.length),'+12% no período'],
        ['Visitas agendadas','96','Dentro da meta'],
        ['Ocorrências',String(occ.length),'Atualizado em tempo real']
      ].map(([a,b,c])=>`<div class="moduleCard moduleCardPad metric"><small>${a}</small><b>${b}</b><small>${c}</small></div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1.25fr .75fr;gap:14px;margin-top:14px">
      <div class="moduleCard moduleCardPad"><div style="display:flex;justify-content:space-between;gap:12px"><b>Mapa do empreendimento</b><span class="statusPill green">Heatmap: visitas</span></div><div class="mapFrame" style="margin-top:12px"><img src="solaris-mapa-georreferenciado-pro-v1-1.jpeg">${LOTS.map(l=>renderMapMarker(l)).join('')}</div></div>
      <div class="moduleCard moduleCardPad"><b>Status comercial</b><div style="width:190px;height:190px;border-radius:50%;margin:20px auto;background:conic-gradient(#209F9F 0 62%, #C95A35 62% 78%, #DDB76A 78% 88%, #9CA3AF 88% 100%);display:grid;place-items:center"><div style="width:112px;height:112px;border-radius:50%;background:white;display:grid;place-items:center;text-align:center"><b>251</b><small>lotes</small></div></div><p><span class="statusPill green">62% disponíveis</span> <span class="statusPill">16% reservados</span></p></div>
    </div>
    <div class="moduleCard moduleCardPad" style="margin-top:14px"><b>Atividades recentes</b><table class="table"><thead><tr><th>Lote</th><th>Cliente</th><th>Atividade</th><th>Status</th></tr></thead><tbody>${[
      ['H-14','Mariana Silva','Reserva realizada','Reservado'],
      ['A-39','Carlos Andrade','Visita agendada','Agendado'],
      ['B-08','Juliana Costa','Proposta enviada','Em negociação'],
      ...occ.slice(0,3).map(o=>[o.local,'Cliente app','Ocorrência registrada',o.status])
    ].map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  `;
}
function renderPos(){
  const el = $('#posApp'); if(!el)return;
  const checklist = get('fc_mod_check',{a:true,b:true,c:false,d:false,e:false});
  const stages = [['Projeto aprovado','done'],['Fundação','done'],['Estrutura','active'],['Acabamento','pending'],['Entrega','pending']];
  el.innerHTML = `
    <div class="moduleCard moduleCardPad">
      <span class="statusPill green">Minha Obra</span>
      <h2 style="margin:12px 0 6px">Acompanhe cada etapa até sua casa ganhar vida.</h2>
      <div class="progressRow">${stages.map(([s,c])=>`<div class="progressItem ${c}"><span class="progressIcon">${c==='done'?'✓':c==='active'?'▦':'○'}</span><b>${s}</b><small>${c==='done'?'Concluído':c==='active'?'Em andamento':'Pendente'}</small></div>`).join('')}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr .85fr;gap:14px;margin-top:14px">
      <div class="moduleCard moduleCardPad"><b>Checklist da etapa atual</b>${[
        ['a','Alvará de execução'],
        ['b','Fundação concluída'],
        ['c','Vistoria de estrutura'],
        ['d','Instalações hidráulicas'],
        ['e','Instalações elétricas']
      ].map(([id,label])=>`<div style="display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px solid #e8dccd"><span>${checklist[id]?'✓':'○'} ${label}</span><button class="appBtn ghost" onclick="toggleCheck('${id}')">›</button></div>`).join('')}</div>
      <div class="moduleCard moduleCardPad"><b>Solicitações de serviços</b><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px">${['Água','Energia','Acesso para prestadores','Vistorias','Documentos','Visitas'].map(s=>`<button class="appBtn secondary" onclick="service('${s}')">${s}</button>`).join('')}</div></div>
    </div>
  `;
}
function toggleCheck(id){const c=get('fc_mod_check',{});c[id]=!c[id];store('fc_mod_check',c);renderPos();}
function service(s){const arr=get('fc_mod_services',[]);arr.unshift({s,date:new Date().toISOString()});store('fc_mod_services',arr);toast(`${s}: solicitação registrada.`);}
function renderOcorrencia(){
  const el = $('#occApp'); if(!el)return;
  const occ = get('fc_mod_occ',[]);
  el.innerHTML = `
    <form class="formGrid moduleCard moduleCardPad" id="occForm">
      <div class="mapFrame"><img src="solaris-mapa-georreferenciado-pro-v1-1.jpeg"><span class="mapPin" style="--x:52%;--y:22%"><b>QH · Lote 14</b><i></i></span></div>
      <div><b>Foto do local</b><div class="photoRow" style="margin-top:8px"><div class="photoBox" id="photoBox">Nenhuma foto selecionada</div><label class="photoBox"><input type="file" id="photoInput" accept="image/*" hidden>📷<br>Adicionar foto</label></div></div>
      <div><b>Categoria</b><div class="chips" id="chips">${['Buraco','Iluminação','Alagamento','Segurança','Outro'].map((c,i)=>`<button type="button" class="chip ${i===0?'active':''}" data-cat="${c}">${c}</button>`).join('')}</div></div>
      <textarea id="occDesc">Buraco grande na via, oferecendo risco para veículos e pedestres.</textarea>
      <button class="appBtn primary" type="submit">Enviar ocorrência</button>
    </form>
    <div id="protocol" style="margin-top:14px">${occ[0]?protocol(occ[0]):''}</div>
  `;
  bindOcc();
}
function protocol(o){return `<div class="moduleCard moduleCardPad"><div style="display:flex;justify-content:space-between"><b>Protocolo ${o.protocolo}</b><span class="statusPill">Em análise</span></div><p style="color:#687386">Sua ocorrência foi registrada com sucesso.</p></div>`}
function bindOcc(){
  let cat='Buraco';
  $$('#chips .chip').forEach(ch=>ch.onclick=()=>{$$('#chips .chip').forEach(x=>x.classList.remove('active'));ch.classList.add('active');cat=ch.dataset.cat});
  const pi = $('#photoInput');
  if(pi) pi.onchange=e=>{const file=e.target.files[0]; if(!file)return; const r=new FileReader(); r.onload=()=>$('#photoBox').innerHTML=`<img src="${r.result}">`; r.readAsDataURL(file);}
  $('#occForm').onsubmit=e=>{e.preventDefault();const arr=get('fc_mod_occ',[]);const o={protocolo:'#'+(2481+arr.length),cat,local:'QH · Lote 14',status:'Em análise',date:new Date().toISOString()};arr.unshift(o);store('fc_mod_occ',arr);$('#protocol').innerHTML=protocol(o);toast(`Ocorrência ${o.protocolo} enviada.`);}
}
document.addEventListener('DOMContentLoaded',()=>{renderGestao();renderPos();renderOcorrencia();});


/* v2.4 — overrides: obra em duas camadas e ocorrências com geolocalização */
(function(){
  let occurrenceGeo = JSON.parse(localStorage.getItem('fc_occ_geo_v24') || 'null');

  window.setWorkLayer = function(layer){
    localStorage.setItem('fc_work_layer_v24', layer);
    renderPos();
  };

  window.renderPos = function(){
    const el = $('#posApp'); if(!el) return;
    const activeLayer = localStorage.getItem('fc_work_layer_v24') || 'loteamento';
    const checklist = get('fc_mod_check',{a:true,b:true,c:false,d:false,e:false});

    const loteamento = `
      <div class="layerTabs">
        <button class="layerTab active" onclick="setWorkLayer('loteamento')">Obras do loteamento</button>
        <button class="layerTab" onclick="setWorkLayer('casa')">Obras da casa</button>
      </div>
      <div class="moduleCard moduleCardPad">
        <span class="statusPill green">Implantação Solaris</span>
        <h2 style="margin:12px 0 6px">Acompanhe a infraestrutura do empreendimento.</h2>
        <div class="progressRow">
          ${[
            ['Terraplenagem','done'],
            ['Drenagem e redes','active'],
            ['Pavimentação','pending'],
            ['Iluminação','pending'],
            ['Paisagismo','pending']
          ].map(([s,c])=>`<div class="progressItem ${c}"><span class="progressIcon">${c==='done'?'✓':c==='active'?'▦':'○'}</span><b>${s}</b><small>${c==='done'?'Concluído':c==='active'?'Em andamento':'Pendente'}</small></div>`).join('')}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr .85fr;gap:14px;margin-top:14px">
        <div class="moduleCard moduleCardPad">
          <b>Entregas de infraestrutura</b>
          ${[
            ['Rede de água','Em implantação'],
            ['Rede de esgoto','Em implantação'],
            ['Pavimentação','Programada'],
            ['Iluminação pública','Programada'],
            ['Portaria e controle de acesso','Programada']
          ].map(([a,b])=>`<div style="display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px solid #e8dccd"><span>${a}</span><span class="statusPill">${b}</span></div>`).join('')}
        </div>
        <div class="moduleCard moduleCardPad">
          <b>Solicitações do loteamento</b>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px">
            ${['Drenagem','Pavimentação','Iluminação pública','Paisagismo','Portaria','Sinalização'].map(s=>`<button class="appBtn secondary" onclick="service('${s}')">${s}</button>`).join('')}
          </div>
        </div>
      </div>`;

    const casa = `
      <div class="layerTabs">
        <button class="layerTab" onclick="setWorkLayer('loteamento')">Obras do loteamento</button>
        <button class="layerTab active" onclick="setWorkLayer('casa')">Obras da casa</button>
      </div>
      <div class="moduleCard moduleCardPad">
        <span class="statusPill green">Minha Obra</span>
        <h2 style="margin:12px 0 6px">Acompanhe cada etapa até sua casa ganhar vida.</h2>
        <div class="progressRow">${[
          ['Projeto aprovado','done'],
          ['Fundação','done'],
          ['Estrutura','active'],
          ['Acabamento','pending'],
          ['Entrega','pending']
        ].map(([s,c])=>`<div class="progressItem ${c}"><span class="progressIcon">${c==='done'?'✓':c==='active'?'▦':'○'}</span><b>${s}</b><small>${c==='done'?'Concluído':c==='active'?'Em andamento':'Pendente'}</small></div>`).join('')}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr .85fr;gap:14px;margin-top:14px">
        <div class="moduleCard moduleCardPad"><b>Checklist da etapa atual</b>${[
          ['a','Alvará de execução'],
          ['b','Fundação concluída'],
          ['c','Vistoria de estrutura'],
          ['d','Instalações hidráulicas'],
          ['e','Instalações elétricas']
        ].map(([id,label])=>`<div style="display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px solid #e8dccd"><span>${checklist[id]?'✓':'○'} ${label}</span><button class="appBtn ghost" onclick="toggleCheck('${id}')">›</button></div>`).join('')}</div>
        <div class="moduleCard moduleCardPad"><b>Solicitações da casa</b><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px">${['Água','Energia','Acesso para prestadores','Vistorias','Documentos','Visitas'].map(s=>`<button class="appBtn secondary" onclick="service('${s}')">${s}</button>`).join('')}</div></div>
      </div>`;

    el.innerHTML = activeLayer === 'casa' ? casa : loteamento;
  };

  window.useOccurrenceLocation = function(){
    if(!navigator.geolocation){
      toast('Geolocalização não disponível neste navegador.');
      return;
    }
    const status = $('#geoStatus');
    if(status) status.textContent = 'Localizando...';
    navigator.geolocation.getCurrentPosition(pos=>{
      occurrenceGeo = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy || 0),
        at: new Date().toISOString()
      };
      localStorage.setItem('fc_occ_geo_v24', JSON.stringify(occurrenceGeo));
      renderOcorrencia();
      toast('Localização da ocorrência registrada.');
    }, err=>{
      if(status) status.textContent = 'Não foi possível obter a localização. Permita o GPS ou informe manualmente.';
      toast('Não foi possível acessar o GPS.');
    }, {enableHighAccuracy:true, timeout:10000, maximumAge:30000});
  };

  window.clearOccurrenceLocation = function(){
    occurrenceGeo = null;
    localStorage.removeItem('fc_occ_geo_v24');
    renderOcorrencia();
  };

  window.renderOcorrencia = function(){
    const el = $('#occApp'); if(!el)return;
    const occ = get('fc_mod_occ',[]);
    const geoText = occurrenceGeo
      ? `Lat ${Number(occurrenceGeo.lat).toFixed(6)} · Lng ${Number(occurrenceGeo.lng).toFixed(6)} · precisão aprox. ${occurrenceGeo.accuracy || '-'} m`
      : 'Use a localização do aparelho para registrar o ponto real da ocorrência.';
    const mapPin = occurrenceGeo
      ? `<span class="mapPin" style="--x:52%;--y:22%"><b>Você está aqui</b><i></i></span>`
      : `<span class="mapPin" style="--x:52%;--y:22%"><b>Selecionar localização</b><i></i></span>`;

    el.innerHTML = `
      <form class="formGrid moduleCard moduleCardPad" id="occForm">
        <div class="mapFrame"><img src="solaris-mapa-georreferenciado-pro-v1-1.jpeg">${mapPin}</div>
        <div class="geoBox">
          <b>Localização da ocorrência</b>
          <small id="geoStatus">${geoText}</small>
          <div class="geoActions">
            <button class="appBtn primary" type="button" onclick="useOccurrenceLocation()">Usar minha localização</button>
            <button class="appBtn secondary" type="button" onclick="clearOccurrenceLocation()">Limpar ponto</button>
          </div>
        </div>
        <div><b>Foto do local</b><div class="photoRow" style="margin-top:8px"><div class="photoBox" id="photoBox">Nenhuma foto selecionada</div><label class="photoBox"><input type="file" id="photoInput" accept="image/*" hidden>📷<br>Adicionar foto</label></div></div>
        <div><b>Categoria</b><div class="chips" id="chips">${['Buraco','Iluminação','Alagamento','Segurança','Outro'].map((c,i)=>`<button type="button" class="chip ${i===0?'active':''}" data-cat="${c}">${c}</button>`).join('')}</div></div>
        <textarea id="occDesc" placeholder="Descreva a ocorrência">Buraco grande na via, oferecendo risco para veículos e pedestres.</textarea>
        <button class="appBtn primary" type="submit">Enviar ocorrência</button>
      </form>
      <div id="protocol" style="margin-top:14px">${occ[0]?protocol(occ[0]):''}</div>
    `;
    bindOcc();
  };

  window.bindOcc = function(){
    let cat='Buraco';
    $$('#chips .chip').forEach(ch=>ch.onclick=()=>{
      $$('#chips .chip').forEach(x=>x.classList.remove('active'));
      ch.classList.add('active');
      cat=ch.dataset.cat;
    });
    const pi = $('#photoInput');
    if(pi) pi.onchange=e=>{
      const file=e.target.files[0]; if(!file)return;
      const r=new FileReader();
      r.onload=()=>$('#photoBox').innerHTML=`<img src="${r.result}">`;
      r.readAsDataURL(file);
    };
    $('#occForm').onsubmit=e=>{
      e.preventDefault();
      const arr=get('fc_mod_occ',[]);
      const geo = occurrenceGeo ? {lat:occurrenceGeo.lat,lng:occurrenceGeo.lng,accuracy:occurrenceGeo.accuracy} : null;
      const local = geo ? `GPS ${Number(geo.lat).toFixed(6)}, ${Number(geo.lng).toFixed(6)}` : 'Localização não informada';
      const o={protocolo:'#'+(2481+arr.length),cat,local,status:'Em análise',date:new Date().toISOString(),geo,description:$('#occDesc').value};
      arr.unshift(o);
      store('fc_mod_occ',arr);
      $('#protocol').innerHTML=protocol(o);
      toast(`Ocorrência ${o.protocolo} enviada.`);
    };
  };

  document.addEventListener('DOMContentLoaded',()=>{
    renderPos();
    renderOcorrencia();
  });
})();
