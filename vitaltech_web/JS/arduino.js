// arduino.js
// Maneja conexión con ESP32 vía Web Serial API y actualiza la UI.

(function(){
  const connectBtn = document.getElementById('connectBtn');
  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');

  let port = null;
  let reader = null;
  let keepReading = false;

  function setStatus(connected){
    if(!statusIcon || !statusText) return;
    if(connected){
      statusIcon.style.color = '#4CAF50';
      statusText.textContent = 'Conectado';
    } else {
      statusIcon.style.color = '#ccc';
      statusText.textContent = 'Desconectado';
    }
  }

  async function connectSerial(){
    if(!('serial' in navigator)){
      alert('Web Serial API no está disponible en este navegador. Use Chrome/Edge en HTTPS o localhost.');
      return;
    }

    try{
      // Solicita puerto con filtros opcionales para ESP32
      const filters = [
        { usbVendorId: 0x10C4, usbProductId: 0xEA60 }, // CP2102
        { usbVendorId: 0x1A86, usbProductId: 0x7523 }, // CH340
        { usbVendorId: 0x0403 } // FTDI
      ];
      
      port = await navigator.serial.requestPort({ filters });
      await port.open({ baudRate: 115200 });
      console.log('✅ Puerto abierto correctamente');
      setStatus(true);
      keepReading = true;
      readLoop();
    }catch(err){
      if(err.name === 'NotFoundError'){
        console.log('⚠️ Usuario canceló la selección del puerto');
        return;
      }
      console.error('❌ Error abriendo puerto serial:', err);
      alert('Error al conectar: ' + err.message);
      setStatus(false);
      port = null;
    }
  }

  async function disconnectSerial(){
    keepReading = false;
    try{
      if(reader){
        await reader.cancel();
        reader = null;
      }
      if(port){
        await port.close();
        port = null;
      }
    }catch(e){ console.warn('Error al cerrar puerto', e); }
    setStatus(false);
  }

  function tryParseLine(line){
    const out = {};
    line = line.trim();
    if(!line) return null;
    
    // LOG: Ver qué llega desde el ESP32
    console.log('📥 Línea recibida:', line);
    
    // Intenta JSON
    try{
      const j = JSON.parse(line);
      console.log('✅ Parseado como JSON:', j);
      return j;
    }catch(_){ }

    // Formato específico ESP32: "Ritmo cardíaco: 75 bpm / SpO2: 98 %"
    // y "Temperatura: 36.5 °C"
    const heartMatch = line.match(/Ritmo cardíaco:\s*(\d+(?:\.\d+)?)\s*bpm/i);
    const spo2Match = line.match(/SpO2:\s*(\d+(?:\.\d+)?)\s*%/i);
    const tempMatch = line.match(/Temperatura:\s*(\d+(?:\.\d+)?)\s*°?C/i);
    
    if(heartMatch) {
      out.heartRate = parseFloat(heartMatch[1]);
    }
    if(spo2Match) {
      out.oxygen = parseFloat(spo2Match[1]);
    }
    if(tempMatch) {
      out.temperature = parseFloat(tempMatch[1]);
    }
    
    // Si ya encontró algo, retornar
    if(Object.keys(out).length > 0) {
      console.log('✅ Parseado formato ESP32:', out);
      return out;
    }

    // Formato tipo: HR:75,TEMP:36.5,SPO2:98,STEPS:1234
    const parts = line.split(/[,;]+/);
    for(const p of parts){
      const kv = p.split(/[:=]/).map(s => s.trim());
      if(kv.length < 2) continue;
      const key = kv[0].toLowerCase();
      const val = kv.slice(1).join(':');
      if(/hr|bpm|heart/.test(key)) out.heartRate = parseFloat(val);
      else if(/temp|temperature/.test(key)) out.temperature = parseFloat(val);
      else if(/spo2|o2|oxygen/.test(key)) out.oxygen = parseFloat(val);
      else if(/step/.test(key)) out.steps = parseInt(val);
      else out[key] = isNaN(Number(val)) ? val : Number(val);
    }

    // Si hay números separados por comas (ej: 75,36.5,98,1234)
    if(Object.keys(out).length === 0){
      const nums = line.split(/[^0-9.]+/).filter(Boolean);
      if(nums.length >= 1){ out.heartRate = Number(nums[0]); }
      if(nums.length >= 2){ out.temperature = Number(nums[1]); }
      if(nums.length >= 3){ out.oxygen = Number(nums[2]); }
      if(nums.length >= 4){ out.steps = Number(nums[3]); }
    }

    const result = Object.keys(out).length ? out : null;
    if(result) {
      console.log('✅ Parseado como:', result);
    } else {
      console.warn('❌ No se pudo parsear la línea');
    }
    return result;
  }

  async function readLoop(){
    if(!port) return;
    const decoder = new TextDecoderStream();
    try{
      const readable = port.readable.pipeThrough(decoder);
      reader = readable.getReader();
      let buffer = '';
      while(keepReading){
        const { value, done } = await reader.read();
        if(done) break;
        if(value){
          buffer += value;
          let lines = buffer.split(/\r?\n/);
          buffer = lines.pop();
          for(const line of lines){
            const data = tryParseLine(line);
            if(data) handleData(data);
          }
        }
      }
    }catch(err){
      console.error('Error leyendo serial:', err);
    }finally{
      if(reader){
        try{ await reader.releaseLock(); }catch(e){}
        reader = null;
      }
      // si se salió inesperadamente, actualizar estado
      if(port) setStatus(false);
    }
  }

  function handleData(data){
    console.log('🔄 Actualizando UI con:', data);
    
    // Actualiza elementos de la UI directamente
    if(data.heartRate != null){
      const el = document.getElementById('heartRate');
      if(el) {
        el.textContent = `${Math.round(data.heartRate)} bpm`;
        console.log('✅ BPM actualizado en UI:', data.heartRate);
      }
    }
    if(data.temperature != null && !isNaN(data.temperature)){
      const el = document.getElementById('temperature');
      if(el) {
        el.textContent = `${Number(data.temperature).toFixed(1)} °C`;
        console.log('✅ Temperatura actualizada en UI:', data.temperature);
      }
    } else if(data.temperature != null && isNaN(data.temperature)) {
      console.log('⚠️ Temperatura con error (NaN) - manteniendo último valor');
    }
    if(data.oxygen != null){
      const el = document.getElementById('oxygen');
      if(el) {
        el.textContent = `${Math.round(data.oxygen)} %`;
        console.log('✅ SpO2 actualizado en UI:', data.oxygen);
      }
    }
    if(data.steps != null){
      const el = document.getElementById('steps');
      if(el) {
        el.textContent = `${data.steps}`;
        console.log('✅ Pasos actualizados en UI:', data.steps);
      }
    }

    // Dispara evento personalizado para que deportes.js lo consuma también
    try{
      window.dispatchEvent(new CustomEvent('arduino-data', { detail: data }));
      console.log('✅ Evento arduino-data emitido');
    }catch(e){ console.warn('No se pudo dispatch arduino-data', e); }
  }

  // Botón existente en la UI
  if(connectBtn){
    connectBtn.addEventListener('click', async (e) =>{
      e.preventDefault();
      if(port){
        // ya conectado -> desconectar
        await disconnectSerial();
        connectBtn.innerHTML = '<i class="fas fa-plug"></i> Conectar Dispositivo';
        return;
      }
      await connectSerial();
      if(port) connectBtn.innerHTML = '<i class="fas fa-unlink"></i> Desconectar';
    });
  }

  // Manejar desconexión física del dispositivo
  if('serial' in navigator){
    navigator.serial.addEventListener('disconnect', (e)=>{
      if(e.target === port){
        disconnectSerial();
      }
    });
  }

  // Export sencillo si se desea usar desde consola
  window.CUIDAR_ARDUINO = {
    connect: connectSerial,
    disconnect: disconnectSerial,
    isConnected: () => !!port
  };

})();
