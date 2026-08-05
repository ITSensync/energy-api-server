const { where, fn, col, Op } = require("sequelize");
const { RuntimeMachine, Machine } = require("../models");
const { broadcast } = require("../websocket/socketManager");

const getWibDate = (date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
};

const getWibTime = (date) => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  const second = parts.find((part) => part.type === "second")?.value;

  return `${hour}:${minute}:${second}`;
};

const parseTimeToSeconds = (timeValue) => {
  if (!timeValue) {
    return 0;
  }

  const [hour = "0", minute = "0", second = "0"] = String(timeValue).split(":");
  return Number(hour) * 3600 + Number(minute) * 60 + Number(second);
};

exports.createRuntime = async (payload) => {
  try {
    const { machineId } = payload;

    if (!machineId) {
      return {
        status: 400,
        message: "Machine id cannot be null!",
      };
    }

    const machine = await Machine.findOne({
      where: { groupName: machineId },
    });

    if (!machine) {
      return {
        status: 404,
        message: `Machine with id: ${machineId} not found!`,
      };
    }

    const now = new Date();
    const runtimeDate = getWibDate(now);
    const runtime = await RuntimeMachine.create({
      machineId: machine.groupName,
      date: runtimeDate,
      startTime: getWibTime(now),
    });

    return {
      status: 200,
      message: "Runtime created successfully",
      data: runtime,
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: error.message,
      error,
    };
  }
};

exports.updateRuntime = async (payload) => {
  try {
    const { machineId } = payload;

    if (!machineId) {
      return {
        status: 400,
        message: "Machine id cannot be null!",
      };
    }

    const machine = await Machine.findOne({
      where: { groupName: machineId },
    });

    if (!machine) {
      return {
        status: 404,
        message: `Machine with id: ${machineId} not found!`,
      };
    }

    const runtime = await RuntimeMachine.findOne({
      where: { machineId: machine.groupName },
      order: [["id", "DESC"]],
    });

    if (!runtime) {
      return {
        status: 404,
        message: `Runtime for machine id: ${machineId} not found!`,
      };
    }

    const now = new Date();
    const endTime = getWibTime(now);
    const startSeconds = parseTimeToSeconds(runtime.startTime);
    const endSeconds = parseTimeToSeconds(endTime);
    const durationSeconds = Math.max(endSeconds - startSeconds, 0);
    const total = Math.round(durationSeconds / 60);

    const updatedRuntime = await runtime.update({
      stopTime: endTime,
      total,
    });

    return {
      status: 200,
      message: "Runtime updated successfully",
      data: updatedRuntime,
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: error.message,
      error,
    };
  }
};

exports.statsRuntime = async (payload) => {
  try {
    const { machineId } = payload;
    if (!machineId) {
      return {
        status: 400,
        message: "Machine id cannot be null!",
      };
    }

    const machine = await Machine.findOne({
      where: { groupName: machineId },
    });

    if (!machine) {
      return {
        status: 404,
        message: `Machine with id: ${machineId} not found!`,
      };
    }

    /* TODAY RUNTIME */
    const now = new Date();
    const todayDate = getWibDate(now);

    const todayRuntime = await RuntimeMachine.sum("total", {
      where: {
        machineId,
        date: todayDate,
      }
    })

    /* ALL TIME RUNTIME */
    const allTimeRuntime = await RuntimeMachine.sum("total", {
      where: {
        machineId,
      }
    })

    /* WEEKLY RUNTIME */
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const weeklyRuntime = await RuntimeMachine.findAll({
      attributes: [
        "date",
        [fn("DAYNAME", col("date")), "day"],
        [fn("SUM", col("total")), "total"],
      ],
      where: {
        machineId,
        date: {
          [Op.between]: [
            getWibDate(sevenDaysAgo),
            todayDate,
          ],
        },
      },
      group: ["date"],
      order: [["date", "ASC"]],
    });

    return {
      status: 200,
      message: 'Get Runtime Stats Successfully',
      data: {
        todayRuntime,
        allTimeRuntime,
        weeklyRuntime,
      }
    }

  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: error.message,
      error,
    }
  }
}