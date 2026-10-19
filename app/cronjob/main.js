const recordService = require('../services/recordService');
const machineStatusService = require('../services/machineStatusService');
const activityLogService = require('../services/activityLogService')
const runtimeService = require('../services/runtimeService');
const averageRecordService = require('../services/averageRecordService');
const kwhRecordService = require('../services/kwhRecordService');
const { broadcastMachineStatus, broadcastRuntimeStats, broadcastActivityLogs, broadcastTodayAverage, broadcastNotUpdateAlert } = require('../services/broardcastService');
const axios = require('axios');

let lastNotUpdateBroadcast = 0;
let lastLowTokenAlertThreshold = null;

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

exports.sendAlertEmail = async () => {
  try {
    /* GET LATEST DATA */
    const latestData = await kwhRecordService.getKwhRecord({ device_id: 'kwh-rumah-01', limit: 1 })

    if (latestData.status !== 200 || !latestData.data?.length) {
      throw new Error('latest data not found');
    }

    const latestKwhRecord = latestData.data[0];
    const rawTokenKwh = latestKwhRecord.tokenKwh;
    const remainingTokenKwh = Number(rawTokenKwh);

    if (rawTokenKwh === null || rawTokenKwh === undefined || rawTokenKwh === '' || !Number.isFinite(remainingTokenKwh)) {
      throw new Error('latest token value is not a valid number');
    }

    if (remainingTokenKwh > 15) {
      lastLowTokenAlertThreshold = null;
      return;
    }

    const alertThresholdKwh = remainingTokenKwh <= 5
      ? 5
      : remainingTokenKwh <= 10
        ? 10
        : 15;

    if (lastLowTokenAlertThreshold === null || alertThresholdKwh < lastLowTokenAlertThreshold) {
      const formatNumber = (value, maximumFractionDigits = 2) => {
        if (value === null || value === undefined || value === '') {
          return '-';
        }

        const number = Number(value);
        return Number.isFinite(number)
          ? new Intl.NumberFormat('id-ID', { maximumFractionDigits }).format(number)
          : '-';
      };
      const escapeHtml = (value) => String(value ?? '-')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

      const recordedAt = latestKwhRecord.datetime || '-';
      const tokenKwh = formatNumber(remainingTokenKwh, 3);
      const usedKwh = formatNumber(latestKwhRecord.usedKwhSinceTopup, 3);
      const power = formatNumber(latestKwhRecord.power, 0);
      const sensorFault = [true, 1, '1', 'true'].includes(latestKwhRecord.sensorFault);
      const sensorStatus = sensorFault ? 'Periksa sensor' : 'Normal';
      const safeRecordedAt = escapeHtml(recordedAt);
      const subject = `Peringatan level ${alertThresholdKwh} kWh: sisa token listrik ${tokenKwh} kWh - Rumah`;
      const text = [
        `PERINGATAN: TOKEN LISTRIK MENCAPAI LEVEL ${alertThresholdKwh} KWH`,
        '',
        `Sisa token listrik Rumah saat ini ${tokenKwh} kWh (ambang peringatan level ini: ${alertThresholdKwh} kWh).`,
        '',
        'Segera lakukan isi ulang token untuk menghindari listrik terputus.',
        '',
        `Data terakhir diterima: ${recordedAt}`,
        `Pemakaian sejak isi ulang: ${usedKwh} kWh`,
        `Daya saat pencatatan: ${power} W`,
        `Status sensor: ${sensorStatus}`,
      ].join('\n');

      const apiKey = process.env.BREVO_API_KEY;
      const senderEmail = process.env.BREVO_SENDER_EMAIL;
      if (!apiKey || !senderEmail) {
        throw new Error('BREVO_API_KEY and BREVO_SENDER_EMAIL must be configured');
      }

      const recipients = (process.env.ALERT_EMAIL_TO || 'aliefmabdillah09@gmail.com, sensyncproject@gmail.com, faisalmukti88@gmail.com')
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean)
        .map((email) => ({ email }));
      if (recipients.length === 0) {
        throw new Error('At least one alert email recipient must be configured');
      }

      const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: {
          name: process.env.BREVO_SENDER_NAME || 'KWH Dashboard Monitoring',
          email: senderEmail,
        },
        to: recipients,
        subject,
        textContent: text,
        htmlContent: `
          <!doctype html>
          <html lang="id">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>${escapeHtml(subject)}</title>
            </head>
            <body style="margin:0;padding:24px;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;">
                <tr>
                  <td style="padding:24px 28px;background:#245548;color:#ffffff;border-radius:10px 10px 0 0;">
                    <h1 style="margin:0;font-size:21px;line-height:1.3;">Peringatan: token listrik menipis</h1>
                    <p style="margin:8px 0 0;font-size:14px;">Meter listrik Rumah</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">Sisa token listrik terdeteksi <strong style="color: #c50c0c;">${tokenKwh} kWh</strong>, sudah mencapai level peringatan ${alertThresholdKwh} kWh.</p>
                    <p style="margin:0 0 20px;padding:14px 16px;background: #fff7ed;border-left:4px solid #f59e0b;font-size:14px;line-height:1.6;"><strong>Tindakan:</strong> Segera isi ulang token agar pasokan listrik tidak terputus.</p>
                    <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">Detail pembacaan terakhir (${safeRecordedAt})</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
                      <tr><td style="padding:11px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">Level ambang peringatan</td><td style="padding:11px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${alertThresholdKwh} kWh</td></tr>
                      <tr><td style="padding:11px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">Pemakaian sejak isi ulang</td><td style="padding:11px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${usedKwh} kWh</td></tr>
                      <tr><td style="padding:11px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">Daya saat ini</td><td style="padding:11px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${power} W</td></tr>
                      <tr><td style="padding:11px 0;color:#6b7280;">Status sensor</td><td style="padding:11px 0;text-align:right;font-weight:bold;color:${sensorFault ? '#b91c1c' : '#15803d'};">${sensorStatus}</td></tr>
                    </table>
                    <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">Pesan otomatis dari sistem monitoring berdasarkan pembacaan meter terbaru.</p>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      }, {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      console.log('Message sent via Brevo: %s', response.data?.messageId || 'accepted');
      lastLowTokenAlertThreshold = alertThresholdKwh;
    }
  } catch (error) {
    console.error('Failed to send alert email:', error?.response?.data || error?.message || error);
  }
}

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