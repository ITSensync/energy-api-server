const { ActivityLog, Machine } = require('../models');
const { broadcast } = require('../websocket/socketManager');

const parsePagination = (req) => {
  const limit = Math.min(parseInt(req.query.limit || '100', 10), 1000);
  const offset = parseInt(req.query.skip || '0', 10);
  return { limit, offset };
};

exports.createActivityLog = async (payload) => {
  try {
    const { machineId, time, message } = payload;

    const machine = await Machine.findOne({ where: { groupName: machineId } });
    if (!machine) {
      throw { status: 404, message: 'Machine not found for machineId' };
    }

    const data = ActivityLog.create({ machineId, time, message });

    return {
      status: 200,
      message: "Successfull create activity logs",
      data,
    }
  } catch (error) {
    console.log(error);
    return {
      status: 500,
      message: error.message,
      data: error,
    }
  }

};

exports.fetchActivityLogs = async (payload) => {
  try {
    const where = {};
    if (payload.machineId) where.machineId = payload.machineId;

    const { limit } = payload;
    const logs = await ActivityLog.findAll({
      where,
      limit,
      order: [['createdAt', 'DESC']],
      include: [{ model: Machine, as: 'machine' }],
    });

    return {
      status: 200,
      message: "Successfull get activity logs",
      data: logs,
    }
  } catch (error) {
    console.log(error);
    return {
      status: 500,
      message: error.message,
      data: error,
    }
  }
};
