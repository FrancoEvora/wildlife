(() => {
  'use strict';

  const STORAGE_KEY = 'caderno-campo-state-v1';
  const DB_NAME = 'caderno-campo-media-v1';
  const DB_VERSION = 1;
  const MEDIA_STORE = 'media';

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  let state = loadState();
  let currentLocation = null;
  let watchId = null;
  let timerInterval = null;
  let returnInterval = null;
  let mediaDbPromise = null;
  let siren = { ctx: null, oscillator: null, gain: null, interval: null, active: false };
  let torch = { stream: null, track: null, active: false };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    bindNavigation();
    bindTrailControls();
    bindObservationControls();
    bindRiskControls();
    bindSafetyControls();
    bindPortfolioControls();
    bindBackupControls();
    bindStatusWatchers();
    registerServiceWorker();
    openMediaDb().catch(() => null);
    hydrateSettingsForm();
    renderAll();
    refreshGpsOnce();
    startReturnChecker();
  }

  function defaultState() {
    return {
      activeTrail: null,
      trails: [],
      observations: [],
      risks: [],
      sosEvents: [],
      settings: {
        plannedReturn: '',
        emergencyPhone: '',
        trustedContacts: '',
        medicalInfo: '',
        returnAlertSentFor: ''
      }
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || typeof parsed !== 'object') return defaultState();
      return {
        ...defaultState(),
        ...parsed,
        settings: { ...defaultState().settings, ...(parsed.settings || {}) },
        trails: Array.isArray(parsed.trails) ? parsed.trails : [],
        observations: Array.isArray(parsed.observations) ? parsed.observations : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks : [],
        sosEvents: Array.isArray(parsed.sosEvents) ? parsed.sosEvents : []
      };
    } catch (error) {
      console.warn('Falha ao ler dados locais', error);
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function bindNavigation() {
    $$('.nav-btn').forEach((button) => {
      button.addEventListener('click', () => showScreen(button.dataset.target));
    });
  }

  function showScreen(name) {
    $$('.screen').forEach((screen) => screen.classList.remove('active'));
    $$('.nav-btn').forEach((button) => button.classList.remove('active'));
    $(`screen-${name}`).classList.add('active');
    const activeButton = document.querySelector(`.nav-btn[data-target="${name}"]`);
    if (activeButton) activeButton.classList.add('active');
    if (name === 'seguranca') updateEmergencyMessage();
  }

  function bindTrailControls() {
    $('btnStartTrail').addEventListener('click', () => $('trailModal').classList.remove('hidden'));
    $('btnCancelTrail').addEventListener('click', () => $('trailModal').classList.add('hidden'));
    $('btnEndTrail').addEventListener('click', endTrail);
    $('startTrailForm').addEventListener('submit', (event) => {
      event.preventDefault();
      startTrail();
    });
    $('btnPrintTrail').addEventListener('click', () => window.print());
  }

  function startTrail() {
    const name = $('trailNameInput').value.trim();
    if (!name) return;

    state.activeTrail = {
      id: uid('trail'),
      name,
      place: $('trailPlaceInput').value.trim(),
      startNotes: $('trailStartNotes').value.trim(),
      startTime: new Date().toISOString(),
      endTime: '',
      points: [],
      distanceMeters: 0,
      observations: [],
      risks: []
    };
    saveState();
    $('startTrailForm').reset();
    $('trailModal').classList.add('hidden');
    startGpsWatch();
    startTimer();
    renderAll();
    toast('Trilha iniciada. GPS em gravação quando disponível.');
  }

  function endTrail() {
    if (!state.activeTrail) return;
    const ok = confirm('Finalizar esta trilha e salvar no histórico?');
    if (!ok) return;

    state.activeTrail.endTime = new Date().toISOString();
    state.trails.unshift(state.activeTrail);
    state.activeTrail = null;
    saveState();
    stopGpsWatch();
    stopTimer();
    renderAll();
    toast('Trilha finalizada e salva.');
  }

  function bindObservationControls() {
    $('observationForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      await saveObservation();
    });
    $('btnUseLocationObs').addEventListener('click', () => useCurrentLocationFor('obs'));
    $('obsSearch').addEventListener('input', renderObservations);
  }

  async function saveObservation() {
    const media = [];
    const fieldPhoto = $('obsFieldPhoto').files[0];
    const audio = $('obsAudio').files[0];

    if (fieldPhoto) media.push(await storeMediaFile(fieldPhoto, 'fieldPhoto'));
    if (audio) media.push(await storeMediaFile(audio, 'audio'));

    const loc = getFormOrCurrentLocation('obs');
    const observation = {
      id: uid('obs'),
      trailId: state.activeTrail ? state.activeTrail.id : '',
      createdAt: new Date().toISOString(),
      type: $('obsType').value,
      status: $('obsStatus').value,
      species: $('obsSpecies').value.trim(),
      behavior: $('obsBehavior').value.trim(),
      habitat: $('obsHabitat').value.trim(),
      notes: $('obsNotes').value.trim(),
      location: loc,
      media,
      professionalPhotos: []
    };

    state.observations.unshift(observation);
    if (state.activeTrail) state.activeTrail.observations.push(observation.id);
    saveState();
    $('observationForm').reset();
    clearHiddenLocation('obs');
    renderAll();
    toast('Avistamento salvo.');
  }

  function bindRiskControls() {
    $('riskForm').addEventListener('submit', (event) => {
      event.preventDefault();
      saveRisk();
    });
    $('btnUseLocationRisk').addEventListener('click', () => useCurrentLocationFor('risk'));
  }

  function saveRisk() {
    const loc = getFormOrCurrentLocation('risk');
    const risk = {
      id: uid('risk'),
      trailId: state.activeTrail ? state.activeTrail.id : '',
      createdAt: new Date().toISOString(),
      type: $('riskType').value,
      severity: $('riskSeverity').value,
      notes: $('riskNotes').value.trim(),
      location: loc
    };

    state.risks.unshift(risk);
    if (state.activeTrail) state.activeTrail.risks.push(risk.id);
    saveState();
    $('riskForm').reset();
    clearHiddenLocation('risk');
    renderAll();
    toast('Ponto salvo no mapa pessoal.');
  }

  function bindSafetyControls() {
    $('safetyForm').addEventListener('submit', (event) => {
      event.preventDefault();
      state.settings.plannedReturn = inputDateToIso($('plannedReturn').value);
      state.settings.emergencyPhone = $('emergencyPhone').value.trim();
      state.settings.trustedContacts = $('trustedContacts').value.trim();
      state.settings.medicalInfo = $('medicalInfo').value.trim();
      state.settings.returnAlertSentFor = '';
      saveState();
      updateReturnStatus();
      updateEmergencyMessage();
      toast('Plano de segurança salvo.');
    });

    $('btnActivateSOS').addEventListener('click', activateSOS);
    $('btnStopSOS').addEventListener('click', stopSOS);
    $('btnSiren').addEventListener('click', toggleSiren);
    $('btnLight').addEventListener('click', toggleLight);
    $('btnShareLocation').addEventListener('click', () => shareText(buildEmergencyText(false)));
    $('btnCopyLocation').addEventListener('click', () => copyText(buildEmergencyText(false)));
    $('btnShareSOS').addEventListener('click', () => shareText(buildEmergencyText(true)));
    $('btnCallEmergency').addEventListener('click', callEmergency);
  }

  function bindPortfolioControls() {
    $('portfolioForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      await addProfessionalPhoto();
    });
  }

  async function addProfessionalPhoto() {
    const obsId = $('portfolioObservation').value;
    const observation = state.observations.find((item) => item.id === obsId);
    const file = $('portfolioPhoto').files[0];
    if (!observation) {
      toast('Escolha uma observação para vincular a foto.');
      return;
    }
    if (!file) {
      toast('Selecione uma foto profissional.');
      return;
    }

    const media = await storeMediaFile(file, 'professionalPhoto');
    observation.professionalPhotos = observation.professionalPhotos || [];
    observation.professionalPhotos.push({
      ...media,
      cameraModel: $('cameraModel').value.trim(),
      lensModel: $('lensModel').value.trim(),
      focalLength: $('focalLength').value.trim(),
      shotSettings: $('shotSettings').value.trim(),
      note: $('portfolioNote').value.trim()
    });

    if (observation.status === 'Não identificado' && observation.species) {
      observation.status = 'Identificação provável';
    }

    saveState();
    $('portfolioForm').reset();
    renderAll();
    toast('Foto profissional adicionada ao registro.');
  }

  function bindBackupControls() {
    $('btnExport').addEventListener('click', exportJson);
    $('importJson').addEventListener('change', importJson);
    $('btnClearAll').addEventListener('click', clearAllData);
  }

  function exportJson() {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'Caderno de Campo',
      note: 'Backup de dados estruturados. Arquivos de mídia permanecem no armazenamento local do navegador.',
      state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `caderno-campo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importJson(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const incoming = parsed.state || parsed;
        if (!incoming || !Array.isArray(incoming.observations) || !Array.isArray(incoming.trails)) {
          throw new Error('Formato inválido');
        }
        state = {
          ...defaultState(),
          ...incoming,
          settings: { ...defaultState().settings, ...(incoming.settings || {}) }
        };
        saveState();
        hydrateSettingsForm();
        renderAll();
        toast('Backup importado.');
      } catch (error) {
        alert('Não consegui importar este arquivo JSON.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  async function clearAllData() {
    const ok = confirm('Apagar trilhas, observações, riscos e mídia deste navegador? Esta ação não pode ser desfeita.');
    if (!ok) return;
    stopSOS();
    stopGpsWatch();
    stopTimer();
    state = defaultState();
    saveState();
    try {
      const db = await openMediaDb();
      const tx = db.transaction(MEDIA_STORE, 'readwrite');
      tx.objectStore(MEDIA_STORE).clear();
    } catch (error) {
      console.warn('Falha ao limpar mídia', error);
    }
    hydrateSettingsForm();
    renderAll();
    toast('Dados apagados.');
  }

  function bindStatusWatchers() {
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }

  function updateOnlineStatus() {
    const el = $('onlineStatus');
    if (navigator.onLine) {
      el.textContent = 'online';
      el.className = 'pill good';
    } else {
      el.textContent = 'offline';
      el.className = 'pill danger';
    }
  }

  function refreshGpsOnce() {
    if (!navigator.geolocation) {
      $('gpsStatus').textContent = 'GPS indisponível';
      $('gpsStatus').className = 'pill danger';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => updateCurrentLocation(position),
      () => {
        $('gpsStatus').textContent = 'GPS aguardando';
        $('gpsStatus').className = 'pill muted';
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 8000 }
    );
  }

  function startGpsWatch() {
    if (!navigator.geolocation) return;
    if (watchId !== null) return;
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        updateCurrentLocation(position);
        recordTrackPoint(position);
      },
      (error) => {
        $('gpsStatus').textContent = `GPS: ${error.message}`;
        $('gpsStatus').className = 'pill danger';
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );
  }

  function stopGpsWatch() {
    if (watchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    $('gpsStatus').textContent = currentLocation ? 'GPS pronto' : 'GPS inativo';
    $('gpsStatus').className = currentLocation ? 'pill good' : 'pill muted';
  }

  function updateCurrentLocation(position) {
    currentLocation = normalizePosition(position);
    $('gpsStatus').textContent = `GPS ±${Math.round(currentLocation.accuracy || 0)}m`;
    $('gpsStatus').className = 'pill good';
    updateStats();
    updateEmergencyMessage();
  }

  function normalizePosition(position) {
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy || null,
      altitude: position.coords.altitude,
      timestamp: new Date(position.timestamp || Date.now()).toISOString()
    };
  }

  function recordTrackPoint(position) {
    if (!state.activeTrail) return;
    const point = normalizePosition(position);
    const points = state.activeTrail.points;
    const previous = points[points.length - 1];

    if (previous) {
      const meters = haversineMeters(previous, point);
      const elapsed = Math.abs(new Date(point.timestamp) - new Date(previous.timestamp));
      if (meters < 5 && elapsed < 20000) return;
      state.activeTrail.distanceMeters += meters;
    }

    points.push(point);
    saveState();
    updateStats();
  }

  function useCurrentLocationFor(prefix) {
    if (currentLocation) {
      setHiddenLocation(prefix, currentLocation);
      toast('Localização atual vinculada ao registro.');
      return;
    }
    if (!navigator.geolocation) {
      toast('GPS não disponível neste aparelho.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateCurrentLocation(position);
        setHiddenLocation(prefix, currentLocation);
        toast('Localização vinculada.');
      },
      () => toast('Não consegui obter localização agora.'),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 }
    );
  }

  function setHiddenLocation(prefix, loc) {
    $(`${prefix}Lat`).value = loc.lat;
    $(`${prefix}Lng`).value = loc.lng;
  }

  function clearHiddenLocation(prefix) {
    $(`${prefix}Lat`).value = '';
    $(`${prefix}Lng`).value = '';
  }

  function getFormOrCurrentLocation(prefix) {
    const lat = parseFloat($(`${prefix}Lat`).value);
    const lng = parseFloat($(`${prefix}Lng`).value);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng, accuracy: currentLocation?.accuracy || null, altitude: currentLocation?.altitude || null, timestamp: new Date().toISOString() };
    }
    return currentLocation ? { ...currentLocation } : null;
  }

  function startTimer() {
    stopTimer();
    timerInterval = setInterval(updateStats, 1000);
  }

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }

  function startReturnChecker() {
    if (returnInterval) clearInterval(returnInterval);
    returnInterval = setInterval(checkReturnTime, 30000);
    checkReturnTime();
  }

  function checkReturnTime() {
    updateReturnStatus();
    const planned = state.settings.plannedReturn;
    if (!planned || !state.activeTrail) return;
    const plannedTime = new Date(planned).getTime();
    if (!Number.isFinite(plannedTime)) return;
    if (Date.now() > plannedTime && state.settings.returnAlertSentFor !== state.activeTrail.id) {
      state.settings.returnAlertSentFor = state.activeTrail.id;
      saveState();
      alert('Sua previsão de retorno foi ultrapassada. Confirme sua segurança ou compartilhe localização.');
      showScreen('seguranca');
    }
  }

  function renderAll() {
    renderTrailHeader();
    updateStats();
    updateReturnStatus();
    renderObservations();
    renderTrails();
    renderPortfolioOptions();
    updateEmergencyMessage();
  }

  function renderTrailHeader() {
    if (!state.activeTrail) {
      $('activeTrailName').textContent = 'Nenhuma trilha iniciada';
      $('activeTrailMeta').textContent = 'Inicie uma trilha para gravar rota, tempo, pontos e observações.';
      $('btnStartTrail').classList.remove('hidden');
      $('btnEndTrail').classList.add('hidden');
      return;
    }
    $('activeTrailName').textContent = state.activeTrail.name;
    const place = state.activeTrail.place ? ` · ${state.activeTrail.place}` : '';
    $('activeTrailMeta').textContent = `Iniciada em ${formatDateTime(state.activeTrail.startTime)}${place}`;
    $('btnStartTrail').classList.add('hidden');
    $('btnEndTrail').classList.remove('hidden');
    startTimer();
    startGpsWatch();
  }

  function updateStats() {
    const trail = state.activeTrail;
    if (!trail) {
      $('statDistance').textContent = '0,00 km';
      $('statDuration').textContent = '00:00';
      $('statPoints').textContent = '0';
      $('statAltitude').textContent = currentLocation?.altitude ? `${Math.round(currentLocation.altitude)} m` : '—';
      return;
    }
    $('statDistance').textContent = formatKm(trail.distanceMeters || 0);
    $('statDuration').textContent = formatDuration(Date.now() - new Date(trail.startTime).getTime());
    $('statPoints').textContent = String(trail.points.length);
    const last = trail.points[trail.points.length - 1] || currentLocation;
    $('statAltitude').textContent = last?.altitude !== null && last?.altitude !== undefined ? `${Math.round(last.altitude)} m` : '—';
  }

  async function renderObservations() {
    const list = $('observationsList');
    const query = $('obsSearch').value.trim().toLowerCase();
    const observations = state.observations.filter((obs) => {
      if (!query) return true;
      const haystack = [obs.type, obs.status, obs.species, obs.behavior, obs.habitat, obs.notes].join(' ').toLowerCase();
      return haystack.includes(query);
    });

    list.innerHTML = '';
    if (!observations.length) {
      list.textContent = query ? 'Nenhum resultado para esse filtro.' : 'Nenhum avistamento registrado ainda.';
      list.classList.add('empty-state');
      return;
    }
    list.classList.remove('empty-state');

    const template = $('observationTemplate');
    for (const obs of observations) {
      const node = template.content.firstElementChild.cloneNode(true);
      const title = obs.species || obs.type || 'Observação';
      node.querySelector('.item-title').textContent = title;
      node.querySelector('.item-type').textContent = obs.type;
      node.querySelector('.item-meta').textContent = buildObservationMeta(obs);
      node.querySelector('.item-notes').textContent = [obs.behavior, obs.habitat, obs.notes].filter(Boolean).join(' · ');

      const mediaRow = node.querySelector('.media-row');
      addChip(mediaRow, obs.status);
      if (obs.media?.length) addChip(mediaRow, `${obs.media.length} mídia de campo`);
      if (obs.professionalPhotos?.length) addChip(mediaRow, `${obs.professionalPhotos.length} foto profissional`);

      const firstImage = [...(obs.media || []), ...(obs.professionalPhotos || [])].find((item) => (item.type || '').startsWith('image/'));
      const thumb = node.querySelector('.thumb');
      if (firstImage) {
        loadMediaUrl(firstImage.id).then((url) => {
          if (!url) return;
          const img = document.createElement('img');
          img.src = url;
          img.alt = title;
          thumb.innerHTML = '';
          thumb.appendChild(img);
        });
      } else {
        thumb.textContent = iconForType(obs.type);
      }

      list.appendChild(node);
    }
  }

  function renderTrails() {
    const list = $('trailsList');
    const trails = [...(state.activeTrail ? [{ ...state.activeTrail, isActive: true }] : []), ...state.trails];
    list.innerHTML = '';
    if (!trails.length) {
      list.textContent = 'Nenhuma trilha concluída.';
      list.classList.add('empty-state');
      return;
    }
    list.classList.remove('empty-state');
    const template = $('trailTemplate');
    trails.forEach((trail) => {
      const node = template.content.firstElementChild.cloneNode(true);
      const obsCount = trail.observations?.length || state.observations.filter((obs) => obs.trailId === trail.id).length;
      const riskCount = trail.risks?.length || state.risks.filter((risk) => risk.trailId === trail.id).length;
      node.querySelector('.item-title').textContent = `${trail.name}${trail.isActive ? ' · em andamento' : ''}`;
      node.querySelector('.item-distance').textContent = formatKm(trail.distanceMeters || 0);
      node.querySelector('.item-meta').textContent = `${formatDateTime(trail.startTime)} · ${trail.place || 'local não informado'} · ${obsCount} observações · ${riskCount} riscos`;
      node.querySelector('.item-notes').textContent = trail.startNotes || 'Sem nota inicial.';
      node.querySelector('.trail-details').textContent = buildTrailDetails(trail);
      list.appendChild(node);
    });
  }

  function renderPortfolioOptions() {
    const select = $('portfolioObservation');
    const currentValue = select.value;
    select.innerHTML = '';
    if (!state.observations.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Nenhuma observação disponível';
      select.appendChild(option);
      return;
    }
    state.observations.forEach((obs) => {
      const option = document.createElement('option');
      option.value = obs.id;
      option.textContent = `${formatDate(obs.createdAt)} · ${obs.species || obs.type}`;
      select.appendChild(option);
    });
    if (currentValue && state.observations.some((obs) => obs.id === currentValue)) {
      select.value = currentValue;
    }
  }

  function hydrateSettingsForm() {
    $('plannedReturn').value = isoToInputDate(state.settings.plannedReturn);
    $('emergencyPhone').value = state.settings.emergencyPhone || '';
    $('trustedContacts').value = state.settings.trustedContacts || '';
    $('medicalInfo').value = state.settings.medicalInfo || '';
  }

  function updateReturnStatus() {
    const el = $('returnStatus');
    if (!state.settings.plannedReturn) {
      el.textContent = 'não configurado';
      el.className = 'pill muted';
      return;
    }
    const planned = new Date(state.settings.plannedReturn);
    if (Date.now() > planned.getTime()) {
      el.textContent = 'retorno vencido';
      el.className = 'pill danger';
    } else {
      el.textContent = `retorno: ${formatDateTime(planned.toISOString())}`;
      el.className = 'pill good';
    }
  }

  function updateEmergencyMessage() {
    $('emergencyMessage').value = buildEmergencyText(false);
    $('sosCoordinates').textContent = buildCoordinateLine();
    const loc = getBestLocation();
    $('sosMeta').textContent = loc ? `Última atualização: ${formatDateTime(loc.timestamp || new Date().toISOString())}` : 'GPS ainda não disponível.';
  }

  function buildEmergencyText(isSOS) {
    const loc = getBestLocation();
    const trailName = state.activeTrail?.name || lastTrailName() || 'não informada';
    const coords = loc ? `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}` : 'localização indisponível';
    const maps = loc ? `https://maps.google.com/?q=${loc.lat},${loc.lng}` : '';
    const phone = state.settings.emergencyPhone ? `Telefone de emergência local: ${state.settings.emergencyPhone}` : '';
    const medical = state.settings.medicalInfo ? `Informações médicas: ${state.settings.medicalInfo}` : '';
    const contacts = state.settings.trustedContacts ? `Contatos de confiança: ${state.settings.trustedContacts}` : '';
    return [
      isSOS ? 'SOS: preciso de ajuda na trilha.' : 'Localização de segurança da trilha.',
      `Trilha/local: ${trailName}`,
      `Coordenadas: ${coords}`,
      maps ? `Mapa: ${maps}` : '',
      loc?.altitude !== null && loc?.altitude !== undefined ? `Altitude aproximada: ${Math.round(loc.altitude)} m` : '',
      loc?.accuracy ? `Precisão aproximada do GPS: ±${Math.round(loc.accuracy)} m` : '',
      `Horário da mensagem: ${formatDateTime(new Date().toISOString())}`,
      phone,
      contacts,
      medical
    ].filter(Boolean).join('\n');
  }

  function buildCoordinateLine() {
    const loc = getBestLocation();
    if (!loc) return 'Localização ainda não disponível.';
    return `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;
  }

  function getBestLocation() {
    if (currentLocation) return currentLocation;
    if (state.activeTrail?.points?.length) return state.activeTrail.points[state.activeTrail.points.length - 1];
    const lastTrail = state.trails.find((trail) => trail.points?.length);
    if (lastTrail) return lastTrail.points[lastTrail.points.length - 1];
    const obs = state.observations.find((item) => item.location);
    return obs?.location || null;
  }

  function lastTrailName() {
    if (state.trails[0]) return state.trails[0].name;
    return '';
  }

  function activateSOS() {
    state.sosEvents.unshift({ id: uid('sos'), createdAt: new Date().toISOString(), location: getBestLocation() });
    saveState();
    $('sosOverlay').classList.remove('hidden');
    updateEmergencyMessage();
    startSiren();
    startLight();
  }

  function stopSOS() {
    stopSiren();
    stopLight();
    $('sosOverlay').classList.add('hidden');
  }

  function toggleSiren() {
    siren.active ? stopSiren() : startSiren();
  }

  function toggleLight() {
    torch.active || document.body.classList.contains('sos-flash') ? stopLight() : startLight();
  }

  function startSiren() {
    if (siren.active) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        toast('Áudio não disponível neste navegador.');
        return;
      }
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = 650;
      gain.gain.value = 0.06;
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start();
      let high = false;
      const interval = setInterval(() => {
        high = !high;
        oscillator.frequency.setTargetAtTime(high ? 1150 : 650, ctx.currentTime, 0.06);
      }, 420);
      siren = { ctx, oscillator, gain, interval, active: true };
      $('btnSiren').textContent = 'Parar sirene';
    } catch (error) {
      console.warn('Falha na sirene', error);
      toast('Não consegui iniciar a sirene.');
    }
  }

  function stopSiren() {
    try {
      if (siren.interval) clearInterval(siren.interval);
      if (siren.oscillator) siren.oscillator.stop();
      if (siren.ctx) siren.ctx.close();
    } catch (error) {
      console.warn('Falha ao parar sirene', error);
    }
    siren = { ctx: null, oscillator: null, gain: null, interval: null, active: false };
    $('btnSiren').textContent = 'Sirene';
  }

  async function startLight() {
    document.body.classList.add('sos-flash');
    $('btnLight').textContent = 'Parar luz';
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        await track.applyConstraints({ advanced: [{ torch: true }] });
        torch = { stream, track, active: true };
      } else {
        stream.getTracks().forEach((item) => item.stop());
      }
    } catch (error) {
      console.warn('Lanterna não disponível, usando tela como fallback', error);
    }
  }

  function stopLight() {
    document.body.classList.remove('sos-flash');
    try {
      if (torch.track) torch.track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => null);
      if (torch.stream) torch.stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.warn('Falha ao desligar lanterna', error);
    }
    torch = { stream: null, track: null, active: false };
    $('btnLight').textContent = 'Luz';
  }

  async function shareText(text) {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Caderno de Campo', text });
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }
    copyText(text);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Texto copiado.');
    } catch (error) {
      $('emergencyMessage').value = text;
      $('emergencyMessage').select();
      toast('Copie o texto exibido no campo de emergência.');
    }
  }

  function callEmergency() {
    const phone = (state.settings.emergencyPhone || '').replace(/[^0-9+]/g, '');
    if (!phone) {
      toast('Cadastre um telefone de emergência no plano de segurança.');
      return;
    }
    window.location.href = `tel:${phone}`;
  }

  function buildObservationMeta(obs) {
    const parts = [formatDateTime(obs.createdAt), obs.status];
    const trail = findTrail(obs.trailId);
    if (trail) parts.push(trail.name);
    if (obs.location) parts.push(`${obs.location.lat.toFixed(5)}, ${obs.location.lng.toFixed(5)}`);
    return parts.filter(Boolean).join(' · ');
  }

  function findTrail(id) {
    if (!id) return null;
    if (state.activeTrail?.id === id) return state.activeTrail;
    return state.trails.find((trail) => trail.id === id) || null;
  }

  function buildTrailDetails(trail) {
    const duration = trail.endTime
      ? formatDuration(new Date(trail.endTime).getTime() - new Date(trail.startTime).getTime())
      : formatDuration(Date.now() - new Date(trail.startTime).getTime());
    const trailRisks = state.risks.filter((risk) => risk.trailId === trail.id);
    const trailObs = state.observations.filter((obs) => obs.trailId === trail.id);
    const lastPoint = trail.points?.[trail.points.length - 1];
    return [
      `Início: ${formatDateTime(trail.startTime)}`,
      `Fim: ${trail.endTime ? formatDateTime(trail.endTime) : 'em andamento'}`,
      `Duração: ${duration}`,
      `Distância: ${formatKm(trail.distanceMeters || 0)}`,
      `Pontos GPS: ${trail.points?.length || 0}`,
      lastPoint ? `Último ponto: ${lastPoint.lat.toFixed(6)}, ${lastPoint.lng.toFixed(6)}` : 'Último ponto: não disponível',
      '',
      `Observações (${trailObs.length}):`,
      ...trailObs.slice(0, 8).map((obs) => `- ${formatDate(obs.createdAt)} · ${obs.species || obs.type} · ${obs.status}`),
      trailObs.length > 8 ? `- ...mais ${trailObs.length - 8}` : '',
      '',
      `Riscos/pontos úteis (${trailRisks.length}):`,
      ...trailRisks.slice(0, 8).map((risk) => `- ${risk.type} · ${risk.severity} · ${risk.notes || 'sem nota'}`),
      trailRisks.length > 8 ? `- ...mais ${trailRisks.length - 8}` : ''
    ].filter((line) => line !== '').join('\n');
  }

  function addChip(container, text) {
    const chip = document.createElement('span');
    chip.className = 'media-chip';
    chip.textContent = text;
    container.appendChild(chip);
  }

  function iconForType(type) {
    const map = {
      'Ave': '🪶',
      'Mamífero': '🐾',
      'Réptil': '🦎',
      'Anfíbio': '🐸',
      'Inseto': '🦋',
      'Planta': '🌿',
      'Fungo': '🍄',
      'Pegada/rastro': '🐾',
      'Som/canto': '♪',
      'Outro': '•'
    };
    return map[type] || '•';
  }

  function haversineMeters(a, b) {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  function formatKm(meters) {
    return `${(meters / 1000).toFixed(2).replace('.', ',')} km`;
  }

  function formatDuration(ms) {
    if (!Number.isFinite(ms) || ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('pt-BR');
  }

  function inputDateToIso(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }

  function isoToInputDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  }

  function toast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    Object.assign(el.style, {
      position: 'fixed',
      left: '50%',
      bottom: '92px',
      transform: 'translateX(-50%)',
      background: '#17231b',
      color: '#fffdf8',
      padding: '12px 14px',
      borderRadius: '999px',
      zIndex: 200,
      fontWeight: 800,
      maxWidth: '92vw',
      boxShadow: '0 12px 40px rgba(0,0,0,.22)'
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }

  function openMediaDb() {
    if (mediaDbPromise) return mediaDbPromise;
    mediaDbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB indisponível'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(MEDIA_STORE)) db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return mediaDbPromise;
  }

  async function storeMediaFile(file, kind) {
    const id = uid('media');
    const record = {
      id,
      kind,
      name: file.name,
      type: file.type,
      size: file.size,
      createdAt: new Date().toISOString(),
      blob: file
    };
    const db = await openMediaDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE, 'readwrite');
      tx.objectStore(MEDIA_STORE).put(record);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    return { id, kind, name: file.name, type: file.type, size: file.size, createdAt: record.createdAt };
  }

  async function loadMediaUrl(id) {
    try {
      const db = await openMediaDb();
      const record = await new Promise((resolve, reject) => {
        const tx = db.transaction(MEDIA_STORE, 'readonly');
        const request = tx.objectStore(MEDIA_STORE).get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return record?.blob ? URL.createObjectURL(record.blob) : '';
    } catch (error) {
      console.warn('Falha ao carregar mídia', error);
      return '';
    }
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('Service worker não registrado', error));
    });
  }
})();
