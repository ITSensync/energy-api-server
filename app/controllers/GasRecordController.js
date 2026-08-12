const gasRecordService = require('../services/gasRecordService');

exports.createGasRecord = async (req, res) => {
  const result = await gasRecordService.create(req.body);
  res.status(result.status).json(result);
}

exports.fetchGasRecords = async (req, res) => {
  const result = await gasRecordService.fetchGasRecords(req.query);
  res.status(result.status).json(result);
}

exports.fetchTodayGasRecords = async (req, res) => {
  const result = await gasRecordService.fetchTodayGasRecords(req.query);
  res.status(result.status).json(result);
}