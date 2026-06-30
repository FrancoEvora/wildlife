
/* Futura Casa Pro v1.1 — Clean Flow + Google Maps + IA contextual */
const FC_CLEAN_MAP = 'solaris-mapa-georreferenciado-pro-v1-1.jpeg';
function fcCleanRouteTitle(route){return route==='lot'?'Comprar lote':route==='combo'?'Lote + casa':route==='home'?'Casa para meu lote':'Escolha sua jornada';}
function fcCleanStageLabel(stage){return ({start:'Início',lote:'Lote',mapa:'Mapa',casa:'Casa',visualizar:'Visualizar',simular:'Simular',proposta:'Proposta'}[stage]||stage);}
function fcCleanSteps(){const route=fcProActiveRoute();if(!route)return '';return `<div class="fcCleanSteps">${route.stages.map(s=>`<button class="fcCleanStep ${s===fcProCurrentStage()?'active':''}" type="button" data-pro-step="${s}">${fcCleanStageLabel(s)}</button>`).join('')}</div>`;}
function fcCleanRouteButtons(){return `<button class="fcCleanRoute ${fcPro.route==='lot'?'active':''}" type="button" data-pro-route="lot"><span>01</span><div><b>Quero comprar um lote</b><small>Escolha localização e simule o terreno.</small></div><i>→</i></button><button class="fcCleanRoute ${fcPro.route==='combo'?'active':''}" type="button" data-pro-route="combo"><span>02</span><div><b>Quero lote + casa</b><small>Monte a solução completa e visualize a casa no lote.</small></div><i>→</i></button><button class="fcCleanRoute ${fcPro.route==='home'?'active':''}" type="button" data-pro-route="home"><span>03</span><div><b>Já tenho lote e quero casa</b><small>Escolha o modelo e simule o projeto.</small></div><i>→</i></button>`;}
function fcCleanRecommendedLots(){const lots=fcProLotCandidates?fcProLotCandidates():(MAP_LOTS||[]);const av=lots.filter(l=>l.status==='available');return (av.length?av:lots).slice(0,3);}
function fcCleanRecommendedHomes(){return (typeof HOMES!=='undefined'?HOMES:[]).slice(0,3);}
function fcCleanLotCard(l){return `<article class="fcCleanCard ${state.lot?.id===l.id?'selected':''}"><div class="fcCleanCardTop"><h3>${l.name||('Quadra '+l.quadra+' · Lote '+l.number)}</h3><span class="fcCleanTag ${l.status||'available'}">${fcProStatusLabel?fcProStatusLabel(l.status):'Disponível'}</span></div><div class="fcCleanMeta"><span>${Math.round(l.area||0)} m²</span><span>${l.dims||'aprox.'}</span><span>${fmt(l.price||0)}</span></div><div class="fcCleanActions"><button class="btn fcCleanPrimary primaryOne" type="button" data-pro-lot="${l.id}">Escolher este lote</button><button class="btn fcCleanSecondary" type="button" data-pro-detail="${l.id}">Detalhes</button><button class="btn fcCleanGhost" type="button" data-clean-route-lot="${l.id}">Rota</button></div></article>`;}
function fcCleanHomeCard(h){return `<article class="fcCleanCard ${state.home?.id===h.id?'selected':''}"><div class="fcCleanCardTop"><h3>${h.name}</h3><span class="fcCleanTag">${h.tier||'Casa'}</span></div><div class="fcCleanMeta"><span>${h.area||'-'} m²</span><span>${h.bedrooms||'-'} quartos</span><span>${fmt(h.price||0)}</span></div><div class="fcCleanActions"><button class="btn fcCleanPrimary primaryOne" type="button" data-pro-home="${h.id}">Escolher esta casa</button><button class="btn fcCleanSecondary primaryOne" type="button" data-pro-home-detail="${h.id}">Ver detalhes</button></div></article>`;}
function fcCleanHeaderText(){const route=fcProActiveRoute();if(!route)return ['Escolha sua jornada.','A plataforma mostra um passo por vez, sem cardápio poluído.'];const m={lote:['Escolha o lote.','Primeiro, veja poucas opções recomendadas. Depois você pode abrir mapa, rota ou AR.'],mapa:['Valide a localização.','Agora sim entram mapa, rota e realidade aumentada.'],casa:['Escolha a casa.','Veja poucos modelos para avançar sem dispersão.'],visualizar:['Visualize antes de simular.','A geração de imagem por IA aparece no momento certo: depois da escolha.'],simular:['Simule com clareza.','Ajuste entrada, prazo, balões e modelo financeiro.'],proposta:['Envie a proposta.','Finalize os dados para o consultor validar condições e disponibilidade.']};return m[fcProCurrentStage()]||[route.title,route.prompt];}
function fcCleanBody(){const route=fcProActiveRoute();if(!route)return `<div class="fcCleanEmpty"><b>Escolha o que quer montar.</b><br>Depois disso, a Futura Casa Pro mostra apenas a próxima decisão.</div>`;const stage=fcProCurrentStage();if(stage==='lote')return `<div class="fcCleanCardGrid">${fcCleanRecommendedLots().map(fcCleanLotCard).join('')}</div><button class="btn fcCleanSecondary" type="button" data-pro-classic style="margin-top:12px;width:100%">Ver todos os lotes</button>`;if(stage==='casa')return `<div class="fcCleanCardGrid">${fcCleanRecommendedHomes().map(fcCleanHomeCard).join('')}</div><button class="btn fcCleanSecondary" type="button" data-pro-classic style="margin-top:12px;width:100%">Ver todas as casas</button>`;if(stage==='mapa'){const lot=state.lot;return `<div class="fcCleanMap"><img src="${FC_CLEAN_MAP}" alt="Mapa Solaris"><div class="fcMapOverlay">${lot&&typeof fcMarkerHtml==='function'?fcMarkerHtml(lot,true):''}</div></div><div class="fcCleanActions" style="margin-top:12px"><button class="btn fcCleanPrimary primaryOne" type="button" data-pro-go-sim>Simular este lote</button><button class="btn fcCleanSecondary" type="button" data-clean-route-lot="${lot?.id||''}">Abrir rota</button><button class="btn fcCleanGhost" type="button" data-pro-ar="${lot?.id||''}">Ver no local (AR)</button></div>`;}if(stage==='visualizar'){const lot=state.lot;const needsLot=fcPro.route!=='home'&&!lot;return `<div class="fcCleanCard"><span class="fcCleanTag">IA no momento certo</span><h3>${fcPro.route==='home'?'Aplicar casa ao meu lote':'Ver casa neste lote'}</h3><p class="muted">${needsLot?'Escolha um lote antes de gerar a imagem.':'Agora a geração de imagem por IA ajuda a materializar a escolha sem poluir o começo da jornada.'}</p><div class="fcCleanActions"><button class="btn fcCleanPrimary primaryOne" type="button" data-pro-generate-house>${lot?'Gerar imagem por IA':'Informar lote e gerar imagem'}</button>${lot?`<button class="btn fcCleanSecondary" type="button" data-clean-route-lot="${lot.id}">Rota</button><button class="btn fcCleanGhost" type="button" data-pro-ar="${lot.id}">AR do lote</button>`:''}<button class="btn fcCleanSecondary primaryOne" type="button" data-pro-go-sim>Ir para simulação</button></div></div>`;}if(stage==='simular'){const t=getTotals();return `<div class="fcCleanSimGrid"><div class="fcCleanField"><label>Entrada em %</label><input id="proEntryPercent" type="number" min="0" max="90" value="${Number(document.getElementById('entryPercent')?.value||20)}"></div><div class="fcCleanField"><label>Prazo</label><select id="proTerm"><option value="120">120 meses</option><option value="180">180 meses</option><option value="240">240 meses</option><option value="360">360 meses</option></select></div><div class="fcCleanField"><label>Balões anuais em %</label><input id="proBalloonPercent" type="number" min="0" max="40" value="${Number(document.getElementById('annualBalloonPercent')?.value||0)}"></div><div class="fcCleanField"><label>Qtd. balões</label><input id="proBalloonCount" type="number" min="0" value="${Number(document.getElementById('annualBalloonCount')?.value||0)}"></div><div class="fcCleanField"><label>Modelo</label><select id="proSystem"><option value="PRICE">PRICE</option><option value="SAC">SAC</option><option value="SACOC">SACOC</option><option value="SACRE">SACRE</option><option value="SAM">SAM / Misto</option></select></div><div class="fcCleanField"><label>Correção nos balões</label><select id="proBalloonCorrection"><option value="no">Não</option><option value="yes">Sim</option></select></div></div><div class="fcCleanResults" style="margin-top:12px"><div class="fcCleanResult"><small>Total</small><b>${fmt(t.total)}</b></div><div class="fcCleanResult"><small>Parcela</small><b>${fmt(t.payment)}</b></div><div class="fcCleanResult"><small>Entrada</small><b>${fmt(t.entryValue)}</b></div><div class="fcCleanResult"><small>Balões</small><b>${t.annualBalloon?.count&&t.annualBalloon?.percent?`${t.annualBalloon.percent}% · ${t.annualBalloon.count}x`:'-'}</b></div></div><div class="fcCleanActions" style="margin-top:12px"><button class="btn fcCleanPrimary primaryOne" type="button" data-pro-send>Preparar proposta</button><button class="btn fcCleanSecondary primaryOne" type="button" data-pro-pdf>Salvar PDF</button></div>`;}if(stage==='proposta')return `<div class="fcCleanSimGrid"><div class="fcCleanField"><label>Nome</label><input id="proBuyerName" type="text" value="${document.getElementById('buyerName')?.value||''}"></div><div class="fcCleanField"><label>WhatsApp</label><input id="proBuyerPhone" type="tel" value="${document.getElementById('buyerPhone')?.value||''}"></div><div class="fcCleanField"><label>E-mail</label><input id="proBuyerEmail" type="email" value="${document.getElementById('buyerEmail')?.value||''}"></div><div class="fcCleanField"><label>Cidade</label><input id="proBuyerCity" type="text" value="${document.getElementById('buyerCity')?.value||''}"></div><div class="fcCleanField full"><label>Observação</label><textarea id="proBuyerNote">${document.getElementById('buyerNote')?.value||''}</textarea></div></div><div class="fcCleanActions" style="margin-top:12px"><button class="btn fcCleanPrimary primaryOne" type="button" data-pro-whatsapp>Enviar proposta</button><button class="btn fcCleanSecondary" type="button" data-pro-copy>Copiar</button><button class="btn fcCleanSecondary" type="button" data-pro-pdf>PDF</button></div>`;return `<div class="fcCleanEmpty">Etapa em preparação.</div>`;}
function fcCleanSummary(){const route=fcProActiveRoute();const t=getTotals();const lotText=route?.mode==='home'?'Não se aplica':(state.lot?.name||'A escolher');const homeText=route?.mode==='lot'?'Não se aplica':(state.home?.name||'A escolher');return `<div class="fcCleanSummary"><div class="fcCleanSummaryRows"><div class="fcCleanSummaryRow"><span>Lote</span><b>${lotText}</b></div><div class="fcCleanSummaryRow"><span>Casa</span><b>${homeText}</b></div><div class="fcCleanSummaryRow"><span>Jornada</span><b>${route?.title||'Não escolhida'}</b></div></div><div class="fcCleanTotal">${fmt(t.total||0)}</div><div class="fcCleanToolBox">${fcCleanTools()}</div></div>`;}
function fcCleanTools(){const lot=state.lot;const b=[];if(lot)b.push(`<button class="btn fcCleanSecondary" type="button" data-clean-route-lot="${lot.id}">Abrir rota no Google Maps</button>`);if(lot)b.push(`<button class="btn fcCleanGhost" type="button" data-pro-ar="${lot.id}">Ver no local (AR)</button>`);if(lot&&(fcPro.route==='combo'||state.home))b.push(`<button class="btn fcCleanSecondary" type="button" data-pro-generate-house>Gerar imagem por IA</button>`);return b.length?b.join(''):`<span style="color:rgba(255,255,255,.62);font-weight:800">As ferramentas aparecem no momento certo.</span>`;}
fcProRender=function(){let app=document.getElementById('futuraCasaProApp');if(!app){const legacy=document.querySelector('main');if(legacy)legacy.classList.add('legacyMain');app=document.createElement('main');app.id='futuraCasaProApp';(legacy||document.body).insertAdjacentElement(legacy?'beforebegin':'afterbegin',app);document.body.classList.add('fcProActive');}document.body.classList.add('fcProActive');const route=fcProActiveRoute();const [title,text]=fcCleanHeaderText();app.innerHTML=`<div class="fcCleanShell"><div class="fcCleanTopbar"><div class="fcCleanBrand"><span class="fcCleanBrandMark"></span><div><b>Futura Casa Pro</b><small>Compra guiada, uma decisão por vez</small></div></div><div class="fcCleanTopActions"><a class="fcCleanClassic" href="gestao.html">Gestão</a><a class="fcCleanClassic" href="pos-venda.html">Pós-venda</a><a class="fcCleanClassic" href="ocorrencias.html">Ocorrências</a><button class="fcCleanClassic" type="button" data-pro-classic>Modo clássico</button></div></div><div class="fcCleanMain"><section class="fcCleanIntro"><div><span class="fcProBadge">Futura Casa Pro</span><h1>${route?'Próximo passo claro.':'O que você quer montar hoje?'}</h1><p>${route?'Sem cardápio inteiro na tela. A cada etapa, uma ação principal e ferramentas no momento certo.':'Escolha primeiro a jornada. Depois a plataforma guia a compra como um consultor digital.'}</p></div><div class="fcCleanRoutes">${fcCleanRouteButtons()}</div><div class="fcCleanBenefitList"><div class="fcCleanBenefit"><span class="fcCleanBenefitIcon">⌁</span><div><b>Menos poluição</b><small>Uma decisão por vez, sem empilhar funções.</small></div></div><div class="fcCleanBenefit"><span class="fcCleanBenefitIcon">◎</span><div><b>AR no momento certo</b><small>Depois do lote escolhido, não na entrada.</small></div></div><div class="fcCleanBenefit"><span class="fcCleanBenefitIcon">▣</span><div><b>IA quando faz sentido</b><small>Casa no lote depois de definir lote + casa.</small></div></div></div></section><section class="fcCleanPhone"><div class="fcCleanPhoneHead"><div class="fcCleanPhoneHeadTop"><div><span class="tag">${fcCleanRouteTitle(fcPro.route)}</span><h2>${title}</h2><p>${text}</p></div></div></div>${fcCleanSteps()}<div class="fcCleanContent">${fcCleanBody()}</div>${fcCleanSummary()}</section></div></div>`;fcProSyncSimulatorControls?.();};
function mapsDirectionsUrl(lot,origin=null){const dest=lotDestination(lot);if(!dest)return '';const label=pointDisplayName(lot);const destination=`${label} @ ${dest.lat},${dest.lng}`;const params=new URLSearchParams({api:'1',destination,travelmode:'driving'});if(origin)params.set('origin',`${origin.lat},${origin.lng}`);return `https://www.google.com/maps/dir/?${params.toString()}`;}
function openRouteToLot(id){const lot=resolveSelectableLot(id);if(!lot)return;const dest=lotDestination(lot);if(!dest){toast('Este lote ainda não tem coordenada técnica para abrir rota.');return;}const url=mapsDirectionsUrl(lot);const opened=window.open(url,'_blank','noopener');if(!opened)window.location.href=url;toast(`Abrindo Google Maps para ${pointDisplayName(lot)}.`);}
document.addEventListener('click',event=>{const cleanRoute=event.target.closest('[data-clean-route-lot],[data-route-lot],[data-map-route]');if(cleanRoute){const id=cleanRoute.dataset.cleanRouteLot||cleanRoute.dataset.routeLot||cleanRoute.dataset.mapRoute;if(id){event.preventDefault();event.stopImmediatePropagation();openRouteToLot(id);}}},true);
fcProRender();


/* v2.4 — overrides: logo real, textos para usuário final, botões padronizados e resumo ajustado */
(function(){
  function fcV24BenefitList(){
    return `
      <div class="fcCleanBenefit"><span class="fcCleanBenefitIcon">⌂</span><div><b>Escolha sua jornada</b><small>Comece por lote, lote + casa ou casa para o seu lote.</small></div></div>
      <div class="fcCleanBenefit"><span class="fcCleanBenefitIcon">◎</span><div><b>Veja antes de decidir</b><small>Mapa, rota, AR e imagem ajudam a enxergar melhor cada escolha.</small></div></div>
      <div class="fcCleanBenefit"><span class="fcCleanBenefitIcon">↗</span><div><b>Avance para a proposta</b><small>Simule valores e encaminhe sua escolha para atendimento.</small></div></div>
    `;
  }

  fcCleanHeaderText = function(){
    const route = fcProActiveRoute();
    if(!route) return ['Escolha sua jornada.','Primeiro diga o que deseja montar. A próxima tela mostra apenas o caminho correspondente.'];
    const m = {
      lote:['Escolha o lote.','Veja opções recomendadas e selecione a localização que faz sentido para você.'],
      mapa:['Confira a localização.','Use mapa, rota e realidade aumentada para validar o lote escolhido.'],
      casa:['Escolha a casa.','Compare modelos e avance para visualizar a composição.'],
      visualizar:['Visualize sua escolha.','Gere uma imagem da casa no lote ou avance para a simulação.'],
      simular:['Simule os valores.','Ajuste entrada, prazo, balões e condições para preparar a proposta.'],
      proposta:['Envie sua proposta.','Finalize seus dados para um consultor validar disponibilidade e condições.']
    };
    return m[fcProCurrentStage()] || [route.title, route.prompt];
  };

  fcCleanBody = function(){
    const route = fcProActiveRoute();
    if(!route){
      return `<div class="fcCleanEmpty"><b>Escolha o que quer montar.</b><br>Lote, lote + casa ou casa para o lote que você já tem.</div>`;
    }
    const stage = fcProCurrentStage();

    if(stage === 'lote'){
      return `<div class="fcCleanCardGrid">${fcCleanRecommendedLots().map(fcCleanLotCard).join('')}</div>
        <button class="btn fcCleanSecondary" type="button" data-pro-classic style="margin-top:12px;width:100%">Ver todos os lotes</button>`;
    }

    if(stage === 'casa'){
      return `<div class="fcCleanCardGrid">${fcCleanRecommendedHomes().map(fcCleanHomeCard).join('')}</div>
        <button class="btn fcCleanSecondary" type="button" data-pro-classic style="margin-top:12px;width:100%">Ver todas as casas</button>`;
    }

    if(stage === 'mapa'){
      const lot = state.lot;
      return `<div class="fcCleanMap"><img src="${FC_CLEAN_MAP}" alt="Mapa Solaris"><div class="fcMapOverlay">${lot && typeof fcMarkerHtml==='function'?fcMarkerHtml(lot,true):''}</div></div>
        <div class="fcCleanActions" style="margin-top:12px">
          <button class="btn fcCleanPrimary primaryOne" type="button" data-pro-go-sim>Simular este lote</button>
          <button class="btn fcCleanSecondary" type="button" data-clean-route-lot="${lot?.id||''}">Abrir rota no Google Maps</button>
          <button class="btn fcCleanGhost" type="button" data-pro-ar="${lot?.id||''}">Ver no local (AR)</button>
        </div>`;
    }

    if(stage === 'visualizar'){
      const lot = state.lot;
      const needsLot = fcPro.route !== 'home' && !lot;
      return `<div class="fcCleanCard">
        <span class="fcCleanTag">Visualização</span>
        <h3>${fcPro.route === 'home' ? 'Aplicar casa ao meu lote' : 'Ver casa neste lote'}</h3>
        <p class="muted">${needsLot ? 'Escolha um lote antes de gerar a imagem.' : 'A imagem ajuda a visualizar melhor a composição antes da simulação.'}</p>
        <div class="fcCleanActions">
          <button class="btn fcCleanPrimary primaryOne" type="button" data-pro-generate-house>${lot ? 'Gerar imagem por IA' : 'Informar lote e gerar imagem'}</button>
          ${lot ? `<button class="btn fcCleanSecondary" type="button" data-clean-route-lot="${lot.id}">Abrir rota no Google Maps</button><button class="btn fcCleanGhost" type="button" data-pro-ar="${lot.id}">Ver no local (AR)</button>` : ''}
          <button class="btn fcCleanSecondary primaryOne" type="button" data-pro-go-sim>Ir para simulação</button>
        </div>
      </div>`;
    }

    if(stage === 'simular'){
      const t = getTotals();
      return `<div class="fcCleanSimGrid">
        <div class="fcCleanField"><label>Entrada em %</label><input id="proEntryPercent" type="number" min="0" max="90" value="${Number(document.getElementById('entryPercent')?.value||20)}"></div>
        <div class="fcCleanField"><label>Prazo</label><select id="proTerm"><option value="120">120 meses</option><option value="180">180 meses</option><option value="240">240 meses</option><option value="360">360 meses</option></select></div>
        <div class="fcCleanField"><label>Balões anuais em %</label><input id="proBalloonPercent" type="number" min="0" max="40" value="${Number(document.getElementById('annualBalloonPercent')?.value||0)}"></div>
        <div class="fcCleanField"><label>Qtd. balões</label><input id="proBalloonCount" type="number" min="0" value="${Number(document.getElementById('annualBalloonCount')?.value||0)}"></div>
        <div class="fcCleanField"><label>Modelo</label><select id="proSystem"><option value="PRICE">PRICE</option><option value="SAC">SAC</option><option value="SACOC">SACOC</option><option value="SACRE">SACRE</option><option value="SAM">SAM / Misto</option></select></div>
        <div class="fcCleanField"><label>Correção nos balões</label><select id="proBalloonCorrection"><option value="no">Não</option><option value="yes">Sim</option></select></div>
      </div>
      <div class="fcCleanResults" style="margin-top:12px">
        <div class="fcCleanResult"><small>Total</small><b>${fmt(t.total)}</b></div>
        <div class="fcCleanResult"><small>Parcela</small><b>${fmt(t.payment)}</b></div>
        <div class="fcCleanResult"><small>Entrada</small><b>${fmt(t.entryValue)}</b></div>
        <div class="fcCleanResult"><small>Balões</small><b>${t.annualBalloon?.count&&t.annualBalloon?.percent?`${t.annualBalloon.percent}% · ${t.annualBalloon.count}x`:'-'}</b></div>
      </div>
      <div class="fcCleanActions" style="margin-top:12px">
        <button class="btn fcCleanPrimary primaryOne" type="button" data-pro-send>Preparar proposta</button>
        <button class="btn fcCleanSecondary primaryOne" type="button" data-pro-pdf>Salvar PDF</button>
      </div>`;
    }

    if(stage === 'proposta'){
      return `<div class="fcCleanSimGrid">
        <div class="fcCleanField"><label>Nome</label><input id="proBuyerName" type="text" value="${document.getElementById('buyerName')?.value||''}"></div>
        <div class="fcCleanField"><label>WhatsApp</label><input id="proBuyerPhone" type="tel" value="${document.getElementById('buyerPhone')?.value||''}"></div>
        <div class="fcCleanField"><label>E-mail</label><input id="proBuyerEmail" type="email" value="${document.getElementById('buyerEmail')?.value||''}"></div>
        <div class="fcCleanField"><label>Cidade</label><input id="proBuyerCity" type="text" value="${document.getElementById('buyerCity')?.value||''}"></div>
        <div class="fcCleanField full"><label>Observação</label><textarea id="proBuyerNote">${document.getElementById('buyerNote')?.value||''}</textarea></div>
      </div>
      <div class="fcCleanActions" style="margin-top:12px">
        <button class="btn fcCleanPrimary primaryOne" type="button" data-pro-whatsapp>Enviar proposta</button>
        <button class="btn fcCleanSecondary" type="button" data-pro-copy>Copiar resumo</button>
        <button class="btn fcCleanSecondary" type="button" data-pro-pdf>Salvar PDF</button>
      </div>`;
    }
    return `<div class="fcCleanEmpty">Etapa em preparação.</div>`;
  };

  fcCleanSummary = function(){
    const route = fcProActiveRoute();
    const t = getTotals();
    const lotText = route?.mode === 'home' ? 'Não se aplica' : (state.lot?.name || 'A escolher');
    const homeText = route?.mode === 'lot' ? 'Não se aplica' : (state.home?.name || 'A escolher');
    return `<div class="fcCleanSummary">
      <div class="fcCleanSummaryRows">
        <div class="fcCleanSummaryRow"><span>Lote</span><b>${lotText}</b></div>
        <div class="fcCleanSummaryRow"><span>Casa</span><b>${homeText}</b></div>
        <div class="fcCleanSummaryRow"><span>Jornada</span><b>${route?.title||'Não escolhida'}</b></div>
      </div>
      <div class="fcCleanTotal">${fmt(t.total||0)}</div>
      <div class="fcCleanToolBox">${fcCleanTools()}</div>
    </div>`;
  };

  fcCleanTools = function(){
    const lot = state.lot;
    const buttons = [];
    if(lot) buttons.push(`<button class="btn fcCleanSecondary" type="button" data-clean-route-lot="${lot.id}">Abrir rota no Google Maps</button>`);
    if(lot) buttons.push(`<button class="btn fcCleanGhost" type="button" data-pro-ar="${lot.id}">Ver no local (AR)</button>`);
    if(lot && (fcPro.route === 'combo' || state.home)) buttons.push(`<button class="btn fcCleanSecondary" type="button" data-pro-generate-house>Gerar imagem por IA</button>`);
    return buttons.length ? buttons.join('') : `<span style="color:rgba(255,255,255,.62);font-weight:800">As opções avançam conforme sua escolha.</span>`;
  };

  fcProRender = function(){
    let app=document.getElementById('futuraCasaProApp');
    if(!app){
      const legacy=document.querySelector('main');
      if(legacy) legacy.classList.add('legacyMain');
      app=document.createElement('main');
      app.id='futuraCasaProApp';
      (legacy||document.body).insertAdjacentElement(legacy?'beforebegin':'afterbegin',app);
      document.body.classList.add('fcProActive');
    }
    document.body.classList.add('fcProActive');
    const route=fcProActiveRoute();
    const [title,text]=fcCleanHeaderText();
    app.innerHTML=`<div class="fcCleanShell">
      <div class="fcCleanTopbar">
        <div class="fcCleanBrand">
          <img class="fcCleanLogoMain" src="assets/futura-casa-logo-v1-1.webp" alt="Futura Casa Pro">
          <div class="fcCleanBrandText"><b>Futura Casa Pro</b><small>Compra guiada</small></div>
        </div>
        <div class="fcCleanTopActions">
          <a class="fcCleanClassic" href="index.html">Vendas</a>
          <a class="fcCleanClassic" href="gestao.html">Gestão</a>
          <a class="fcCleanClassic" href="pos-venda.html">Pós-venda</a>
          <a class="fcCleanClassic" href="ocorrencias.html">Ocorrências</a>
          <button class="fcCleanClassic" type="button" data-pro-classic>Modo clássico</button>
        </div>
      </div>
      <div class="fcCleanMain">
        <section class="fcCleanIntro">
          <div><span class="fcProBadge">Futura Casa Pro</span><h1>${route?'Siga sua jornada.':'O que você quer montar hoje?'}</h1><p>${route?'Escolha, visualize, simule e envie sua proposta com orientação em cada etapa.':'Escolha primeiro a jornada. Depois a plataforma guia o próximo passo.'}</p></div>
          <div class="fcCleanRoutes">${fcCleanRouteButtons()}</div>
          <div class="fcCleanBenefitList">${fcV24BenefitList()}</div>
        </section>
        <section class="fcCleanPhone">
          <div class="fcCleanPhoneHead"><div class="fcCleanPhoneHeadTop"><div><span class="tag">${fcCleanRouteTitle(fcPro.route)}</span><h2>${title}</h2><p>${text}</p></div></div></div>
          ${fcCleanSteps()}
          <div class="fcCleanContent">${fcCleanBody()}</div>
          ${fcCleanSummary()}
        </section>
      </div>
    </div>`;
    fcProSyncSimulatorControls?.();
  };

  fcProRender();
})();
