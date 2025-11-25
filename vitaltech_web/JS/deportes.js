// ===================================
// DEPORTES.JS - Monitor Deportivo
// ===================================

// Variables globales
let isConnected = false;
let sessionActive = false;
let sessionPaused = false;
let sessionStartTime = null;
let sessionDuration = 0;
let heartRateData = [];
let temperatureData = [];
let timeLabels = [];
let maxDataPoints = 60;

// Historial de datos para exportar
let dataHistory = {
  records: []
};

// Control de notificaciones duplicadas (cooldown 2 minutos)
let notificationCooldowns = {
  heartRateHigh: 0,
  heartRateLow: 0,
  oxygenLow: 0,
  temperatureHigh: 0,
  heartRateNormal: 0,
  oxygenNormal: 0
};
const NOTIFICATION_COOLDOWN = 2 * 60 * 1000; // 2 minutos en milisegundos
const NOTIFICATION_COOLDOWN = 5 * 60 * 1000; // 5 minutos en milisegundos

// Estadísticas de sesión
let sessionStats = {
  heartRates: [],
  avgHeartRate: 0,
  maxHeartRate: 0,
  minHeartRate: 999,
  steps: 0,
  calories: 0,
  distance: 0
};

// Web Serial API para Arduino
let port;
let reader;
let keepReading = true;

// Gráficas
let heartRateChart;
let temperatureChart;

// ===================================
// INICIALIZACIÓN
// ===================================
document.addEventListener('DOMContentLoaded', function() {
  initializeCharts();
  initializeEventListeners();
  loadWorkoutHistory();
  loadDataHistory(); // Cargar historial guardado
  
  // Escuchar datos reales del ESP32
  window.addEventListener('arduino-data', function(e) {
    const data = e.detail;
    if(data.heartRate != null) {
      updateHeartRate(data.heartRate);
      saveDataRecord(data.heartRate, data.oxygen, data.temperature);
    }
    if(data.oxygen != null) updateOxygen(data.oxygen);
    // Solo actualizar temperatura si el valor es válido (no NaN)
    if(data.temperature != null && !isNaN(data.temperature)) updateTemperature(data.temperature);
    if(data.steps != null) updateSteps(data.steps);
  });
  
  // simulateData(); // Desactivado - usar datos reales del ESP32
});

// ===================================
// GRÁFICAS CON CHART.JS
// ===================================
function initializeCharts() {
  // Gráfica de Frecuencia Cardíaca
  const heartRateCtx = document.getElementById('heartRateChart').getContext('2d');
  heartRateChart = new Chart(heartRateCtx, {
    type: 'line',
    data: {
      labels: timeLabels,
      datasets: [{
        label: 'BPM',
        data: heartRateData,
        borderColor: 'rgb(245, 87, 108)',
        backgroundColor: 'rgba(245, 87, 108, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgb(245, 87, 108)',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 50,
          max: 200,
          grid: {
            color: 'rgba(148, 163, 184, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });

  // Gráfica de Temperatura
  const temperatureCtx = document.getElementById('temperatureChart').getContext('2d');
  temperatureChart = new Chart(temperatureCtx, {
    type: 'line',
    data: {
      labels: timeLabels,
      datasets: [{
        label: '°C',
        data: temperatureData,
        borderColor: 'rgb(250, 112, 154)',
        backgroundColor: 'rgba(250, 112, 154, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgb(250, 112, 154)',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 35,
          max: 40,
          grid: {
            color: 'rgba(148, 163, 184, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        }
      }
    }
  });
}

// ===================================
// EVENT LISTENERS
// ===================================
function initializeEventListeners() {
  // Menú lateral (sidebar)
  const menuIcon = document.querySelector('.menu-icon');
  const sidebarMenu = document.getElementById('sidebarMenu');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const closeSidebar = document.getElementById('closeSidebar');

  if (menuIcon) {
    menuIcon.addEventListener('click', function() {
      sidebarMenu.classList.add('active');
      sidebarOverlay.classList.add('active');
    });
  }

  if (closeSidebar) {
    closeSidebar.addEventListener('click', function() {
      sidebarMenu.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', function() {
      sidebarMenu.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    });
  }

  // Botón de logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('currentUser');
        window.location.href = '../index.html';
      }
    });
  }

  // Botón de conexión - AHORA MANEJADO POR arduino.js
  // document.getElementById('connectBtn').addEventListener('click', connectDevice);

  // Controles de sesión
  document.getElementById('startSession').addEventListener('click', startSession);
  document.getElementById('pauseSession').addEventListener('click', pauseSession);
  document.getElementById('stopSession').addEventListener('click', stopSession);

  // Exportar datos
  document.getElementById('exportData').addEventListener('click', exportDataToCSV);

  // Controles de rango de gráfica
  document.querySelectorAll('.btn-chart-control').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.btn-chart-control').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const range = this.getAttribute('data-range');
      updateChartRange(range);
    });
  });
}

// ===================================
// CONEXIÓN CON ESP32 - AHORA MANEJADA POR arduino.js
// ===================================
/* CÓDIGO VIEJO COMENTADO - arduino.js maneja la conexión ahora
async function connectDevice() {
  try {
    // Verificar si el navegador soporta Web Serial API
    if (!('serial' in navigator)) {
      showAlert('danger', 'Navegador no compatible', 'Tu navegador no soporta Web Serial API. Usa Chrome o Edge.');
      return;
    }

    // Solicitar puerto serial
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });

    isConnected = true;
    updateConnectionStatus(true);
    showAlert('success', 'Conectado', '¡Dispositivo conectado correctamente!');

    // Leer datos del Arduino
    readArduinoData();

  } catch (error) {
    console.error('Error al conectar:', error);
    showAlert('danger', 'Error de conexión', 'No se pudo conectar con el dispositivo.');
  }
}

async function readArduinoData() {
  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
  reader = textDecoder.readable.getReader();

  try {
    while (keepReading) {
      const { value, done } = await reader.read();
      if (done) break;

      // Parsear datos del Arduino
      // Formato esperado: "HR:75,TEMP:36.5,SPO2:98,STEPS:1234"
      parseArduinoData(value);
    }
  } catch (error) {
    console.error('Error leyendo datos:', error);
  } finally {
    reader.releaseLock();
  }
}

function parseArduinoData(data) {
  try {
    const dataString = data.trim();
    const pairs = dataString.split(',');
    
    pairs.forEach(pair => {
      const [key, value] = pair.split(':');
      
      switch(key) {
        case 'HR':
          updateHeartRate(parseInt(value));
          break;
        case 'TEMP':
          updateTemperature(parseFloat(value));
          break;
        case 'SPO2':
          updateOxygen(parseInt(value));
          break;
        case 'STEPS':
          updateSteps(parseInt(value));
          break;
      }
    });
  } catch (error) {
    console.error('Error parseando datos:', error);
  }
}
*/ // FIN CÓDIGO VIEJO COMENTADO

// ===================================
// ACTUALIZACIÓN DE MÉTRICAS
// ===================================
function updateHeartRate(value) {
  document.getElementById('heartRate').textContent = `${value} bpm`;
  
  // Actualizar estado
  let status = 'Normal';
  let statusClass = 'normal';
  const now = Date.now();
  
  if (value < 60) {
    status = 'Bajo';
    statusClass = 'low';
  } else if (value > 100) {
    status = 'Elevado';
    statusClass = 'high';
  } else {
    // Estado normal - notificar cada 2 minutos
    if (now - notificationCooldowns.heartRateNormal > NOTIFICATION_COOLDOWN) {
      showAlert('success', 'Frecuencia cardíaca normal', 'Tu frecuencia cardíaca está en rango normal.');
      notificationCooldowns.heartRateNormal = now;
    }
  }
  
  const statusElement = document.getElementById('heartRateStatus');
  if (statusElement) {
    statusElement.style.display = 'none'; // Ocultar estado
  }
  
  // Actualizar gráfica siempre que lleguen datos del ESP32
  if (heartRateChart) {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Agregar datos
    heartRateData.push(value);
    heartRateChart.data.labels.push(timeLabel);
    
    // Limitar puntos
    if (heartRateData.length > maxDataPoints) {
      heartRateData.shift();
      heartRateChart.data.labels.shift();
    }
    
    // Actualizar gráfica
    heartRateChart.update();
    console.log('📊 Gráfica actualizada. BPM:', value, 'Total puntos:', heartRateData.length);
  } else {
    console.warn('⚠️ heartRateChart no está inicializado');
  }
  
  // Si hay sesión activa, actualizar estadísticas también
  if (sessionActive && !sessionPaused) {
    sessionStats.heartRates.push(value);
    updateSessionStats();
    updateTrainingZone(value);
    
    // Alertas con cooldown de 2 minutos
    if (value > 180 && now - notificationCooldowns.heartRateHigh > NOTIFICATION_COOLDOWN) {
      showAlert('danger', 'Frecuencia cardíaca alta', 'Tu frecuencia cardíaca está muy alta. Considera reducir la intensidad.');
      notificationCooldowns.heartRateHigh = now;
    } else if (value < 50 && now - notificationCooldowns.heartRateLow > NOTIFICATION_COOLDOWN) {
      showAlert('warning', 'Frecuencia cardíaca baja', 'Tu frecuencia cardíaca está baja.');
      notificationCooldowns.heartRateLow = now;
    }
  }
}

function updateTemperature(value) {
  const tempElement = document.getElementById('temperature');
  if (!tempElement) return;
  
  tempElement.textContent = `${value.toFixed(1)} °C`;
  
  let status = 'Normal';
  const now = Date.now();
  
  if (value > 37.5) {
    status = 'Elevada';
    if (now - notificationCooldowns.temperatureHigh > NOTIFICATION_COOLDOWN) {
      showAlert('warning', 'Temperatura elevada', 'Tu temperatura corporal está un poco alta. Mantente hidratado.');
      notificationCooldowns.temperatureHigh = now;
    }
  } else if (value < 35.5) {
    status = 'Baja';
  }
  
  const statusElement = document.getElementById('temperatureStatus');
  if (statusElement) {
    statusElement.style.display = 'none'; // Ocultar estado
  }
  
  // Actualizar gráfica si existe
  if (temperatureChart) {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Agregar datos
    temperatureData.push(value);
    temperatureChart.data.labels.push(timeLabel);
    
    // Limitar puntos
    if (temperatureData.length > maxDataPoints) {
      temperatureData.shift();
      temperatureChart.data.labels.shift();
    }
    
    // Actualizar gráfica
    temperatureChart.update();
    console.log('🌡️ Gráfica temperatura actualizada:', value, '°C');
  }
}

function updateOxygen(value) {
  // Solo actualizar si el valor está en rango válido (85-100)
  if (value < 85 || value > 100) {
    console.log('⚠️ SpO2 fuera de rango válido (85-100):', value);
    return;
  }
  
  document.getElementById('oxygen').textContent = `${value} %`;
  
  let status = 'Normal';
  const now = Date.now();
  
  if (value < 90) {
    status = 'Bajo';
    // Solo mostrar alerta si han pasado 2 minutos desde la última
    if (now - notificationCooldowns.oxygenLow > NOTIFICATION_COOLDOWN) {
      showAlert('warning', 'SpO2 bajo', 'Tu saturación de oxígeno está baja. Descansa si es necesario.');
      notificationCooldowns.oxygenLow = now;
    }
  } else {
    // Estado normal - notificar cada 2 minutos
    if (now - notificationCooldowns.oxygenNormal > NOTIFICATION_COOLDOWN) {
      showAlert('success', 'SpO2 normal', 'Tu saturación de oxígeno está en rango normal.');
      notificationCooldowns.oxygenNormal = now;
    }
  }
  
  const oxygenStatusElement = document.getElementById('oxygenStatus');
  if (oxygenStatusElement) {
    oxygenStatusElement.style.display = 'none'; // Ocultar estado
  }
}

function updateSteps(value) {
  document.getElementById('steps').textContent = value.toLocaleString();
  sessionStats.steps = value;
  
  // Calcular calorías y distancia estimadas
  const calories = Math.round(value * 0.04);
  const distance = (value * 0.0008).toFixed(2);
  
  document.getElementById('calories').textContent = `${calories} kcal`;
  document.getElementById('distance').textContent = `${distance} km`;
  
  sessionStats.calories = calories;
  sessionStats.distance = distance;
}

// ===================================
// GESTIÓN DE GRÁFICAS
// ===================================
function addDataToChart(chart, dataArray, value) {
  const now = new Date();
  const timeLabel = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  if (dataArray.length >= maxDataPoints) {
    dataArray.shift();
    chart.data.labels.shift();
  }
  
  dataArray.push(value);
  chart.data.labels.push(timeLabel);
  
  chart.update(); // Actualizar con animación
  console.log('📈 Chart actualizado. Puntos:', dataArray.length, 'Último valor:', value);
}

function updateChartRange(range) {
  switch(range) {
    case '1m':
      maxDataPoints = 60;
      break;
    case '5m':
      maxDataPoints = 300;
      break;
    case '15m':
      maxDataPoints = 900;
      break;
  }
}

// ===================================
// ZONAS DE ENTRENAMIENTO
// ===================================
function updateTrainingZone(heartRate) {
  let zone = 'rest';
  let zoneText = 'Zona de Descanso';
  let zoneDescription = 'Perfecta para calentamiento y recuperación.';
  let position = 10;
  
  if (heartRate >= 160) {
    zone = 'peak';
    zoneText = 'Zona Máxima';
    zoneDescription = '¡Máximo esfuerzo! Solo para intervalos cortos.';
    position = 90;
  } else if (heartRate >= 140) {
    zone = 'cardio';
    zoneText = 'Zona Cardio';
    zoneDescription = 'Mejora tu resistencia cardiovascular.';
    position = 70;
  } else if (heartRate >= 120) {
    zone = 'fat';
    zoneText = 'Zona Quema Grasa';
    zoneDescription = 'Ideal para quemar grasa y mejorar resistencia.';
    position = 50;
  } else if (heartRate >= 100) {
    zone = 'warmup';
    zoneText = 'Zona de Calentamiento';
    zoneDescription = 'Prepara tu cuerpo para ejercicio intenso.';
    position = 30;
  }
  
  const indicator = document.getElementById('zoneIndicator');
  indicator.style.left = `${position}%`;
  
  const zoneInfo = document.getElementById('zoneInfo');
  zoneInfo.innerHTML = `
    <strong>${zoneText}</strong>
    <p>${zoneDescription}</p>
  `;
}

// ===================================
// CONTROL DE SESIÓN
// ===================================
function startSession() {
  if (!isConnected) {
    showAlert('warning', 'Dispositivo no conectado', 'Por favor, conecta tu dispositivo primero.');
    return;
  }
  
  sessionActive = true;
  sessionPaused = false;
  sessionStartTime = new Date();
  
  document.getElementById('startSession').disabled = true;
  document.getElementById('pauseSession').disabled = false;
  document.getElementById('stopSession').disabled = false;
  
  // Limpiar datos anteriores
  heartRateData = [];
  temperatureData = [];
  timeLabels = [];
  sessionStats.heartRates = [];
  
  // Iniciar cronómetro
  updateSessionTimer();
  
  showAlert('success', 'Sesión iniciada', '¡Buena suerte con tu entrenamiento!');
}

function pauseSession() {
  sessionPaused = !sessionPaused;
  
  const btn = document.getElementById('pauseSession');
  if (sessionPaused) {
    btn.innerHTML = '<i class="fas fa-play"></i> Reanudar';
    showAlert('warning', 'Sesión pausada', 'Sesión pausada. Descansa un momento.');
  } else {
    btn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
    showAlert('success', 'Sesión reanudada', '¡Continúa con tu entrenamiento!');
  }
}

function stopSession() {
  sessionActive = false;
  sessionPaused = false;
  
  document.getElementById('startSession').disabled = false;
  document.getElementById('pauseSession').disabled = true;
  document.getElementById('stopSession').disabled = true;
  
  // Guardar sesión en historial
  saveWorkoutSession();
  
  showAlert('success', 'Sesión finalizada', '¡Excelente trabajo! Tu sesión ha sido guardada.');
}

function updateSessionTimer() {
  if (!sessionActive) return;
  
  if (!sessionPaused) {
    const now = new Date();
    const diff = now - sessionStartTime;
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('sessionDuration').textContent = timeString;
  }
  
  setTimeout(updateSessionTimer, 1000);
}

function updateSessionStats() {
  if (sessionStats.heartRates.length === 0) return;
  
  // Promedio
  const avg = Math.round(sessionStats.heartRates.reduce((a, b) => a + b, 0) / sessionStats.heartRates.length);
  document.getElementById('avgHeartRate').textContent = `${avg} bpm`;
  sessionStats.avgHeartRate = avg;
  
  // Máxima
  const max = Math.max(...sessionStats.heartRates);
  document.getElementById('maxHeartRate').textContent = `${max} bpm`;
  sessionStats.maxHeartRate = max;
  
  // Mínima
  const min = Math.min(...sessionStats.heartRates);
  document.getElementById('minHeartRate').textContent = `${min} bpm`;
  sessionStats.minHeartRate = min;
}

// ===================================
// HISTORIAL DE ENTRENAMIENTOS
// ===================================
function saveWorkoutSession() {
  const session = {
    date: new Date().toISOString(),
    duration: document.getElementById('sessionDuration').textContent,
    avgHeartRate: sessionStats.avgHeartRate,
    maxHeartRate: sessionStats.maxHeartRate,
    steps: sessionStats.steps,
    calories: sessionStats.calories,
    distance: sessionStats.distance
  };
  
  let history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
  history.unshift(session);
  
  // Mantener solo las últimas 20 sesiones
  if (history.length > 20) {
    history = history.slice(0, 20);
  }
  
  localStorage.setItem('workoutHistory', JSON.stringify(history));
  loadWorkoutHistory();
}

function loadWorkoutHistory() {
  const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
  const historyList = document.getElementById('historyList');
  
  if (history.length === 0) {
    historyList.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No hay entrenamientos registrados aún.</p>';
    return;
  }
  
  historyList.innerHTML = history.map(session => {
    const date = new Date(session.date);
    const dateString = date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
      <div class="history-item">
        <div class="history-item-date">
          <i class="fas fa-calendar-alt"></i> ${dateString}
        </div>
        <div class="history-item-stats">
          <span><i class="fas fa-clock"></i> ${session.duration}</span>
          <span><i class="fas fa-heartbeat"></i> ${session.avgHeartRate} bpm</span>
          <span><i class="fas fa-walking"></i> ${session.steps}</span>
          <span><i class="fas fa-fire"></i> ${session.calories} kcal</span>
        </div>
      </div>
    `;
  }).join('');
}

function exportData() {
  const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
  
  if (history.length === 0) {
    showAlert('warning', 'Sin datos', 'No hay datos para exportar.');
    return;
  }
  
  // Convertir a CSV
  let csv = 'Fecha,Duración,FC Promedio,FC Máxima,Pasos,Calorías,Distancia\n';
  
  history.forEach(session => {
    const date = new Date(session.date).toLocaleString('es-ES');
    csv += `${date},${session.duration},${session.avgHeartRate},${session.maxHeartRate},${session.steps},${session.calories},${session.distance}\n`;
  });
  
  // Descargar archivo
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cuidar_entrenamientos_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  
  showAlert('success', 'Datos exportados', 'Tus datos han sido exportados correctamente.');
}

// ===================================
// ALERTAS
// ===================================
function showAlert(type, title, message) {
  const alertsSection = document.getElementById('alertsSection');
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
    <div class="alert-icon">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle'}"></i>
    </div>
    <div class="alert-content">
      <div class="alert-title">${title}</div>
      <div class="alert-message">${message}</div>
    </div>
  `;
  
  alertsSection.appendChild(alert);
  
  // Auto-remover después de 5 segundos
  setTimeout(() => {
    alert.style.animation = 'fadeOut 0.5s ease';
    setTimeout(() => alert.remove(), 500);
  }, 5000);
}

// ===================================
// ACTUALIZACIÓN DE ESTADO - Comentado, arduino.js lo maneja
// ===================================
/* CÓDIGO VIEJO COMENTADO
function updateConnectionStatus(connected) {
  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');
  const connectBtn = document.getElementById('connectBtn');
  
  if (connected) {
    statusIcon.classList.add('connected');
    statusIcon.classList.remove('disconnected');
    statusText.textContent = 'Conectado';
    connectBtn.innerHTML = '<i class="fas fa-unlink"></i> Desconectar';
    connectBtn.onclick = disconnectDevice;
  } else {
    statusIcon.classList.add('disconnected');
    statusIcon.classList.remove('connected');
    statusText.textContent = 'Desconectado';
    connectBtn.innerHTML = '<i class="fas fa-plug"></i> Conectar Dispositivo';
    connectBtn.onclick = connectDevice;
  }
}

async function disconnectDevice() {
  if (port) {
    keepReading = false;
    if (reader) {
      await reader.cancel();
    }
    await port.close();
    port = null;
  }
  
  isConnected = false;
  updateConnectionStatus(false);
  showAlert('warning', 'Desconectado', 'Dispositivo desconectado.');
}
*/ // FIN CÓDIGO VIEJO COMENTADO

// ===================================
// SIMULACIÓN DE DATOS (Para pruebas)
// ===================================
function simulateData() {
  setInterval(() => {
    if (isConnected && sessionActive && !sessionPaused) {
      // Simular datos aleatorios
      const hr = 60 + Math.floor(Math.random() * 80);
      const temp = 36 + Math.random() * 1.5;
      const spo2 = 95 + Math.floor(Math.random() * 5);
      const steps = sessionStats.steps + Math.floor(Math.random() * 5);
      
      updateHeartRate(hr);
      updateTemperature(temp);
      updateOxygen(spo2);
      updateSteps(steps);
    }
  }, 1000);
}

// ===================================
// NAVEGACIÓN
// ===================================
// Hacer funcional el botón de notificaciones
document.addEventListener('DOMContentLoaded', function() {
  const notificationsBtn = document.getElementById('notificationsBtn');
  if (notificationsBtn) {
    notificationsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      showAlert('info', 'Notificaciones', 'No tienes notificaciones nuevas en este momento.');
    });
  }

  // Actualizar badge de notificaciones
  updateNotificationBadge();
});

function updateNotificationBadge() {
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    // Aquí podrías obtener el número real de notificaciones
    const notificationCount = 0;
    badge.textContent = notificationCount;
    badge.style.display = notificationCount > 0 ? 'flex' : 'none';
  }
}

// ===================================
// ANIMACIÓN DE FADE OUT
// ===================================
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100%); }
  }
`;
document.head.appendChild(style);

// ===================================
// SISTEMA DE ALMACENAMIENTO DE DATOS
// ===================================
function saveDataRecord(heartRate, oxygen, temperature) {
  const now = new Date();
  const record = {
    timestamp: now.toISOString(),
    date: now.toLocaleDateString('es-ES'),
    time: now.toLocaleTimeString('es-ES'),
    heartRate: heartRate || null,
    oxygen: oxygen || null,
    temperature: temperature || null
  };
  
  dataHistory.records.push(record);
  
  // Guardar en localStorage
  try {
    localStorage.setItem('vitaltech_data_history', JSON.stringify(dataHistory));
    console.log('✅ Datos guardados:', record);
  } catch(e) {
    console.error('Error guardando datos:', e);
  }
}

function loadDataHistory() {
  try {
    const stored = localStorage.getItem('vitaltech_data_history');
    if (stored) {
      dataHistory = JSON.parse(stored);
      console.log(`📊 Historial cargado: ${dataHistory.records.length} registros`);
    }
  } catch(e) {
    console.error('Error cargando historial:', e);
    dataHistory = { records: [] };
  }
}

function exportDataToCSV() {
  if (dataHistory.records.length === 0) {
    showAlert('warning', 'Sin datos', 'No hay datos para exportar. Conecta tu ESP32 y espera a recibir lecturas.');
    return;
  }
  
  // Crear CSV
  let csv = 'Fecha,Hora,Frecuencia Cardíaca (bpm),SpO2 (%),Temperatura (°C)\n';
  
  dataHistory.records.forEach(record => {
    csv += `${record.date},${record.time},${record.heartRate || ''},${record.oxygen || ''},${record.temperature || ''}\n`;
  });
  
  // Descargar archivo
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const filename = `VitalTech_Historial_${new Date().toISOString().split('T')[0]}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showAlert('success', 'Exportado', `Se descargaron ${dataHistory.records.length} registros.`);
  console.log('📥 Datos exportados:', filename);
}

function clearDataHistory() {
  if (confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
    dataHistory = { records: [] };
    localStorage.removeItem('vitaltech_data_history');
    showAlert('info', 'Historial borrado', 'Se eliminaron todos los registros.');
    console.log('🗑️ Historial eliminado');
  }
}
