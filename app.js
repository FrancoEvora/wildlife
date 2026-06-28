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
  let siren = { ctx: null, oscillators: [], gain: null, pulseInterval: null, active: false };
  let torch = { stream: null, track: null, active: false, interval: null, torchOn: false };
  let mapState = { map: null, currentMarker: null, trailLayer: null, observationLayer: null, riskLayer: null, hasTiles: false };
  let leafletLoadPromise = null;
  let mediaViewerObjectUrl = '';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    bindNavigation();
    bindTrailControls();
    bindObservationControls();
    bindRiskControls();
    bindSafetyControls();
    bindPortfolioControls();
    bindEquipmentControls();
    bindMapControls();
    bindMediaViewerControls();
    bindBackupControls();
    bindStatusWatchers();
    registerServiceWorker();
    openMediaDb().catch(() => null);
    hydrateSettingsForm();
    renderAll();
    refreshGpsOnce();
    startReturnChecker();
  }

  function defaultEquipment() {
    const cameras = ['Celular', 'iPhone', 'Samsung Galaxy', 'Canon EOS R/RF', 'Canon DSLR', 'Nikon Z', 'Nikon DSLR', 'Sony Alpha', 'Fujifilm X/GFX', 'OM System/Olympus', 'GoPro/action cam', 'Drone'];
    const lenses = ['Lente do celular', '24-70mm', '70-200mm', '100-400mm', '100-500mm', '150-600mm', '200-500mm', '300mm fixa', '400mm fixa', '500mm fixa', '600mm fixa', 'Macro 90/100/105mm'];
    const accessories = ['Nenhum', 'Tripé', 'Monopé', 'Binóculo', 'Gravador de áudio', 'Flash', 'Teleconverter 1.4x', 'Teleconverter 2x', 'Power bank'];
    return [
      ...cameras.map((name) => ({ id: uid('eq-camera'), category: 'Câmera', name })),
      ...lenses.map((name) => ({ id: uid('eq-lens'), category: 'Lente', name })),
      ...accessories.map((name) => ({ id: uid('eq-accessory'), category: 'Acessório', name }))
    ];
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
        returnAlertSentFor: '',
        equipment: defaultEquipment()
      }
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || typeof parsed !== 'object') return defaultState();
      const defaults = defaultState();
      const settings = { ...defaults.settings, ...(parsed.settings || {}) };
      if (!Array.isArray(settings.equipment) || !settings.equipment.length) settings.equipment = defaultEquipment();
      settings.equipment = settings.equipment
        .filter((item) => item && item.name)
        .map((item) => ({ id: item.id || uid('eq'), category: item.category || 'Acessório', name: item.name }));
      return {
        ...defaults,
        ...parsed,
        settings,
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
    if (name === 'mapa') {
      initMapIfNeeded();
      renderMap();
      setTimeout(() => mapState.map?.invalidateSize(), 120);
    }
  }

  function bindMapControls() {
    const locateButton = $('btnLocateOnMap');
    const fitButton = $('btnFitMap');
    const openButton = $('btnOpenGoogleMaps');
    const gpxButton = $('btnExportGpx');

    if (locateButton) locateButton.addEventListener('click', () => {
      refreshGpsOnce();
      showScreen('mapa');
      setTimeout(() => {
        if (currentLocation && mapState.map) mapState.map.setView([currentLocation.lat, currentLocation.lng], 16);
      }, 500);
    });
    if (fitButton) fitButton.addEventListener('click', fitMapToContent);
    if (openButton) openButton.addEventListener('click', openBestLocationInMaps);
    if (gpxButton) gpxButton.addEventListener('click', exportGpx);
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
    const csvButton = $('btnExportCsv');
    if (csvButton) csvButton.addEventListener('click', exportCsv);
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

  function bindEquipmentControls() {
    const form = $('equipmentForm');
    const list = $('equipmentList');
    if (!form || !list) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      addEquipment();
    });
    list.addEventListener('click', (event) => {
      const button = event.target.closest('[data-delete-equipment]');
      if (!button) return;
      deleteEquipment(button.dataset.deleteEquipment);
    });
  }

  function bindMediaViewerControls() {
    const closeButton = $('btnCloseMedia');
    const modal = $('mediaModal');
    if (closeButton) closeButton.addEventListener('click', closeMediaViewer);
    if (modal) {
      modal.addEventListener('click', (event) => {
        if (event.target === modal) closeMediaViewer();
      });
    }
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !$('mediaModal')?.classList.contains('hidden')) closeMediaViewer();
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
      cameraModel: getEquipmentValue('cameraModel', 'cameraOther'),
      lensModel: getEquipmentValue('lensModel', 'lensOther'),
      accessoryUsed: getEquipmentValue('accessoryUsed', 'accessoryOther'),
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

  function exportCsv() {
    if (!state.observations.length) {
      toast('Nenhuma observação para exportar.');
      return;
    }
    const headers = ['data', 'tipo', 'status', 'especie_ou_descricao', 'comportamento', 'ambiente', 'notas', 'latitude', 'longitude', 'trilha', 'midias_campo', 'fotos_profissionais'];
    const rows = state.observations.map((obs) => {
      const trail = findTrail(obs.trailId);
      return [
        formatDateTime(obs.createdAt),
        obs.type,
        obs.status,
        obs.species,
        obs.behavior,
        obs.habitat,
        obs.notes,
        obs.location?.lat ?? '',
        obs.location?.lng ?? '',
        trail?.name || '',
        obs.media?.length || 0,
        obs.professionalPhotos?.length || 0
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\n');
    downloadText(`caderno-campo-observacoes-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
  }

  function exportGpx() {
    const trail = state.activeTrail || state.trails[0];
    if (!trail || !trail.points?.length) {
      toast('Nenhuma trilha com pontos GPS para exportar.');
      return;
    }
    const name = trail.name || 'Trilha';
    const trkpts = trail.points.map((point) => {
      const ele = point.altitude !== null && point.altitude !== undefined ? `<ele>${Number(point.altitude).toFixed(1)}</ele>` : '';
      const time = point.timestamp ? `<time>${new Date(point.timestamp).toISOString()}</time>` : '';
      return `      <trkpt lat="${point.lat}" lon="${point.lng}">${ele}${time}</trkpt>`;
    }).join('\n');
    const waypoints = [
      ...state.observations.filter((obs) => obs.location).map((obs) => `  <wpt lat="${obs.location.lat}" lon="${obs.location.lng}"><name>${xmlEscape(obs.species || obs.type || 'Observação')}</name><desc>${xmlEscape(obs.notes || obs.status || '')}</desc></wpt>`),
      ...state.risks.filter((risk) => risk.location).map((risk) => `  <wpt lat="${risk.location.lat}" lon="${risk.location.lng}"><name>${xmlEscape(risk.type || 'Risco')}</name><desc>${xmlEscape((risk.severity || '') + ' ' + (risk.notes || ''))}</desc></wpt>`)
    ].join('\n');
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Caderno de Campo" xmlns="http://www.topografix.com/GPX/1/1">\n  <metadata><name>${xmlEscape(name)}</name><time>${new Date().toISOString()}</time></metadata>\n${waypoints ? waypoints + '\n' : ''}  <trk><name>${xmlEscape(name)}</name><trkseg>\n${trkpts}\n  </trkseg></trk>\n</gpx>\n`;
    const safeName = slugify(name) || 'trilha';
    downloadText(`caderno-campo-${safeName}-${new Date().toISOString().slice(0, 10)}.gpx`, gpx, 'application/gpx+xml;charset=utf-8');
  }

  function openBestLocationInMaps() {
    const loc = getBestLocation();
    if (!loc) {
      toast('Ainda não há coordenadas para abrir no mapa.');
      return;
    }
    window.open(`https://maps.google.com/?q=${loc.lat},${loc.lng}`, '_blank', 'noopener');
  }

  function downloadText(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function csvCell(value) {
    const text = String(value ?? '').replace(/\r?\n/g, ' ');
    return `"${text.replace(/"/g, '""')}"`;
  }

  function xmlEscape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
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
        const defaults = defaultState();
        const incomingSettings = incoming.settings || {};
        const equipment = sanitizeEquipment(incomingSettings.equipment || defaults.settings.equipment);
        state = {
          ...defaults,
          ...incoming,
          settings: { ...defaults.settings, ...incomingSettings, equipment }
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
    renderMap();
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
    renderMap();
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
    renderEquipmentOptions();
    renderEquipmentList();
    renderMap();
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

      const fieldMedia = obs.media || [];
      const professionalMedia = obs.professionalPhotos || [];
      fieldMedia.forEach((item, index) => addMediaButton(mediaRow, item, item.kind === 'audio' ? `Áudio ${index + 1}` : `Campo ${index + 1}`, obs));
      professionalMedia.forEach((item, index) => addMediaButton(mediaRow, item, `Profissional ${index + 1}`, obs));

      const firstImage = [...fieldMedia, ...professionalMedia].find((item) => (item.type || '').startsWith('image/'));
      const thumb = node.querySelector('.thumb');
      if (firstImage) {
        thumb.classList.add('is-clickable');
        thumb.title = 'Abrir foto';
        thumb.addEventListener('click', () => openMediaViewer(firstImage, title, obs));
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

  function getEquipmentValue(selectId, otherId) {
    const selected = $(selectId)?.value?.trim() || '';
    const other = $(otherId)?.value?.trim() || '';
    return other || selected;
  }

  function sanitizeEquipment(items) {
    const list = Array.isArray(items) ? items : defaultEquipment();
    return list
      .filter((item) => item && item.name)
      .map((item) => ({ id: item.id || uid('eq'), category: item.category || 'Acessório', name: String(item.name).trim() }))
      .filter((item) => item.name);
  }

  function renderEquipmentOptions() {
    const equipment = state.settings.equipment || [];
    fillEquipmentSelect($('cameraModel'), 'Câmera', 'Selecionar câmera');
    fillEquipmentSelect($('lensModel'), 'Lente', 'Selecionar lente');
    fillEquipmentSelect($('accessoryUsed'), 'Acessório', 'Nenhum acessório');

    function fillEquipmentSelect(select, category, placeholder) {
      if (!select) return;
      const currentValue = select.value;
      select.innerHTML = '';
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = placeholder;
      select.appendChild(empty);
      equipment
        .filter((item) => item.category === category)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        .forEach((item) => {
          const option = document.createElement('option');
          option.value = item.name;
          option.textContent = item.name;
          select.appendChild(option);
        });
      if (currentValue && Array.from(select.options).some((option) => option.value === currentValue)) select.value = currentValue;
    }
  }

  function renderEquipmentList() {
    const list = $('equipmentList');
    if (!list) return;
    const equipment = state.settings.equipment || [];
    list.innerHTML = '';
    if (!equipment.length) {
      list.classList.add('empty-state');
      list.textContent = 'Nenhum equipamento cadastrado.';
      return;
    }
    list.classList.remove('empty-state');
    ['Câmera', 'Lente', 'Acessório'].forEach((category) => {
      const groupItems = equipment.filter((item) => item.category === category).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      if (!groupItems.length) return;
      const group = document.createElement('div');
      group.className = 'equipment-group';
      const title = document.createElement('h3');
      title.textContent = category;
      group.appendChild(title);
      groupItems.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'equipment-item';
        const name = document.createElement('span');
        name.textContent = item.name;
        const remove = document.createElement('button');
        remove.className = 'ghost small';
        remove.type = 'button';
        remove.textContent = 'remover';
        remove.dataset.deleteEquipment = item.id;
        row.append(name, remove);
        group.appendChild(row);
      });
      list.appendChild(group);
    });
  }

  function addEquipment() {
    const category = $('equipmentCategory').value;
    const name = $('equipmentName').value.trim();
    if (!name) {
      toast('Digite o nome do equipamento.');
      return;
    }
    state.settings.equipment = state.settings.equipment || [];
    const exists = state.settings.equipment.some((item) => item.category === category && item.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      toast('Esse equipamento já está na lista.');
      return;
    }
    state.settings.equipment.push({ id: uid('eq'), category, name });
    saveState();
    $('equipmentForm').reset();
    renderEquipmentOptions();
    renderEquipmentList();
    toast('Equipamento adicionado.');
  }

  function deleteEquipment(id) {
    const item = (state.settings.equipment || []).find((entry) => entry.id === id);
    if (!item) return;
    const ok = confirm(`Remover “${item.name}” da lista de equipamentos?`);
    if (!ok) return;
    state.settings.equipment = (state.settings.equipment || []).filter((entry) => entry.id !== id);
    saveState();
    renderEquipmentOptions();
    renderEquipmentList();
    toast('Equipamento removido.');
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

  async function activateSOS() {
    state.sosEvents.unshift({ id: uid('sos'), createdAt: new Date().toISOString(), location: getBestLocation() });
    saveState();
    $('sosOverlay').classList.remove('hidden');
    $('sosOverlay').classList.add('flashing');
    document.body.classList.add('sos-active');
    updateEmergencyMessage();
    if (navigator.vibrate) navigator.vibrate([300, 120, 300, 120, 600]);
    await startSiren();
    await startLight();
  }

  function stopSOS() {
    stopSiren();
    stopLight();
    $('sosOverlay').classList.add('hidden');
    $('sosOverlay').classList.remove('flashing');
    document.body.classList.remove('sos-active');
  }

  async function toggleSiren() {
    siren.active ? stopSiren() : await startSiren();
  }

  async function toggleLight() {
    torch.active || document.body.classList.contains('sos-flash') ? stopLight() : await startLight();
  }

  async function startSiren() {
    if (siren.active) return true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        toast('Áudio não disponível neste navegador.');
        return false;
      }
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') await ctx.resume();

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      oscA.type = 'sawtooth';
      oscB.type = 'square';
      oscA.frequency.setValueAtTime(720, ctx.currentTime);
      oscB.frequency.setValueAtTime(360, ctx.currentTime);
      oscA.connect(masterGain);
      oscB.connect(masterGain);
      oscA.start();
      oscB.start();
      masterGain.gain.setTargetAtTime(0.18, ctx.currentTime, 0.03);

      let high = false;
      const pulseInterval = setInterval(() => {
        if (ctx.state === 'suspended') ctx.resume().catch(() => null);
        high = !high;
        const now = ctx.currentTime;
        oscA.frequency.cancelScheduledValues(now);
        oscB.frequency.cancelScheduledValues(now);
        masterGain.gain.cancelScheduledValues(now);
        oscA.frequency.setTargetAtTime(high ? 1280 : 620, now, 0.045);
        oscB.frequency.setTargetAtTime(high ? 640 : 310, now, 0.045);
        masterGain.gain.setTargetAtTime(high ? 0.28 : 0.11, now, 0.035);
      }, 360);

      siren = { ctx, oscillators: [oscA, oscB], gain: masterGain, pulseInterval, active: true };
      $('btnSiren').textContent = 'Parar sirene';
      return true;
    } catch (error) {
      console.warn('Falha na sirene', error);
      toast('Não consegui iniciar a sirene. Verifique volume/permissão e toque em Sirene novamente.');
      return false;
    }
  }

  function stopSiren() {
    try {
      if (siren.pulseInterval) clearInterval(siren.pulseInterval);
      if (siren.gain && siren.ctx && siren.ctx.state !== 'closed') {
        const now = siren.ctx.currentTime;
        siren.gain.gain.cancelScheduledValues(now);
        siren.gain.gain.setTargetAtTime(0.0001, now, 0.03);
      }
      (siren.oscillators || []).forEach((oscillator) => {
        try { oscillator.stop(); } catch (error) { /* já parado */ }
        try { oscillator.disconnect(); } catch (error) { /* ignorar */ }
      });
      if (siren.ctx && siren.ctx.state !== 'closed') siren.ctx.close();
    } catch (error) {
      console.warn('Falha ao parar sirene', error);
    }
    siren = { ctx: null, oscillators: [], gain: null, pulseInterval: null, active: false };
    $('btnSiren').textContent = 'Sirene';
  }

  async function startLight() {
    if (torch.active) return true;
    document.body.classList.add('sos-flash');
    $('sosOverlay').classList.add('flashing');
    $('btnLight').textContent = 'Parar pisca-alerta';
    if (navigator.vibrate) navigator.vibrate([180, 80, 180]);

    try {
      if (!navigator.mediaDevices?.getUserMedia) return false;
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        torch = { stream, track, active: true, interval: null, torchOn: false };
        const blink = async () => {
          torch.torchOn = !torch.torchOn;
          try {
            await track.applyConstraints({ advanced: [{ torch: torch.torchOn }] });
          } catch (error) {
            console.warn('Falha ao alternar lanterna', error);
          }
        };
        await blink();
        torch.interval = setInterval(blink, 480);
        return true;
      }
      stream.getTracks().forEach((item) => item.stop());
      return false;
    } catch (error) {
      console.warn('Lanterna não disponível, usando tela como fallback', error);
      return false;
    }
  }

  function stopLight() {
    document.body.classList.remove('sos-flash');
    $('sosOverlay').classList.remove('flashing');
    try {
      if (torch.interval) clearInterval(torch.interval);
      if (torch.track) torch.track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => null);
      if (torch.stream) torch.stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.warn('Falha ao desligar lanterna', error);
    }
    torch = { stream: null, track: null, active: false, interval: null, torchOn: false };
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

  function loadLeafletAssets() {
    if (window.L) return Promise.resolve(true);
    if (leafletLoadPromise) return leafletLoadPromise;
    leafletLoadPromise = new Promise((resolve) => {
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };

      if (!document.getElementById('leafletCss')) {
        const css = document.createElement('link');
        css.id = 'leafletCss';
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        css.crossOrigin = '';
        document.head.appendChild(css);
      }

      if (document.getElementById('leafletJs')) {
        setTimeout(() => finish(Boolean(window.L)), 500);
        setTimeout(() => finish(Boolean(window.L)), 6000);
        return;
      }

      const script = document.createElement('script');
      script.id = 'leafletJs';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.crossOrigin = '';
      script.onload = () => finish(true);
      script.onerror = () => finish(false);
      document.head.appendChild(script);
      setTimeout(() => finish(Boolean(window.L)), 8000);
    });
    return leafletLoadPromise;
  }

  function initMapIfNeeded() {
    const el = $('mapCanvas');
    const fallback = $('mapFallback');
    if (!el) return;
    if (!window.L) {
      if (fallback) fallback.classList.remove('hidden');
      loadLeafletAssets().then((loaded) => {
        if (!loaded) return;
        if (fallback) fallback.classList.add('hidden');
        initMapIfNeeded();
        renderMap();
        setTimeout(fitMapToContent, 120);
      });
      return;
    }
    if (fallback) fallback.classList.add('hidden');
    if (mapState.map) return;
    mapState.map = L.map(el, { zoomControl: true, preferCanvas: true }).setView([-14.2350, -51.9253], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapState.map);
    mapState.hasTiles = true;
  }

  function renderMap() {
    const mapScreenVisible = $('screen-mapa')?.classList.contains('active');
    if (!mapScreenVisible && !mapState.map) return;
    initMapIfNeeded();
    if (!mapState.map || !window.L) return;

    const allTrails = [...(state.activeTrail ? [state.activeTrail] : []), ...state.trails];
    const activePoints = state.activeTrail?.points || [];
    const lastTrailWithPoints = allTrails.find((trail) => trail.points?.length);
    const pointsForLine = activePoints.length ? activePoints : (lastTrailWithPoints?.points || []);

    if (mapState.trailLayer) mapState.trailLayer.remove();
    if (mapState.observationLayer) mapState.observationLayer.remove();
    if (mapState.riskLayer) mapState.riskLayer.remove();

    mapState.trailLayer = L.layerGroup().addTo(mapState.map);
    mapState.observationLayer = L.layerGroup().addTo(mapState.map);
    mapState.riskLayer = L.layerGroup().addTo(mapState.map);

    if (pointsForLine.length) {
      const latLngs = pointsForLine.map((point) => [point.lat, point.lng]);
      L.polyline(latLngs, { color: '#224734', weight: 5, opacity: 0.82 }).addTo(mapState.trailLayer).bindPopup('Rota gravada');
      const start = pointsForLine[0];
      const end = pointsForLine[pointsForLine.length - 1];
      L.marker([start.lat, start.lng]).addTo(mapState.trailLayer).bindPopup('Início da rota');
      L.marker([end.lat, end.lng]).addTo(mapState.trailLayer).bindPopup('Último ponto da rota');
    }

    if (currentLocation) {
      if (mapState.currentMarker) mapState.currentMarker.remove();
      mapState.currentMarker = L.circleMarker([currentLocation.lat, currentLocation.lng], {
        radius: 8,
        color: '#1d5fd1',
        fillColor: '#1d5fd1',
        weight: 3,
        fillOpacity: 0.9
      }).addTo(mapState.map).bindPopup(`Posição atual<br>${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`);
    }

    state.observations.filter((obs) => obs.location).forEach((obs) => {
      const title = escapeHtml(obs.species || obs.type || 'Observação');
      const meta = escapeHtml(formatDateTime(obs.createdAt));
      L.circleMarker([obs.location.lat, obs.location.lng], { radius: 7, color: '#287a4f', fillColor: '#287a4f', weight: 2, fillOpacity: 0.75 })
        .addTo(mapState.observationLayer)
        .bindPopup(`<strong>${title}</strong><br>${escapeHtml(obs.type)}<br>${meta}`);
    });

    state.risks.filter((risk) => risk.location).forEach((risk) => {
      const title = escapeHtml(risk.type || 'Risco');
      const notes = escapeHtml(risk.notes || 'Sem nota');
      L.circleMarker([risk.location.lat, risk.location.lng], { radius: 8, color: '#b83333', fillColor: '#b83333', weight: 3, fillOpacity: 0.85 })
        .addTo(mapState.riskLayer)
        .bindPopup(`<strong>${title}</strong><br>Gravidade: ${escapeHtml(risk.severity || '—')}<br>${notes}`);
    });
  }

  function fitMapToContent() {
    initMapIfNeeded();
    if (!mapState.map || !window.L) return;
    const latLngs = [];
    if (currentLocation) latLngs.push([currentLocation.lat, currentLocation.lng]);
    const allTrails = [...(state.activeTrail ? [state.activeTrail] : []), ...state.trails];
    allTrails.forEach((trail) => (trail.points || []).forEach((point) => latLngs.push([point.lat, point.lng])));
    state.observations.forEach((obs) => { if (obs.location) latLngs.push([obs.location.lat, obs.location.lng]); });
    state.risks.forEach((risk) => { if (risk.location) latLngs.push([risk.location.lat, risk.location.lng]); });
    if (!latLngs.length) {
      toast('Ainda não há pontos com GPS para enquadrar.');
      return;
    }
    mapState.map.fitBounds(L.latLngBounds(latLngs), { padding: [28, 28], maxZoom: 16 });
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

  function addMediaButton(container, media, label, obs) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'media-chip media-button';
    const isImage = (media.type || '').startsWith('image/');
    const isAudio = (media.type || '').startsWith('audio/');
    button.textContent = `${isImage ? 'Abrir foto' : isAudio ? 'Abrir áudio' : 'Abrir mídia'} · ${label}`;
    button.addEventListener('click', () => openMediaViewer(media, obs.species || obs.type || 'Registro', obs));
    container.appendChild(button);
  }

  async function openMediaViewer(media, title, obs) {
    const modal = $('mediaModal');
    const body = $('mediaViewerBody');
    const heading = $('mediaViewerTitle');
    const meta = $('mediaViewerMeta');
    const download = $('mediaDownload');
    if (!modal || !body || !media) return;
    closeMediaViewer(false);
    heading.textContent = title || media.name || 'Mídia registrada';
    body.innerHTML = '<p class="muted-text">Carregando mídia...</p>';
    modal.classList.remove('hidden');

    const url = await loadMediaUrl(media.id);
    if (!url) {
      body.innerHTML = '<p class="muted-text">Não consegui carregar este arquivo. Ele pode ter sido removido do armazenamento local do navegador.</p>';
      return;
    }
    mediaViewerObjectUrl = url;
    body.innerHTML = '';
    if ((media.type || '').startsWith('image/')) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = title || media.name || 'Foto registrada';
      body.appendChild(img);
    } else if ((media.type || '').startsWith('audio/')) {
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = url;
      body.appendChild(audio);
    } else if ((media.type || '').startsWith('video/')) {
      const video = document.createElement('video');
      video.controls = true;
      video.src = url;
      body.appendChild(video);
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.textContent = media.name || 'Abrir arquivo';
      link.target = '_blank';
      body.appendChild(link);
    }
    const equipment = [media.cameraModel, media.lensModel, media.accessoryUsed, media.focalLength, media.shotSettings].filter(Boolean).join(' · ');
    const note = media.note ? `\nNota: ${media.note}` : '';
    const loc = obs?.location ? `\nGPS: ${obs.location.lat.toFixed(6)}, ${obs.location.lng.toFixed(6)}` : '';
    meta.textContent = [media.name || 'Arquivo sem nome', equipment, formatDateTime(media.createdAt), note, loc].filter(Boolean).join('\n');
    download.href = url;
    download.download = media.name || 'midia-caderno-de-campo';
    download.target = '_blank';
    download.classList.remove('hidden');
  }

  function closeMediaViewer(hide = true) {
    const body = $('mediaViewerBody');
    const modal = $('mediaModal');
    const download = $('mediaDownload');
    if (mediaViewerObjectUrl) {
      URL.revokeObjectURL(mediaViewerObjectUrl);
      mediaViewerObjectUrl = '';
    }
    if (body) body.innerHTML = '';
    if (download) {
      download.href = '#';
      download.classList.add('hidden');
    }
    if (hide && modal) modal.classList.add('hidden');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
      'Ninho/toca': '🪹',
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
