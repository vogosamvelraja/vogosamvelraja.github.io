var connection = function() {
  var deviceName = document.getElementById('deviceName').value;

  if(!deviceName) {
    log('Kindly enter a device name');
    return;
  }

  var bluetoothDevice;
    if (!('bluetooth' in navigator)) {
        log("Bluetooth not available")
        return;
      }
      disconnectLog('');
      exceptionLog('');
      log('Connecting to device ' + deviceName);
      navigator.bluetooth.requestDevice({ 
        filters: [
          { name: deviceName },
          // { services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] },
        ] 
      })
      .then(device => {
        log('Connecting to gatt server');
        bluetoothDevice = device;
        // Set up event listener for when device gets disconnected.
        device.addEventListener('gattserverdisconnected', onDisconnected);
      
        // Attempts to connect to remote GATT Server.
        return device.gatt.connect();
      })
      .then(server => {
        log('Getting primary service');
        // Getting Battery Service...
        return server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
      })
      .then(service => {
        gattService = service;
        log('Getting characteristic');
        // Getting Battery Level Characteristic...
        return service.getCharacteristics();
      })
      .then(characteristics => {
        log('All characteristics');
        console.log(characteristics);
        // Getting Battery Level Characteristic...
        return gattService.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
      })
      .then(characteristic => characteristic.startNotifications())
      .then(characteristic => {
        log('Sending information');
        // Reading Battery Level...
        characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicResponse);

         // Writing 1 is the signal to reset energy expended.
       
        let connectCode = '$cA*;';
        let encoder = new TextEncoder('utf-8');
        let userDescription = encoder.encode(connectCode);
        characteristic.writeValue(userDescription);
        requestLog(connectCode + ' (In Hexa ' + ascii_to_hexa(connectCode) + ')' )
        return characteristic.readValue();
      })
      .then(value => {
        log('Read ' + value.getUint8(0));
      })
      .catch(error => { 
        exceptionLog(error.message); 
      });
      
      
      function handleCharacteristicResponse (event) {
        let decoder = new TextDecoder('utf-8')
        let response = decoder.decode(event.target.value);
        
        responseLog(response + ' (In Hexa: '+ ascii_to_hexa(response)+')');
      }

      function onDisconnected(event) {
        let device = event.target;
        disconnectLog(device.name);
      }

      function onDisconnectButtonClick() {
        if (!bluetoothDevice) {
          return;
        }

        log('Disconnecting from Bluetooth Device...');
        if (bluetoothDevice.gatt.connected) {
          bluetoothDevice.gatt.disconnect();
        } else {
          log('> Bluetooth Device is already disconnected');
        }
      }
};


var ascii_to_hexa = function (str) {
	var arr1 = [];
	for (var n = 0, l = str.length; n < l; n ++) 
     {
		var hex = Number(str.charCodeAt(n)).toString(16);
		arr1.push(hex);
	 }
	return arr1.join('');
}

var log = function (data) {
  let logWindow = document.getElementById('logWindow');
  logWindow.style ='display:block';
  logWindow.textContent = data || '';
}

var requestLog = function(data) {
  let logWindow = document.getElementById('reqLogWindow');
  logWindow.style ='display:block';
  logWindow.textContent = 'RequestData: ' + data;
}

var responseLog = function(data) {
  let logWindow = document.getElementById('resLogWindow');
  logWindow.style ='display:block';
  logWindow.textContent = 'ResponseData: ' + data;
}

var disconnectLog = function(data) {
  let logWindow = document.getElementById('disLogWindow');
  logWindow.style ='display:block';
  logWindow.textContent = 'Disconnected: ' + data;
}

var exceptionLog = function(data) {
  let logWindow = document.getElementById('exeLogWindow');
  logWindow.style ='display:block';
  logWindow.textContent = 'Exception: ' + data;
}



