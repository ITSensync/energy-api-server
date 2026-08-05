const { EnergyRecord, Machine } = require('../models');
const { broadcastEnergyRecord } = require('../services/broardcastService');

const MACHINE_ID = 'mtamixer';

const randomDecimal = (min, max) =>
  Number((min + Math.random() * (max - min)).toFixed(2));

const createDummyEnergyRecord = async () => {
  const machine = await Machine.findOne({ where: { groupName: MACHINE_ID } });

  if (!machine) {
    throw new Error(`Machine ${MACHINE_ID} was not found`);
  }

  const record = await EnergyRecord.create({
    machineId: machine.groupName,
    _terminalTime: new Date().toISOString(),
    arus1: randomDecimal(1, 2),
    arus2: randomDecimal(1, 2),
    arus3: randomDecimal(1, 2),
    getaran: randomDecimal(15, 40),
    temp: randomDecimal(25, 45),
    tegangan: randomDecimal(210, 240),
    mixerTime: randomDecimal(0, 120),
    machineTime: randomDecimal(0, 480),
    kwatt: randomDecimal(0.5, 2),
  });

  /* BROADCAST CALL */
  await broadcastEnergyRecord(MACHINE_ID);

  console.log(`Dummy energy record created: ${record.id}`);
  return record;
};

module.exports = { createDummyEnergyRecord };
