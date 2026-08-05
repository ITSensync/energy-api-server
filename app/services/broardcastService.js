const { broadcast } = require("../websocket/socketManager");
const { fetchActivityLogs } = require("./activityLogService");
const { getTodayAverageData } = require("./averageRecordService");
const { fetchStatus } = require("./machineStatusService");
const { statsRuntime } = require("./runtimeService");

exports.broadcastActivityLogs = async (machineId) => {
  /* BROADCAST WEBSOCKET */
  const listActivityLogs = await fetchActivityLogs({ machineId, limit: 10 });

  if (listActivityLogs.status === 200) {
    broadcast({
      type: 'activity-logs',
      machineId,
      data: listActivityLogs.data
    })
  }
}

exports.broadcastTodayAverage = async (machineId) => {
  /* BROADCAST WEBSOCKET */
  const todayAverage = await getTodayAverageData({ machineId })

  if (todayAverage.status === 200) {
    broadcast({
      type: 'today-average',
      machineId,
      data: todayAverage.data,
    })
  }
}

exports.broadcastEnergyRecord = async (machineId) => {
  /* BROADCAST NEW DATA */
  const { fetchTodayRecords } = require("./recordService");

  const energyData = await fetchTodayRecords({ machineId });
  if (energyData.status === 200) {
    broadcast({
      type: "today-records",
      machineId,
      data: energyData.data,
    })
  }
}

exports.broadcastMachineStatus = async (machineId) => {
  /* BROADCAST STATUS MACHINE */
  const resultStatus = await fetchStatus({ machineId });
  if (resultStatus.status === 200) {
    broadcast({
      type: "machine-status",
      machineId,
      data: resultStatus.data,
    })
  }
}

exports.broadcastRuntimeStats = async (machineId) => {
  /* BROADCAST NEW DATA */
  const runtimeStats = await statsRuntime({ machineId })

  if (runtimeStats.status === 200) {
    broadcast({
      type: 'runtime-stats',
      machineId,
      data: runtimeStats.data
    })
  }
}

exports.broadcastNotUpdateAlert = async (machineId) => {
  broadcast({
    type: "not-update-alert",
    machineId,
    data: {
      alert: true,
      message: 'Realtime data not update after 5 minute',
    }
  })
}