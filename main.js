const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const J5 = require("johnny-five");

server.listen(8080);
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const board = new J5.Board();
board.on("ready", () => {
  // [8, 9, 10, 11, 12].forEach(i => {
  //   board.pinMode(i, J5.Pin.INPUT);
  //   board.digitalWrite(i, 1);
  //   board.digitalRead(i, digitalReadHandler(`button_${i}`))
  // });

  // board.analogRead(0, analogReadHandler('joystick_x'));
  // board.analogRead(1, analogReadHandler('joystick_y'));

  setUpKnob();
});

function setUpKnob() {
  const values = [1, 1];
  [2, 3].forEach((pin, i) => {
    board.pinMode(pin, J5.Pin.INPUT);
    board.digitalRead(pin, value => {
      if(values[i] === value){
        return;
      }
      const preState = values.toString();
      values[i] = value;
      const state = values.toString();

      if(state === '1,1'){
        if(preState === '0,1'){
          sendSignal('knob', 1, false);
        }else if(preState === '1,0') {
          sendSignal('knob', -1, false);
        }
      }
    });
  });
}

function analogReadHandler(key) {
  return voltage => {
    sendSignal(key, Math.round(voltage / 1024 * 100) / 100);
  }
}

function digitalReadHandler(key) {
  return value => {
    sendSignal(key, value);
  }
}

const cache = {};
function sendSignal(key, value, needCache) {
  if(needCache === undefined){
    needCache = true;
  }
  if (needCache && cache[key] === value) {
    return;
  }
  io.emit('signal', { key, value });
  cache[key] = value;
}