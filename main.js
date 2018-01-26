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
  setUpButtons();
  setUpJoystick();
  setUpSlider();
  setUpKnob();
});

function setUpButtons() {
  [4, 5, 6, 7, 8].forEach((pin, i) => {
    board.pinMode(pin, J5.Pin.INPUT);
    board.digitalWrite(pin, 1);
    board.digitalRead(pin, value => sendSignal(`button_${i}`, value));
  });
}

function setUpJoystick() {
  const calc = voltage => (Math.round(voltage / 1024 * 100) / 100 - 0.5) * -2;
  board.analogRead(6, value => sendSignal('joystick_y', calc(value)));
  board.analogRead(5, value => sendSignal('joystick_x', calc(value)));
}

function setUpSlider() {
  const calc = voltage => Math.round(voltage / 1024 * 100) / 100;
  board.analogRead(7, value => sendSignal('slider', calc(value)));
}

function setUpKnob() {
  const values = [1, 1];
  [2, 3].forEach((pin, i) => {
    board.pinMode(pin, J5.Pin.INPUT);
    board.digitalRead(pin, value => {
      if (values[i] === value) {
        return;
      }
      const preState = values.toString();
      values[i] = value;
      const state = values.toString();

      if (state === '1,1') {
        if (preState === '0,1') {
          sendSignal('knob', 1, true);
        } else if (preState === '1,0') {
          sendSignal('knob', -1, true);
        }
      }
    });
  });
}

const cache = {};
function sendSignal(key, value, force) {
  if (!force && cache[key] === value) {
    return;
  }
  io.emit('signal', { key, value });
  cache[key] = value;
}