const recordService = require('../services/recordService');
const machineStatusService = require('../services/machineStatusService');
const activityLogService = require('../services/activityLogService')
const runtimeService = require('../services/runtimeService');
const averageRecordService = require('../services/averageRecordService');
const { broadcastMachineStatus, broadcastRuntimeStats, broadcastActivityLogs, broadcastTodayAverage, broadcastNotUpdateAlert } = require('../services/broardcastService');

let lastNotUpdateBroadcast = 0;

exports.checkRecords = async () => {
  try {
    const machineId = 'mtamixer';
    const lastRecordsResponse = await recordService.fetchTodayRecords({ machineId: 'mtamixer', });

    /* check last data not null */
    if (lastRecordsResponse.status !== 200 || !lastRecordsResponse.data?.length) {
      throw new Error('Last data not found');
    }

    const length = lastRecordsResponse.data.length
    const latestRecord = lastRecordsResponse.data[length - 1];
    
    // check not update
    const FIVE_MINUTES = 5 * 60 * 1000;
    const BROADCAST_INTERVAL = 2 * 60 * 1000;
    
    const lastDataTime = new Date(latestRecord.createdAt);
    const diffTime = Date.now() - lastDataTime.getTime();

    if (diffTime >= FIVE_MINUTES) {
      const now = Date.now();

      if (now - lastNotUpdateBroadcast >= BROADCAST_INTERVAL) {
        broadcastNotUpdateAlert(machineId);
        lastNotUpdateBroadcast = now;
      }

      return;
    }

    const targetStatus = latestRecord.getaran > 20 ? 'running' : 'stopped';
    const statusChanged = await updateStatusMachine(machineId, targetStatus);

    if (statusChanged) {
      const message = targetStatus === 'running'
        ? 'Machine status started'
        : 'Machine status stopped';

      await createLog(machineId, message);

      /* if (targetStatus === 'running') {
        await inputStartTime(machineId);
      } else {
        await updateRuntime(machineId);
      } */
    }

    const statusMachineNow = await machineStatusService.fetchStatus({ machineId });
    if (statusMachineNow.status === 200 && statusMachineNow.data?.status === 'running') {
      await calculateAvgRecordIfNeeded(machineId);
    }
  } catch (error) {
    console.error(error);
  }
};

async function updateStatusMachine(machineId, targetStatus) {
  const statusMachineNow = await machineStatusService.fetchStatus({ machineId });
  if (statusMachineNow.status !== 200) {
    throw new Error(statusMachineNow.message);
  }

  const currentStatus = statusMachineNow.data?.status || 'stopped';

  if (currentStatus === targetStatus) {
    // console.log(`Status already ${targetStatus}, no update needed`);
    return false;
  }

  const resultUpdateStatus = await machineStatusService.updateStatus({ machineId, status: targetStatus });
  if (resultUpdateStatus.status !== 200) {
    throw new Error(resultUpdateStatus.message);
  }

  /* BROADCAST CALL */
  await broadcastMachineStatus(machineId);

  // console.log(`Status updated to ${targetStatus}`);
  return true;
}

async function createLog(machineId, message) {
  const resultInput = await activityLogService.createActivityLog({ machineId, time: new Date(), message });
  if (resultInput.status !== 200) {
    throw new Error(resultInput.message);
  }

  // /* BROADCAST CALL */
  // await broadcastActivityLogs(machineId);

}

// async function inputStartTime(machineId) {
//   const resultInputTime = await runtimeService.createRuntime({ machineId })
//   if (resultInputTime.status !== 200) {
//     throw new Error(resultInputTime.message);
//   }
// }

// async function updateRuntime(machineId) {
//   const resultUpdate = await runtimeService.updateRuntime({ machineId });
//   if (resultUpdate.status !== 200) {
//     throw new Error(resultUpdate.message);
//   }

//   /* BROADCAST CALL */
//   await broadcastRuntimeStats(machineId);

// }

async function calculateAvgRecordIfNeeded(machineId) {
  const now = new Date();
  const lastFiveMinutes = new Date(now.getTime() - 5 * 60 * 1000);
  const lastAverage = await averageRecordService.fetchLatestAverage(machineId);

  if (lastAverage?.status === 200 && lastAverage.data) {
    const lastAverageTime = new Date(lastAverage.data.createdAt);
    if (lastAverageTime > lastFiveMinutes) {
      return;
    }
  }

  const resultCalcAvg = await averageRecordService.createAverage({ machineId });
  if (resultCalcAvg.status !== 200) {
    throw new Error(resultCalcAvg.message);
  }
}