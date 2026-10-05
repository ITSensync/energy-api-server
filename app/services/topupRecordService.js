const { Op } = require("sequelize");
const { TopupRecord } = require("../models");

const parseWibDateTime = (value) => {
  const deviceFormat = /^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(value);
  const isoFormat = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(value);

  if (!deviceFormat && !isoFormat) {
    throw new Error('Invalid date format. Expected DD-MM-YYYY HH:mm:ss or YYYY-MM-DD HH:mm:ss.');
  }

  const [, year, month, day, hour, minute, second] = deviceFormat
    ? [deviceFormat[0], deviceFormat[3], deviceFormat[2], deviceFormat[1], ...deviceFormat.slice(4)]
    : isoFormat;
  const wibTime = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  const wibDate = new Date(wibTime);

  if (
    wibDate.getUTCFullYear() !== Number(year) ||
    wibDate.getUTCMonth() !== Number(month) - 1 ||
    wibDate.getUTCDate() !== Number(day) ||
    wibDate.getUTCHours() !== Number(hour) ||
    wibDate.getUTCMinutes() !== Number(minute) ||
    wibDate.getUTCSeconds() !== Number(second)
  ) {
    throw new Error('Invalid date value.');
  }

  return new Date(wibTime - 7 * 60 * 60 * 1000);
};

const getTodayInWib = () => new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

exports.createTopupRecord = async (payload) => {
  try {
    const { device_id } = payload;
    if (!device_id) {
      throw { status: 400, message: 'Device ID cannot be null!' };
    }

    const topupRecord = await TopupRecord.create({
      deviceId: device_id,
      totalTopupKwh: payload.total_topup_kwh,
    });


    return {
      status: 200,
      message: 'Success Create Record',
      data: topupRecord,
    };
  } catch (error) {
    console.error(error);
    return {
      status: error.status || 500,
      message: error.message || 'Error creating topup record(s)',
      error,
    };
  }
};

exports.getTopupRecords = async (query) => {
  try {
    const { device_id } = query;

    const topupQuery = {};

    if (!device_id) {
      throw { status: 400, message: 'Device ID cannot be null!' };
    }

    topupQuery.where = {
      ...topupQuery.where,
      deviceId: device_id,
    }

    if (query.limit) {
      topupQuery.limit = parseInt(query.limit);
    }

    const today = getTodayInWib();
    const start = parseWibDateTime(query.startDate + ' 00:00:00' || `${today} 00:00:00`);
    const end = parseWibDateTime(query.endDate + ' 23:59:59' || `${today} 23:59:59`);
    topupQuery.where = {
      ...topupQuery.where,
      createdAt: {
        [Op.between]: [start, end],
      },
    };

    const topupRecords = await TopupRecord.findAll({ where: topupQuery.where, limit: topupQuery.limit, order: [['createdAt', 'DESC']] });

    return {
      status: 200,
      message: 'Success Get Record',
      data: topupRecords,
    };
  } catch (error) {
    console.error(error);
    return {
      status: error.status || 500,
      message: error.message || 'Error creating topup record(s)',
      error,
    };
  }
};

exports.deleteTopupRecords = async (query) => {
  try {
    const { id, device_id } = query;

    const topupQuery = {};

    if (!device_id) {
      throw { status: 400, message: 'Device ID cannot be null!' };
    }

    topupQuery.where = {
      ...topupQuery.where,
      id,
      deviceId: device_id,
    }

    const deletedCount = await TopupRecord.destroy({ where: topupQuery.where })

    return {
      status: 200,
      message: 'success delete records',
      data: { deletedCount },
    }
  } catch (error) {
    console.error(error);
    return {
      status: error.status || 500,
      message: error.message || 'Error deleting topup record(s)',
      error,
    };
  }
}