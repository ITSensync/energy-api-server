const { Machine, ActivityLog } = require('../models');
const activityService = require('../services/activityLogService')

exports.createActivityLog = async (req, res) => {
  const result = await activityService.createActivityLog(req.body);
  res.status(result.status).send(result);
};

exports.getActivityLogs = async (req, res) => {
  const result = await activityService.fetchActivityLogs(req);
  res.status(result.status).send(result);
};