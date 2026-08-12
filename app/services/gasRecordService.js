const { Op } = require('sequelize');
const { Machine, GasRecord } = require("../models");

const getTodayRange = () => {
  const end = new Date();
  const start = new Date(end);
  start.setMinutes(start.getMinutes() - 2);

  return { start, end };
};

exports.create = async (payload) => {
  try {
    const { flow, total_flow } = payload;

    const machine = await Machine.findOne({ where: { groupName: 'mtamixer' } });
    if (!machine) {
      throw { status: 404, message: 'Machine not found for machineId' };
    }

    const data = await GasRecord.create({
      machineId: 'mtamixer',
      flow,
      total_flow
    });
    
    // BROADCAST GAS RECORDS
    const { broadcastEnergyRecord } = require('./broardcastService');
    await broadcastEnergyRecord('mtamixer');

    return {
      status: 200,
      message: "Success Create Gas Record",
      data,
    }
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: error.message,
      data: error,
    }
  }
}

exports.fetchGasRecords = async (options) => {
  try {
    const { limit } = options;
    // const include = [];

    /* if (options.query.includeActivityLogs === 'true') {
      include.push({ model: ActivityLog, as: 'activityLogs' });
    }

    if (options.query.includeMachine === 'true') {
      include.push({ model: Machine, as: 'machine' });
    } */

    const records = await GasRecord.findAll({
      limit,
      // offset,
      order: [['createdAt', 'DESC']],
      // include,
    });

    return {
      status: 200,
      message: "Success fetch record",
      data: records,
    }
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: error.message,
      error: error,
    }
  }
};

exports.fetchTodayGasRecords = async (payload) => {
  try {
    const { machineId } = payload;

    if (!machineId) {
      return {
        status: 400,
        message: 'Machine id cannot be null!',
      };
    }

    const { start, end } = getTodayRange();

    const records = await GasRecord.findAll({
      where: {
        machineId,
        createdAt: { [Op.between]: [start, end] },
      },
      order: [['createdAt', 'ASC']],
      raw: true,
    });

    return {
      status: 200,
      message: "Success fetch today record",
      data: records,
    }
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: error.message,
      error: error,
    }
  }
};