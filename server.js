const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const J5 = require("johnny-five");

server.listen(8080);
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const board = new J5.Board({ repl: false });
board.on("ready", () => {
  const toPercent = voltage => Math.round(voltage / 1024 * 100) / 100;

  board.analogRead(0, voltage => {
    const p = toPercent(voltage);
    const freq = 400 * p + 40;

    setParam('pitch.windowSize', p * 0.1);
  });
  board.analogRead(1, voltage => {
  });
});

const cache = {};
function setParam(key, value) {
  if (cache[key] === value) {
    return;
  }
  io.emit('setParam', { key, value });
  cache[key] = value;
}