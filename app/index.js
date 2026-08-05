const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cron = require('node-cron');
const { sequelize, initializeDummyData } = require('./models');
const recordsRouter = require('./routes/records');
const activityLogsRouter = require('./routes/activityLogs');
const averageRouter = require('./routes/average');
const machineStatusRouter = require('./routes/status');
const job = require('./cronjob/main');
const { createDummyEnergyRecord } = require('./cronjob/dummyEnergyRecords');
const { mainWebSocket } = require('./websocket/main');

const app = express();
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/records', recordsRouter);
app.use('/activity-logs', activityLogsRouter);
app.use('/average', averageRouter);
app.use('/status', machineStatusRouter)
// app.use('/machine-status', machineStatusRouter);

app.get('/', (req, res) => {
  res.json({ status: 'running' });
});

const port = process.env.PORT || 8001;
const ws_port = process.env.WS_PORT || 8002;
mainWebSocket({ port: ws_port })

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await initializeDummyData();
    app.listen(port, '0.0.0.0', () => {
      console.log(`DB service is running on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to DB:', error);
    process.exit(1);
  }
};

start();

cron.schedule('15 */2 * * * *', async () => {
  await job.checkRecords();
});

// Jalankan setiap 3 detik untuk kebutuhan data dummy lokal.
// cron.schedule('*/3 * * * * *', async () => {
//   try {
//     await createDummyEnergyRecord();
//   } catch (error) {
//     console.error('Failed to create dummy energy record:', error);
//   }
// });
