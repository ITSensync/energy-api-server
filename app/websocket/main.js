const { WebSocket } = require("ws");
const { setWss } = require("./socketManager");
const { fetchActivityLogs } = require("../services/activityLogService");
const { getTodayAverageData } = require("../services/averageRecordService");
const { fetchStatus } = require("../services/machineStatusService");
const { statsRuntime } = require("../services/runtimeService");
const { fetchTodayRecords } = require("../services/recordService");

const sendMessage = (ws, type, data) => {
  if (ws.readyState !== WebSocket.OPEN) return;

  ws.send(JSON.stringify({
    type,
    data,
  }));
};

const sendInitialData = async (ws, machineId) => {
  const payloads = await Promise.all([
    fetchStatus({ machineId }).then((result) => ({ type: "machine-status", result })),
    statsRuntime({ machineId }).then((result) => ({ type: "runtime-stats", result })),
    fetchActivityLogs({ machineId, limit: 10 }).then((result) => ({ type: "activity-logs", result })),
    // getTodayAverageData({ machineId }).then((result) => ({ type: "today-average", result })),
    fetchTodayRecords({ machineId}).then((result) => ({ type: "today-records", result }))
  ]);

  payloads.forEach(({ type, result }) => {
    if (result.status === 200) {
      sendMessage(ws, type, result.data);
    }
  });
};

exports.mainWebSocket = (server) => {
  const wss = new WebSocket.Server(server);

  setWss(wss);

  wss.on("connection", (ws) => {
    console.log("Client Connected");

    ws.on("message", async (message) => {
      try {
        const payload = JSON.parse(message);

        // simpan machineId yang di-subscribe client
        ws.machineId = payload.machineId;
        // ws.section = payload.section;

        sendMessage(ws, "subscribed");
        await sendInitialData(ws, payload.machineId);
      } catch (error) {
        console.error("WebSocket message error:", error);
        sendMessage(ws, "error", {
          message: "Failed to subscribe websocket client",
        });
      }
    });
  });

  console.log(`WebSocket server initialize on ws://localhost:${process.env.WS_PORT}`);
};
