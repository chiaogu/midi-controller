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
  [8, 9, 10, 11, 12].forEach(i => {
    board.pinMode(i, J5.Pin.INPUT);
    board.digitalWrite(i, 1);
    board.digitalRead(i, digitalReadHandler(`button_${i}`))
  });

  // board.analogRead(0, analogReadHandler('joystick_x'));
  // board.analogRead(1, analogReadHandler('joystick_y'));
});

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
function sendSignal(key, value) {
  if (cache[key] === value) {
    return;
  }
  io.emit('signal', { key, value });
  cache[key] = value;
}