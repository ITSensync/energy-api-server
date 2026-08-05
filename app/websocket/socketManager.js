const { WebSocket } = require("ws");

let wss = null;

const setWss = (server) => {
  wss = server;
};

const getWss = () => wss;

const broadcast = ({ type, machineId, data }) => {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) return;

    // Filter berdasarkan machine
    if (machineId && client.machineId !== machineId) return;

    /* // Filter berdasarkan section (opsional)
    if (section && client.section !== section) return; */

    client.send(JSON.stringify({
      type,
      data
    }));
  });
};

module.exports = {
  setWss,
  getWss,
  broadcast,
};