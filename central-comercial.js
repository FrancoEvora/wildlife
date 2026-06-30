
/* Futura Casa Pro v3.0 — Central Comercial Autônoma */
const AI_STORE = {
  leads:'fc30_leads',
  conversations:'fc30_conversations',
  recommendations:'fc30_recommendations',
  actions:'fc30_agent_actions',
  handoffs:'fc30_handoffs',
  tasks:'fc30_tasks',
  objections:'fc30_objections',
  brokers:'fc30_brokers',
  products:'fc30_products',
  followups:'fc30_followups',
  campaigns:'fc30_campaigns'
};

const AI_ALLOWED_ACTIONS = [
  'Qualificar lead',
  'Recomendar produto disponível',
  'Enviar informações aprovadas',
  'Agendar visita',
  'Enviar simulação dentro das regras',
  'Registrar CRM',
  'Reativar lead',
  'Alertar corretor',
  'Alertar gestor',
  'Sugerir próxima ação'
];

const AI_BLOCKED_ACTIONS = [
  'Inventar disponibilidade de lote',
  'Prometer desconto fora da regra',
  'Garantir aprovação de crédito',
  'Dar parecer jurídico',
  'Prometer valorização garantida',
  'Alterar condição comercial sem autorização',
  'Confirmar reserva sem regra definida',
  'Enviar contrato sem validação humana',
  'Fazer pressão abusiva',
  'Usar dados pessoais fora da finalidade comercial'
];

function aiRead(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f));}catch(e){return f;}}
function aiWrite(k,v){localStorage.setItem(k,JSON.stringify(v));}
function aiId(prefix){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;}
function aiDate(){return new Date().toISOString();}
function aiDaysAgo(n){const d=new Date();d.setDate(d.getDate()-n);return d.toISOString();}
function aiMoney(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(v||0));}
function aiNum(v){return Number(String(v||'').replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.')) || 0;}
function aiToast(msg){ if(typeof toast==='function') toast(msg); }

function seedAutonomousCommercial(){
  if(!aiRead(AI_STORE.products,null)){
    const products = (FC?.lots||[]).map((l,idx)=>({
      id:l.id,
      empreendimento:'Solaris Home Resort',
      quadra:l.quadra,
      unidade:l.lote,
      valor:l.valor,
      metragem:l.area,
      status:l.status === 'Disponível' ? 'Disponível' : l.status,
      perfilIdeal: idx % 4 === 0 ? ['Família','Moradia'] : idx % 4 === 1 ? ['Investidor','Revenda'] : idx % 4 === 2 ? ['Construtor'] : ['Comercial','Investidor'],
      teseComercial: idx % 3 === 0 ? 'Lote com boa implantação para moradia e construção futura.' : idx % 3 === 1 ? 'Produto com liquidez e potencial de revenda por metragem e posição.' : 'Lote estratégico para composição lote + casa.',
      melhorArgumento: idx % 3 === 0 ? 'Qualidade de vida, bairro planejado e segurança.' : idx % 3 === 1 ? 'Liquidez, valorização relativa e entrada acessível.' : 'Metragem, implantação e flexibilidade de projeto.',
      objecaoProvavel: idx % 3 === 0 ? 'Preço' : idx % 3 === 1 ? 'Parcela alta' : 'Prazo de decisão',
      liquidez: idx % 3 === 0 ? 'Alta' : idx % 3 === 1 ? 'Média' : 'Baixa',
      prioridade: idx % 4 === 0 ? 'Caixa' : idx % 4 === 1 ? 'Estratégico' : 'Normal',
      tags:[l.status, l.perfil, l.rua, l.dims].filter(Boolean),
      condicoesPermitidas:{entradaMinPercent:20, prazoMaxMeses:240, balaoMaxPercent:40, descontoMaxPercent:idx%2===0?3:0},
      tempoEstoqueDias: 12 + idx*18,
      ofertado: 8 + idx*4,
      visitas: 1 + idx*2,
      propostas: idx%2===0 ? 2 : 0,
      motivoNaoConversao: idx%2===0 ? 'Aguardando decisão familiar' : 'Poucas ofertas ao perfil correto',
      estrategiaRecomendada: idx%2===0 ? 'Priorizar visita presencial' : 'Reposicionar narrativa e ofertar para investidor'
    }));
    aiWrite(AI_STORE.products, products);
  }
  if(!aiRead(AI_STORE.brokers,null)){
    aiWrite(AI_STORE.brokers, [
      {id:'cor-ana', nome:'Ana Pereira', disponibilidade:true, tempoMedioRespostaMin:4, especialidades:['Família','Moradia','Lote + casa'], performance:{Família:0.38,Investidor:0.22,Construtor:0.24,Comercial:0.18}, empreendimento:['Solaris Home Resort'], carga:3},
      {id:'cor-lucas', nome:'Lucas Martins', disponibilidade:true, tempoMedioRespostaMin:7, especialidades:['Investidor','Revenda','Comercial'], performance:{Família:0.21,Investidor:0.41,Construtor:0.27,Comercial:0.33}, empreendimento:['Solaris Home Resort'], carga:2},
      {id:'cor-bianca', nome:'Bianca Rocha', disponibilidade:false, tempoMedioRespostaMin:13, especialidades:['Construtor','Lote + casa'], performance:{Família:0.26,Investidor:0.28,Construtor:0.44,Comercial:0.24}, empreendimento:['Solaris Home Resort'], carga:5},
      {id:'cor-mateus', nome:'Mateus Alves', disponibilidade:true, tempoMedioRespostaMin:9, especialidades:['Moradia','Família','Comercial'], performance:{Família:0.32,Investidor:0.25,Construtor:0.20,Comercial:0.36}, empreendimento:['Solaris Home Resort'], carga:1}
    ]);
  }
  if(!aiRead(AI_STORE.leads,null)){
    const leads = [
      mkLead({nome:'Mariana Silva', telefone:'34999990001', origem:'Meta Ads', campanha:'Solaris Família', cidade:'Uberlândia', objetivo:'Morar', entrada:120000, parcela:4500, prazo:'30 dias', regiao:'área verde', perfil:'Família', objecao:'Segurança e parcela', status:'Simulação enviada', score:88, probability:81, corretorId:'cor-ana', lastDays:0}),
      mkLead({nome:'Carlos Andrade', telefone:'34999990002', origem:'Google Ads', campanha:'Lote investimento', cidade:'Monte Carmelo', objetivo:'Investir', entrada:90000, parcela:3500, prazo:'60 dias', regiao:'boa liquidez', perfil:'Investidor', objecao:'Valorização', status:'Sem resposta', score:74, probability:68, corretorId:'cor-lucas', lastDays:2}),
      mkLead({nome:'Rafael Costa', telefone:'34999990003', origem:'WhatsApp', campanha:'Orgânico', cidade:'Patrocínio', objetivo:'Construir', entrada:150000, parcela:5000, prazo:'15 dias', regiao:'lote amplo', perfil:'Construtor', objecao:'Frente do lote', status:'Alta intenção', score:91, probability:84, corretorId:null, lastDays:0}),
      mkLead({nome:'Joana Lima', telefone:'34999990004', origem:'Instagram', campanha:'Casa futura', cidade:'Araguari', objetivo:'Comprar para família', entrada:70000, parcela:2800, prazo:'6 meses', regiao:'menor entrada', perfil:'Família', objecao:'Entrada alta', status:'Nutrição', score:53, probability:39, corretorId:null, lastDays:5}),
      mkLead({nome:'Marcelo Reis', telefone:'34999990005', origem:'Cadastro manual', campanha:'Base antiga', cidade:'Monte Carmelo', objetivo:'Revenda', entrada:200000, parcela:6000, prazo:'90 dias', regiao:'esquina', perfil:'Investidor', objecao:'Preço', status:'Reativação', score:69, probability:57, corretorId:'cor-lucas', lastDays:12})
    ];
    aiWrite(AI_STORE.leads, leads);
    aiWrite(AI_STORE.conversations, leads.map(l=>({id:aiId('conv'), lead_id:l.id, canal:l.origem.includes('WhatsApp')?'WhatsApp':'Formulário', mensagens:[`Lead entrou via ${l.origem}.`, `Objetivo detectado: ${l.objetivo}.`, `Objeção inicial: ${l.objecao}.`], resumo:`${l.nome} busca ${l.objetivo.toLowerCase()} com entrada de ${aiMoney(l.entrada)} e parcela ideal de ${aiMoney(l.parcela)}.`, sentimento:l.score>75?'positivo':l.score>50?'neutro':'frio', objeçõesDetectadas:[l.objecao], intençãoDetectada:l.score>75?'Alta intenção':l.score>50?'Média intenção':'Baixa intenção', proximaAcaoSugerida:l.nextAction||'Enviar simulação'})));
  }
  if(!aiRead(AI_STORE.actions,null)){
    aiWrite(AI_STORE.actions, [
      {id:aiId('act'), lead_id:'seed', tipo:'Sistema iniciado', agente:'Central Comercial Autônoma', status:'Concluído', resultado:'Base inicial gerada', at:aiDate(), approval:false}
    ]);
  }
  if(!aiRead(AI_STORE.campaigns,null)){
    aiWrite(AI_STORE.campaigns, [
      {id:'camp-meta-familia', campanha:'Solaris Família', canal:'Meta Ads', custo:2800, leads:43, visitas:11, propostas:5, vendas:2, receita:1184000},
      {id:'camp-google-invest', campanha:'Lote investimento', canal:'Google Ads', custo:1900, leads:27, visitas:9, propostas:4, vendas:1, receita:592000},
      {id:'camp-insta-casa', campanha:'Casa futura', canal:'Instagram', custo:1200, leads:39, visitas:4, propostas:1, vendas:0, receita:0},
      {id:'camp-base-antiga', campanha:'Base antiga', canal:'CRM', custo:0, leads:120, visitas:7, propostas:3, vendas:1, receita:478000}
    ]);
  }
}
function mkLead(x){
  return {
    id:aiId('lead'), nome:x.nome, telefone:x.telefone, origem:x.origem, campanha:x.campanha, cidade:x.cidade,
    perfil:x.perfil, objetivo:x.objetivo, entrada:x.entrada, parcela:x.parcela, prazoCompra:x.prazo, regiao:x.regiao,
    objecao:x.objecao, score:x.score, probability:x.probability, status:x.status, corretorId:x.corretorId,
    nextAction:x.score>82?'Acionar corretor':x.score>65?'Agendar visita':x.score>45?'Enviar material do empreendimento':'Reativar depois',
    ultimaInteracao:aiDaysAgo(x.lastDays||0),
    createdAt:aiDaysAgo(x.lastDays||0),
    origemHumana:false,
    humanActive:!!x.corretorId && x.score>80
  };
}

function parseLeadForm(){
  return {
    id:aiId('lead'),
    nome:$('#leadName')?.value || 'Lead sem nome',
    telefone:$('#leadPhone')?.value || '',
    origem:$('#leadSource')?.value || 'Manual',
    campanha:$('#leadCampaign')?.value || 'Não informada',
    cidade:$('#leadCity')?.value || '',
    objetivo:$('#leadObjective')?.value || 'Indefinido',
    entrada:aiNum($('#leadEntry')?.value),
    parcela:aiNum($('#leadInstallment')?.value),
    prazoCompra:$('#leadTimeline')?.value || 'Indefinido',
    regiao:$('#leadRegion')?.value || '',
    objecao:$('#leadObjection')?.value || detectObjection($('#leadMessage')?.value || ''),
    message:$('#leadMessage')?.value || '',
    createdAt:aiDate(),
    ultimaInteracao:aiDate(),
    status:'Novo',
    origemHumana:false,
    humanActive:false
  };
}

function detectProfile(lead){
  const txt = `${lead.objetivo} ${lead.message} ${lead.regiao}`.toLowerCase();
  if(/invest|revenda|valoriza|rentab|liquid/.test(txt)) return 'Investidor';
  if(/constr|obra|frente|implant|projeto/.test(txt)) return 'Construtor';
  if(/comerc|loja|empresa|negócio/.test(txt)) return 'Comercial';
  if(/fam[ií]lia|morar|seguran|filhos|casa/.test(txt)) return 'Família';
  return 'Comprador indefinido';
}
function detectObjective(lead){
  const txt = `${lead.objetivo} ${lead.message}`.toLowerCase();
  if(/invest|revenda|valoriza/.test(txt)) return 'Investir';
  if(/constr/.test(txt)) return 'Construir';
  if(/comerc|loja|empresa/.test(txt)) return 'Comprar para uso comercial';
  if(/fam[ií]lia/.test(txt)) return 'Comprar para família';
  if(/morar/.test(txt)) return 'Morar';
  return lead.objetivo || 'Indefinido';
}
function detectObjection(text){
  const t = String(text||'').toLowerCase();
  if(/preço|caro|valor/.test(t)) return 'Preço';
  if(/entrada/.test(t)) return 'Entrada alta';
  if(/parcela|prestação/.test(t)) return 'Parcela alta';
  if(/local/.test(t)) return 'Localização';
  if(/confian|seguran/.test(t)) return 'Falta de confiança';
  if(/prazo|entrega/.test(t)) return 'Prazo de entrega';
  if(/concorr/.test(t)) return 'Concorrência';
  if(/valoriza/.test(t)) return 'Dúvida sobre valorização';
  if(/fam[ií]lia|esposa|marido|pais/.test(t)) return 'Falta de aprovação familiar';
  if(/document/.test(t)) return 'Falta de documentação';
  return 'Falta de entendimento do produto';
}
function scoreLead(lead){
  let score = 25;
  const objective = detectObjective(lead);
  const profile = detectProfile(lead);
  if(['Morar','Investir','Construir','Comprar para família','Comprar para uso comercial'].includes(objective)) score += 15;
  if(lead.entrada >= 120000) score += 18; else if(lead.entrada >= 80000) score += 12; else if(lead.entrada >= 40000) score += 6;
  if(lead.parcela >= 4500) score += 16; else if(lead.parcela >= 3000) score += 10; else if(lead.parcela >= 1800) score += 5;
  const prazo = String(lead.prazoCompra||'').toLowerCase();
  if(/15|30|agora|imediato/.test(prazo)) score += 16; else if(/60|90/.test(prazo)) score += 10; else if(/6 meses/.test(prazo)) score += 4;
  const msg = String(lead.message||'').toLowerCase();
  if(/visita|proposta|simula|reserv|dispon/.test(msg)) score += 12;
  if(/só olhando|curioso|sem pressa/.test(msg)) score -= 18;
  score = Math.max(0, Math.min(100, score));
  const probability = Math.max(3, Math.min(96, Math.round(score*0.82 + (lead.entrada>100000?8:0) + (lead.parcela>4000?5:0))));
  return {score, probability, profile, objective};
}
function classifyLead(score, profile, objective){
  const classes = [];
  if(score >= 78) classes.push('Alta intenção');
  else if(score >= 55) classes.push('Média intenção');
  else if(score >= 32) classes.push('Baixa intenção');
  else classes.push('Curioso');
  if(profile === 'Investidor') classes.push('Investidor');
  if(profile === 'Família') classes.push('Moradia');
  if(profile === 'Construtor') classes.push('Construtor');
  if(profile === 'Comercial') classes.push('Comercial');
  return classes;
}
function leadNextAction(score, profile){
  if(score >= 82) return 'Acionar corretor';
  if(score >= 70) return 'Agendar visita';
  if(score >= 56) return 'Enviar simulação';
  if(score >= 38) return 'Enviar material do empreendimento';
  return 'Reativar depois';
}
function productCompatibility(lead, product){
  if(product.status !== 'Disponível') return -999;
  const profile = lead.profile || detectProfile(lead);
  const capacity = (lead.entrada||0) + (lead.parcela||0) * 120;
  let score = 0;
  if(product.perfilIdeal?.some(p => String(profile).toLowerCase().includes(String(p).toLowerCase()) || String(p).toLowerCase().includes(String(profile).toLowerCase()))) score += 25;
  if(product.valor <= capacity) score += 26; else score -= Math.min(30, Math.round((product.valor-capacity)/25000));
  if(product.liquidez === 'Alta') score += 12; else if(product.liquidez === 'Média') score += 6;
  if(product.prioridade === 'Caixa') score += 7;
  if(/moradia|família|morar/i.test(profile + lead.objetivo) && /vida|moradia|bairro|segurança/i.test(product.melhorArgumento)) score += 10;
  if(/investidor|revenda/i.test(profile) && /liquidez|revenda|valoriz/i.test(product.melhorArgumento + product.teseComercial)) score += 12;
  return score;
}
function recommendProducts(lead){
  const products = aiRead(AI_STORE.products, []);
  return products
    .filter(p => p.status === 'Disponível')
    .map(p => {
      const score = productCompatibility(lead,p);
      const compatible = score >= 20;
      return {
        id:aiId('rec'),
        lead_id:lead.id,
        product_id:p.id,
        scoreCompatibilidade:score,
        product:p,
        motivo: compatible ? `Compatível com ${lead.perfil || detectProfile(lead)} e capacidade estimada de ${aiMoney((lead.entrada||0)+(lead.parcela||0)*120)}.` : 'Compatibilidade parcial; revisar condição comercial.',
        argumento: p.melhorArgumento,
        riscoObjecao: p.objecaoProvavel,
        proximaAcao: score >= 55 ? 'Agendar visita' : score >= 35 ? 'Enviar simulação' : 'Enviar material aprovado'
      };
    })
    .filter(r => r.scoreCompatibilidade > 0)
    .sort((a,b)=>b.scoreCompatibilidade-a.scoreCompatibilidade)
    .slice(0,3);
}
function assignBroker(lead){
  const brokers = aiRead(AI_STORE.brokers, []);
  const profile = lead.profile || detectProfile(lead);
  const eligible = brokers.filter(b => b.disponibilidade);
  const scored = eligible.map(b => {
    let score = 0;
    if(b.especialidades?.some(e => String(profile).toLowerCase().includes(String(e).toLowerCase()) || String(e).toLowerCase().includes(String(profile).toLowerCase()))) score += 30;
    score += Math.round((b.performance?.[profile] || 0.2)*50);
    score += Math.max(0, 20 - b.tempoMedioRespostaMin);
    score -= (b.carga||0)*3;
    return {...b, assignScore:score};
  }).sort((a,b)=>b.assignScore-a.assignScore);
  return scored[0] || brokers[0] || null;
}
function addAction(leadId, tipo, agente, status, resultado, approval=false){
  const actions = aiRead(AI_STORE.actions, []);
  actions.unshift({id:aiId('act'), lead_id:leadId, tipo, agente, status, resultado, at:aiDate(), approval});
  aiWrite(AI_STORE.actions, actions);
}
function processLead(){
  const lead = parseLeadForm();
  const s = scoreLead(lead);
  lead.perfil = s.profile;
  lead.objetivo = s.objective;
  lead.score = s.score;
  lead.probability = s.probability;
  lead.classes = classifyLead(s.score, s.profile, s.objective);
  lead.nextAction = leadNextAction(s.score, s.profile);
  lead.status = s.score >= 78 ? 'Alta intenção' : s.score >= 55 ? 'Qualificado' : 'Nutrição';
  lead.objecao = lead.objecao || detectObjection(lead.message);
  const recs = recommendProducts(lead);
  const leads = aiRead(AI_STORE.leads, []);
  leads.unshift(lead);
  aiWrite(AI_STORE.leads, leads);
  aiWrite(AI_STORE.recommendations, [...recs, ...aiRead(AI_STORE.recommendations, [])]);

  const conversations = aiRead(AI_STORE.conversations, []);
  conversations.unshift({
    id:aiId('conv'), lead_id:lead.id, canal:lead.origem, mensagens:[
      `Lead recebido via ${lead.origem}.`,
      `Objetivo: ${lead.objetivo}. Perfil: ${lead.perfil}.`,
      `Entrada: ${aiMoney(lead.entrada)}. Parcela ideal: ${aiMoney(lead.parcela)}.`,
      `Objeção detectada: ${lead.objecao}.`
    ],
    resumo:`${lead.nome} deseja ${lead.objetivo.toLowerCase()}, perfil ${lead.perfil}, entrada de ${aiMoney(lead.entrada)} e parcela ideal de ${aiMoney(lead.parcela)}.`,
    sentimento:lead.score>=78?'positivo':lead.score>=55?'neutro':'frio',
    objeçõesDetectadas:[lead.objecao],
    intençãoDetectada:lead.classes[0],
    proximaAcaoSugerida:lead.nextAction
  });
  aiWrite(AI_STORE.conversations, conversations);

  addAction(lead.id,'Qualificação SDR IA','Agente SDR IA','Concluído',`Lead classificado como ${lead.classes.join(', ')}. Probabilidade ${lead.probability}%.`);

  if(recs[0]){
    addAction(lead.id,'Recomendação inteligente','Motor de recomendação','Concluído',`Produto sugerido: Quadra ${recs[0].product.quadra}, Lote ${recs[0].product.unidade}.`);
  }

  if(lead.score >= 78){
    const broker = assignBroker(lead);
    if(broker){
      lead.corretorId = broker.id;
      lead.humanActive = true;
      aiWrite(AI_STORE.leads, leads);
      const handoffs = aiRead(AI_STORE.handoffs, []);
      handoffs.unshift({
        id:aiId('handoff'), lead_id:lead.id, corretor_id:broker.id, motivo:'Lead qualificado com alta intenção',
        resumo:handoffSummary(lead, recs[0], broker),
        urgencia:lead.score>=88?'Imediata':'Alta',
        proximaAcao:lead.nextAction,
        status:'Enviado ao corretor',
        at:aiDate()
      });
      aiWrite(AI_STORE.handoffs, handoffs);
      addAction(lead.id,'Handoff para corretor','Agente SDR IA','Concluído',`Corretor ${broker.nome} acionado com contexto completo.`);
    }
  } else {
    const tasks = aiRead(AI_STORE.tasks, []);
    tasks.unshift({id:aiId('task'), responsavel:'Agente Follow-up IA', lead_id:lead.id, tipo:'Follow-up contextual', prioridade:lead.score>=55?'Média':'Baixa', prazo:aiDaysAgo(-2), status:'Aberta', resultado:'Aguardando execução'});
    aiWrite(AI_STORE.tasks, tasks);
  }

  renderCentral();
  aiToast('Lead processado pelo Agente SDR IA.');
}
function handoffSummary(lead, rec, broker){
  return `${lead.nome} · ${lead.perfil} · objetivo ${lead.objetivo}. Entrada ${aiMoney(lead.entrada)}, parcela ${aiMoney(lead.parcela)}. Objeção: ${lead.objecao}. Produto recomendado: ${rec ? 'Q'+rec.product.quadra+' Lote '+rec.product.unidade : 'revisar estoque'}. Probabilidade ${lead.probability}%. Próxima ação: ${lead.nextAction}.`;
}
function followupMessage(lead){
  const profile = lead.perfil || detectProfile(lead);
  const obj = String(lead.objecao||'').toLowerCase();
  if(profile === 'Investidor') return 'Enviar tese de valorização, liquidez, mapa da região e oportunidade de entrada.';
  if(profile === 'Família') return 'Enviar segurança, infraestrutura, qualidade de vida e convite para visita.';
  if(profile === 'Construtor') return 'Enviar metragem, frente, implantação e potencial de revenda.';
  if(/confiança|document/.test(obj)) return 'Enviar prova de obra, documentação aprovada e evolução do empreendimento.';
  return 'Enviar material aprovado e perguntar melhor horário para avançar.';
}
function runFollowup(leadId){
  const leads = aiRead(AI_STORE.leads, []);
  const lead = leads.find(l=>l.id===leadId);
  if(!lead) return;
  if(lead.humanActive){
    addAction(lead.id,'Follow-up pausado','Agente Follow-up IA','Pausado','Atendimento humano ativo detectado.');
    aiToast('Follow-up pausado: atendimento humano ativo.');
    renderCentral();
    return;
  }
  const msg = followupMessage(lead);
  lead.ultimaInteracao = aiDate();
  lead.status = 'Follow-up enviado';
  aiWrite(AI_STORE.leads, leads);
  const followups = aiRead(AI_STORE.followups, []);
  followups.unshift({id:aiId('fup'), lead_id:lead.id, mensagem:msg, status:'Enviado', at:aiDate()});
  aiWrite(AI_STORE.followups, followups);
  addAction(lead.id,'Follow-up autônomo','Agente Follow-up IA','Concluído',msg);
  aiToast('Follow-up contextual registrado.');
  renderCentral();
}
function createTask(leadId, type='Ligar para lead'){
  const tasks = aiRead(AI_STORE.tasks, []);
  tasks.unshift({id:aiId('task'), responsavel:'Gestor comercial', lead_id:leadId, tipo:type, prioridade:'Alta', prazo:aiDate(), status:'Aberta', resultado:''});
  aiWrite(AI_STORE.tasks, tasks);
  aiToast('Tarefa criada.');
  renderCentral();
}
function updateLeadStatus(leadId, status){
  const leads = aiRead(AI_STORE.leads, []);
  const lead = leads.find(l=>l.id===leadId);
  if(!lead) return;
  lead.status = status;
  lead.ultimaInteracao = aiDate();
  aiWrite(AI_STORE.leads, leads);
  addAction(lead.id,'Atualização de status','Usuário gestor','Concluído',`Status atualizado para ${status}.`);
  renderCentral();
}

function priorities(){
  const leads = aiRead(AI_STORE.leads, []);
  const handoffs = aiRead(AI_STORE.handoffs, []);
  const products = aiRead(AI_STORE.products, []);
  const campaigns = aiRead(AI_STORE.campaigns, []);
  const now = Date.now();
  const highNoBroker = leads.filter(l=>l.score>=78 && !l.corretorId);
  const noReturn = leads.filter(l=>now - new Date(l.ultimaInteracao).getTime() > 24*3600*1000 && l.score>=55);
  const risk = leads.filter(l=>/proposta|simulação/i.test(l.status||'') && now - new Date(l.ultimaInteracao).getTime() > 48*3600*1000);
  const oldInvest = leads.filter(l=>l.perfil==='Investidor' && now - new Date(l.ultimaInteracao).getTime() > 7*24*3600*1000);
  const underOffered = products.filter(p=>p.ofertado<10 && p.status==='Disponível');
  const badCampaigns = campaigns.filter(c=>c.leads>30 && c.vendas===0);
  const items = [];
  if(highNoBroker.length) items.push({title:`Acionar corretor para ${highNoBroker.length} lead(s) de alta intenção`, action:'Distribuir agora'});
  if(noReturn.length) items.push({title:`Responder ${noReturn.length} lead(s) sem retorno há mais de 24h`, action:'Rodar follow-up'});
  if(risk.length) items.push({title:`Recuperar ${risk.length} proposta(s) em risco`, action:'Criar tarefa'});
  if(oldInvest.length) items.push({title:`Reativar ${oldInvest.length} investidor(es) antigos`, action:'Enviar tese'});
  if(underOffered.length) items.push({title:`Ofertar ${underOffered.length} produto(s) pouco trabalhados`, action:'Revisar estoque'});
  if(badCampaigns.length) items.push({title:`Revisar campanha com muitos leads e pouca venda`, action:'Analisar campanha'});
  if(!items.length) items.push({title:'Nenhum alerta crítico no momento', action:'Monitorar'});
  return items.slice(0,6);
}
function objectionSummary(){
  const leads = aiRead(AI_STORE.leads, []);
  const counts = {};
  leads.forEach(l=>{counts[l.objecao||'Não informada']=(counts[l.objecao||'Não informada']||0)+1});
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([tipo,count])=>({
    tipo,count,
    argumento: objectionArgument(tipo),
    material: objectionMaterial(tipo),
    next: objectionNext(tipo)
  }));
}
function objectionArgument(tipo){
  const map = {
    'Preço':'Reforçar valor por m², infraestrutura entregue e comparação com alternativas.',
    'Entrada alta':'Apresentar cenário com entrada parcelada, balões anuais e simulação compatível.',
    'Parcela alta':'Ajustar prazo, entrada e composição lote + casa em fases.',
    'Localização':'Mostrar mapa, acessos, entorno, infraestrutura e tese de crescimento.',
    'Falta de confiança':'Enviar documentação, andamento de obra, registro e cases de compradores.',
    'Prazo de entrega':'Explicar cronograma, etapas de implantação e marcos de obra.',
    'Dúvida sobre valorização':'Mostrar vetores de valorização, liquidez e comparativos da região.',
    'Falta de aprovação familiar':'Agendar visita em família e enviar material visual simples.'
  };
  return map[tipo] || 'Entender a dúvida real e enviar material aprovado correspondente.';
}
function objectionMaterial(tipo){
  if(/confiança|documentação/i.test(tipo)) return 'Documentos, RI, fotos de obra e evolução.';
  if(/valoriza|preço/i.test(tipo)) return 'Mapa de região e tese comercial.';
  if(/parcela|entrada/i.test(tipo)) return 'Simulação editável.';
  return 'Material do empreendimento.';
}
function objectionNext(tipo){
  if(/entrada|parcela|preço/i.test(tipo)) return 'Oferecer simulação';
  if(/confiança|documentação/i.test(tipo)) return 'Acionar gestor se persistir';
  return 'Agendar visita';
}
function stockAlerts(){
  return aiRead(AI_STORE.products, []).map(p=>{
    const alerts = [];
    if(p.ofertado < 10 && p.status==='Disponível') alerts.push('Produto pouco ofertado');
    if(p.visitas>=5 && p.propostas===0) alerts.push('Visita sem proposta');
    if(p.propostas>=2 && p.status==='Disponível') alerts.push('Propostas sem fechamento');
    if(p.tempoEstoqueDias > 90) alerts.push('Tempo em estoque elevado');
    if(p.liquidez==='Baixa') alerts.push('Revisar narrativa comercial');
    return {...p, alerts};
  });
}
function forecast(){
  const leads = aiRead(AI_STORE.leads, []);
  const products = aiRead(AI_STORE.products, []);
  const weighted = leads.map(l=>{
    const rec = recommendProducts(l)[0];
    const productValue = rec?.product?.valor || products[0]?.valor || 0;
    return {lead:l, value:productValue, weight:(l.probability||0)/100};
  });
  const provaveis = weighted.filter(x=>x.lead.probability>=75);
  const possiveis = weighted.filter(x=>x.lead.probability>=50 && x.lead.probability<75);
  const risco = weighted.filter(x=>x.lead.probability>=35 && x.lead.probability<50);
  const receitaProvavel = Math.round(weighted.reduce((s,x)=>s+x.value*x.weight,0));
  return {
    vendasProvaveis:provaveis.length,
    vendasPossiveis:possiveis.length,
    vendasRisco:risco.length,
    receitaProvavel,
    gargalo: leads.filter(l=>!l.corretorId && l.score>=78).length ? 'Alta intenção sem corretor' : leads.filter(l=>/Sem resposta/i.test(l.status)).length ? 'Follow-up atrasado' : 'Distribuição equilibrada'
  };
}

function renderCentral(){
  seedAutonomousCommercial();
  const root = $('#centralApp');
  if(!root) return;
  const leads = aiRead(AI_STORE.leads, []);
  const brokers = aiRead(AI_STORE.brokers, []);
  const actions = aiRead(AI_STORE.actions, []);
  const products = stockAlerts();
  const obs = objectionSummary();
  const fc = forecast();
  const latest = leads[0];

  root.innerHTML = `
    <div class="grid cols-4">
      <div class="card card-pad metric"><small>Leads ativos</small><b>${leads.length}</b><small>${leads.filter(l=>l.score>=78).length} de alta intenção</small></div>
      <div class="card card-pad metric"><small>Alta intenção sem corretor</small><b>${leads.filter(l=>l.score>=78 && !l.corretorId).length}</b><small>acionar agora</small></div>
      <div class="card card-pad metric"><small>Follow-ups pendentes</small><b>${leads.filter(l=>Date.now()-new Date(l.ultimaInteracao).getTime()>24*3600*1000).length}</b><small>baseado na última interação</small></div>
      <div class="card card-pad metric"><small>VGV provável</small><b>${aiMoney(fc.receitaProvavel)}</b><small>${fc.vendasProvaveis} venda(s) prováveis</small></div>
    </div>

    <div class="ai-layout" style="margin-top:14px">
      <section class="ai-card">
        <span class="pill">Agente SDR IA</span>
        <h3>Novo lead</h3>
        <p class="ai-mini">O agente qualifica, recomenda produto, define próxima ação e registra tudo no CRM.</p>
        <div class="ai-form">
          <div class="field"><label>Origem</label><select id="leadSource"><option>WhatsApp</option><option>Formulário</option><option>Landing page</option><option>Meta Ads</option><option>Instagram</option><option>Google Ads</option><option>Cadastro manual</option></select></div>
          <div class="field"><label>Campanha</label><input id="leadCampaign" value="Solaris campanha ativa"></div>
          <div class="field"><label>Nome</label><input id="leadName" value="Novo Lead"></div>
          <div class="field"><label>Telefone</label><input id="leadPhone" value="34999990000"></div>
          <div class="field"><label>Cidade</label><input id="leadCity" value="Monte Carmelo"></div>
          <div class="field"><label>Objetivo</label><select id="leadObjective"><option>Morar</option><option>Investir</option><option>Construir</option><option>Comprar para família</option><option>Comprar para revenda</option><option>Comprar para uso comercial</option></select></div>
          <div class="field"><label>Entrada disponível</label><input id="leadEntry" value="120000"></div>
          <div class="field"><label>Parcela ideal</label><input id="leadInstallment" value="4500"></div>
          <div class="field"><label>Prazo de compra</label><select id="leadTimeline"><option>15 dias</option><option>30 dias</option><option>60 dias</option><option>90 dias</option><option>6 meses</option><option>Sem prazo definido</option></select></div>
          <div class="field"><label>Região preferida</label><input id="leadRegion" value="próximo de área verde"></div>
          <div class="field full"><label>Dúvida ou mensagem inicial</label><textarea id="leadMessage">Quero entender valores, entrada e se consigo visitar ainda esta semana.</textarea></div>
          <div class="field full"><label>Objeção percebida</label><input id="leadObjection" placeholder="Opcional"></div>
        </div>
        <div class="actions"><button class="btn primary" onclick="processLead()">Processar com Agente SDR IA</button></div>
      </section>

      <section class="ai-card">
        <span class="pill brand">Resultado atual</span>
        <h3>${latest ? latest.nome : 'Nenhum lead'}</h3>
        ${latest ? `
          <div class="grid cols-2">
            <div class="score-ring" style="--score:${latest.probability||0}"><div><b>${latest.probability||0}%</b><small>fechamento</small></div></div>
            <div class="grid">
              <span class="pill">${latest.classes?.[0] || (latest.score>=78?'Alta intenção':'Qualificado')}</span>
              <p><b>Perfil:</b> ${latest.perfil}<br><b>Objetivo:</b> ${latest.objetivo}<br><b>Próxima ação:</b> ${latest.nextAction}</p>
              <button class="btn secondary" onclick="createTask('${latest.id}')">Criar tarefa para gestor</button>
            </div>
          </div>
          <h3 style="margin-top:16px">Recomendações</h3>
          <div class="recommendation">${recommendProducts(latest).map((r,i)=>recHtml(r,i)).join('') || '<p class="ai-mini">Nenhuma recomendação compatível.</p>'}</div>
        ` : '<p class="ai-mini">Cadastre um lead para iniciar.</p>'}
      </section>
    </div>

    <div class="ai-layout" style="margin-top:14px">
      <section class="ai-card">
        <span class="pill">Torre de Controle</span>
        <h3>Prioridades do dia</h3>
        <div class="priority-list">${priorities().map(p=>`<div class="priority-item"><b>${p.title}</b><button class="btn secondary">${p.action}</button></div>`).join('')}</div>
      </section>

      <section class="ai-card">
        <span class="pill brand">Handoff inteligente</span>
        <h3>Corretores</h3>
        <div class="grid">${brokers.map(b=>`<div class="rec-card"><div style="display:flex;justify-content:space-between;gap:10px"><b>${b.nome}</b><span class="pill ${b.disponibilidade?'':'brand'}">${b.disponibilidade?'Disponível':'Indisponível'}</span></div><small class="ai-mini">Resposta média: ${b.tempoMedioRespostaMin} min · carga: ${b.carga} · especialidades: ${b.especialidades.join(', ')}</small></div>`).join('')}</div>
      </section>
    </div>

    <section class="ai-card" style="margin-top:14px">
      <span class="pill">CRM ativo</span>
      <h3>Pipeline com próxima ação</h3>
      <div class="table-wrap"><table class="table"><thead><tr><th>Lead</th><th>Origem</th><th>Perfil</th><th>Score</th><th>Prob.</th><th>Status</th><th>Próxima ação</th><th>Ações</th></tr></thead><tbody>
        ${leads.map(l=>`<tr><td><b>${l.nome}</b><br><small>${l.telefone}</small></td><td>${l.origem}<br><small>${l.campanha}</small></td><td>${l.perfil}<br><small>${l.objetivo}</small></td><td>${l.score}</td><td>${l.probability}%</td><td>${l.status}</td><td>${l.nextAction}</td><td><button class="btn secondary" onclick="runFollowup('${l.id}')">Follow-up</button><button class="btn ghost" onclick="updateLeadStatus('${l.id}','Proposta enviada')">Proposta</button></td></tr>`).join('')}
      </tbody></table></div>
    </section>

    <div class="ai-layout" style="margin-top:14px">
      <section class="ai-card">
        <span class="pill brand">Follow-up autônomo</span>
        <h3>Mensagens contextuais</h3>
        <div class="grid">${leads.slice(0,5).map(l=>`<div class="rec-card"><b>${l.nome}</b><small class="ai-mini">${followupMessage(l)}</small><button class="btn secondary" onclick="runFollowup('${l.id}')">${l.humanActive?'Verificar pausa':'Executar follow-up'}</button></div>`).join('')}</div>
      </section>

      <section class="ai-card">
        <span class="pill">Inteligência de objeções</span>
        <h3>Objeções recorrentes</h3>
        <div class="objection-grid">${obs.map(o=>`<div class="rec-card"><div style="display:flex;justify-content:space-between"><b>${o.tipo}</b><span class="pill brand">${o.count}</span></div><small class="ai-mini"><b>Argumento:</b> ${o.argumento}<br><b>Material:</b> ${o.material}<br><b>Próximo passo:</b> ${o.next}</small></div>`).join('')}</div>
      </section>
    </div>

    <section class="ai-card" style="margin-top:14px">
      <span class="pill">Inteligência de estoque</span>
      <h3>Estoque como tese comercial</h3>
      <div class="table-wrap"><table class="table stock-table"><thead><tr><th>Produto</th><th>Status</th><th>Perfil ideal</th><th>Tese comercial</th><th>Liquidez</th><th>Ofertado</th><th>Visitas</th><th>Propostas</th><th>Alertas</th></tr></thead><tbody>
        ${products.map(p=>`<tr><td><b>Q${p.quadra} · Lote ${p.unidade}</b><br><small>${aiMoney(p.valor)} · ${p.metragem.toLocaleString('pt-BR')} m²</small></td><td>${p.status}</td><td>${p.perfilIdeal.join(', ')}</td><td>${p.teseComercial}</td><td>${p.liquidez}</td><td>${p.ofertado}</td><td>${p.visitas}</td><td>${p.propostas}</td><td>${p.alerts?.length?p.alerts.map(a=>`<span class="pill brand">${a}</span>`).join(' '):'<span class="pill">OK</span>'}</td></tr>`).join('')}
      </tbody></table></div>
    </section>

    <div class="ai-layout" style="margin-top:14px">
      <section class="ai-card">
        <span class="pill">Forecast comercial</span>
        <h3>Previsão baseada no pipeline</h3>
        <div class="forecast-grid">
          <div class="card card-pad metric"><small>Vendas prováveis</small><b>${fc.vendasProvaveis}</b><small>prob. ≥ 75%</small></div>
          <div class="card card-pad metric"><small>Vendas possíveis</small><b>${fc.vendasPossiveis}</b><small>prob. 50–74%</small></div>
          <div class="card card-pad metric"><small>Em risco</small><b>${fc.vendasRisco}</b><small>prob. 35–49%</small></div>
          <div class="card card-pad metric"><small>VGV provável</small><b>${aiMoney(fc.receitaProvavel)}</b><small>${fc.gargalo}</small></div>
        </div>
      </section>

      <section class="ai-card">
        <span class="pill brand">Logs e governança</span>
        <h3>Ações do agente</h3>
        <div class="agent-log">${actions.slice(0,10).map(a=>`<div class="log-row"><b>${a.tipo}</b> · ${a.agente}<br><small>${new Date(a.at).toLocaleString('pt-BR')} · ${a.status} · ${a.resultado}</small></div>`).join('')}</div>
      </section>
    </div>

    <section class="ai-card" style="margin-top:14px">
      <span class="pill">Regras de segurança</span>
      <h3>Limites do agente comercial</h3>
      <div class="governance-list">
        <div class="rule-ok"><b>O agente pode</b><ul>${AI_ALLOWED_ACTIONS.map(x=>`<li>${x}</li>`).join('')}</ul></div>
        <div class="rule-no"><b>O agente não pode</b><ul>${AI_BLOCKED_ACTIONS.map(x=>`<li>${x}</li>`).join('')}</ul></div>
      </div>
    </section>
  `;
}
function recHtml(r,i){
  return `<div class="rec-card ${i===0?'selected':''}">
    <div style="display:flex;justify-content:space-between;gap:10px"><b>Quadra ${r.product.quadra} · Lote ${r.product.unidade}</b><span class="pill">${r.scoreCompatibilidade} pts</span></div>
    <small class="ai-mini"><b>Motivo:</b> ${r.motivo}<br><b>Argumento:</b> ${r.argumento}<br><b>Risco:</b> ${r.riscoObjecao}<br><b>Próxima ação:</b> ${r.proximaAcao}</small>
  </div>`;
}

document.addEventListener('DOMContentLoaded',()=>{
  seedAutonomousCommercial();
  renderCentral();
});
