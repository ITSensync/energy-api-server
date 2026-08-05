const { StatusMachine, Machine } = require("../models");
const { broadcast } = require("../websocket/socketManager");

exports.updateStatus = async (payload) => {
  try {
    const { machineId, status } = payload;

    if (!machineId || !status) {
      return {
        status: 400,
        message: "machine ID and status cannot be null",
      }
    }

    const machine = await Machine.findOne({
      where: { groupName: machineId }
    })

    if (!machine) {
      return {
        status: 404,
        message: `Machine with id: ${machineId} not found!`,
      }
    }

    const machineStatus = await StatusMachine.update(
      { status },
      { where: { machineId: machine.groupName } }
    )

    return {
      status: 200,
      message: "Update status machine successfull!",
      data: machineStatus,
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

exports.fetchStatus = async (payload) => {
  try {
    const { machineId } = payload;
    if (!machineId) {
      return {
        status: 400,
        message: 'Machine Id cannnot be null',
      }
    }

    const machine = await Machine.findOne({
      where: { groupName: machineId }
    })

    if (!machine) {
      return {
        status: 404,
        message: `Machine with id: ${machineId} not found!`,
      }
    }

    const statusMachine = await StatusMachine.findOne({
      where: { machineId: machine.groupName }
    })

    return {
      status: 200,
      message: "",
      data: statusMachine,
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