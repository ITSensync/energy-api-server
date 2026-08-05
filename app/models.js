const { Sequelize, DataTypes } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL || 'mysql://root:makanminggu12@mysql:3307/plc-test';
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'mysql',
  logging: false,
});

const EnergyRecord = sequelize.define('EnergyRecord', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  machineId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'machines',
      key: 'groupName',
    },
  },
  _terminalTime: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // _groupName: {
  //   type: DataTypes.STRING,
  //   allowNull: false,
  // },
  arus1: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  arus2: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  arus3: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  getaran: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  temp: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  tegangan: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  mixerTime: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  machineTime: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  kwatt: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
}, {
  tableName: 'energy_records',
  timestamps: true,
  indexes: [
    { fields: ['machineId'] },
    // { fields: ['_groupName'] },
  ],
});

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  machineId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'machines',
      key: 'groupName',
    },
  },
  // _groupName: {
  //   type: DataTypes.STRING,
  //   allowNull: false,
  // },
  time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'activity_logs',
  timestamps: true,
  indexes: [
    { fields: ['machineId'] },
    // { fields: ['_groupName'] },
  ],
});

const AverageRecord = sequelize.define('AverageRecord', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  machineId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'machines',
      key: 'groupName',
    },
  },
  // _groupName: {
  //   type: DataTypes.STRING,
  //   allowNull: false,
  // },
  arus1: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  arus2: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  arus3: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  getaran: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  temp: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  tegangan: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  kwatt: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
}, {
  tableName: 'average_records',
  timestamps: true,
  indexes: [
    { fields: ['machineId'] },
    // { fields: ['_groupName'] },
  ],
})

const StatusMachine = sequelize.define('StatusMachine', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  machineId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    references: {
      model: 'machines',
      key: 'groupName',
    },
  },
  status: {
    type: DataTypes.ENUM('running', 'stopped'),
    allowNull: false,
  },
}, {
  tableName: 'status_machines',
  timestamps: true,

})

const RuntimeMachine = sequelize.define('RuntimeMachine', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  machineId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'machines',
      key: 'groupName',
    },
  },
  total: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  stopTime: {
    type: DataTypes.TIME,
    allowNull: true,
  }
}, {
  tableName: 'runtime_machines',
  timestamps: false,
  indexes: [
    { fields: ['machineId'] },
    // { fields: ['_groupName'] },
  ],
});

const Machine = sequelize.define('Machine', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  groupName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'machines',
  timestamps: true,
});

EnergyRecord.belongsTo(Machine, {
  foreignKey: 'machineId',
  as: 'machine',
});
Machine.hasMany(EnergyRecord, {
  foreignKey: 'machineId',
  as: 'energyRecords',
});

AverageRecord.belongsTo(Machine, {
  foreignKey: 'machineId',
  as: 'machine',
});
Machine.hasMany(AverageRecord, {
  foreignKey: 'machineId',
  as: 'averageRecords',
});

ActivityLog.belongsTo(Machine, {
  foreignKey: 'machineId',
  as: 'machine',
});
Machine.hasMany(ActivityLog, {
  foreignKey: 'machineId',
  as: 'activityLogs',
});

StatusMachine.belongsTo(Machine, {
  foreignKey: 'machineId',
  as: 'machine',
});
Machine.hasOne(StatusMachine, {
  foreignKey: 'machineId',
  as: 'statusMachine',
});

const initializeDummyData = async () => {
  const [machine] = await Machine.findOrCreate({
    where: { groupName: 'mtamixer' },
    defaults: { groupName: 'mtamixer' },
  });

  await StatusMachine.findOrCreate({
    where: { machineId: machine.groupName },
    defaults: {
      machineId: machine.groupName,
      status: 'stopped',
    },
  });
};

module.exports = {
  sequelize,
  Machine,
  EnergyRecord,
  ActivityLog,
  AverageRecord,
  StatusMachine,
  RuntimeMachine,
  initializeDummyData,
};
