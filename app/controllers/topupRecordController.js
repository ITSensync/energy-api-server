const topupRecordService = require('../services/topupRecordService');


exports.createRecord = async (req, res) => {
  const result = await topupRecordService.createTopupRecord(req.body);
  return res.status(result.status).send(result);
};

exports.getRecords = async (req, res) => {
  const result = await topupRecordService.getTopupRecords(req.query);
  return res.status(result.status).send(result);
};

exports.deleteRecord = async (req, res) => {
  const result = await topupRecordService.deleteTopupRecords(req.query);
  return res.status(result.status).send(result);
}