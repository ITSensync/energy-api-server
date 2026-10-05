const { Op } = require("sequelize");
const { KwhRecord } = require("../models");

const formatDateTime = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})(.*)$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}${match[4]}` : value;
};

exports.createKwhRecord = async (payload) => {
  try {
    const { device_id } = payload;
    if (!device_id) {
      throw { status: 400, message: 'Device ID cannot be null!' };
    }

    // {
    //   "device_id": "kwh-rumah-01",
    //     "timestamp": 1790838333,
    //       "datetime": "01-10-2026 14:05:33",
    //         "token_kwh": 38420,
    //           "token_pulses": 38420,
    //             "total_used_kwh": 112305,
    //               "last_topup_kwh": 50.00,
    //                 "last_topup_epoch": 1790598612,
    //                   "power_w": 412,
    //                     "rssi": -61,
    //                       "uptime_s": 86400,
    //                         "sensor_fault": false
    // }
    console.log(payload);
    const kwhRecord = await KwhRecord.create({
      deviceId: device_id,
      timestamp: payload.timestamp,
      datetime: payload.datetime,
      tokenKwh: payload.token_kwh / 1000,
      tokenPulses: payload.token_pulses,
      usedKwhSinceTopup: payload.total_used_kwh,
      power: payload.power_w,
      rssi: payload.rssi,
      uptime: payload.uptime_s,
      sensorFault: payload.sensor_fault,
    });


    return {
      status: 200,
      message: 'Success Create Record',
      data: kwhRecord,
    };
  } catch (error) {
    console.error(error);
    return {
      status: error.status || 500,
      message: error.message || 'Error creating energy record(s)',
      error,
    };
  }
};

exports.getKwhRecord = async (query) => {
  try {
    const { device_id } = query;

    const kwhQuery = {};

    if (!device_id) {
      throw { status: 400, message: 'Device ID cannot be null!' };
    }

    kwhQuery.where = {
      ...kwhQuery.where,
      deviceId: device_id,
    }

    if (query.limit) {
      kwhQuery.limit = parseInt(query.limit);
    }

    const start = formatDateTime(query.startDate || new Date().toISOString().slice(0, 10) + ' 00:00:00');
    const end = formatDateTime(query.endDate || new Date().toISOString().slice(0, 10) + ' 23:59:59');
    kwhQuery.where = {
      ...kwhQuery.where,
      datetime: {
        [Op.between]: [start, end],
      },
    };

    const kwhRecords = await KwhRecord.findAll({ where: kwhQuery.where, limit: kwhQuery.limit, order: [['datetime', 'DESC']] });

    return {
      status: 200,
      message: 'Success Create Record',
      data: kwhRecords,
    };
  } catch (error) {
    console.error(error);
    return {
      status: error.status || 500,
      message: error.message || 'Error creating energy record(s)',
      error,
    };
  }
};