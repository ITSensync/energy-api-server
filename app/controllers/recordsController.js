const recordService = require('../services/recordService');


exports.createRecord = async (req, res) => {
  const result = await recordService.createEnergyRecord(req.body)
  return res.status(result.status).send(result);
};

exports.getRecords = async (req, res) => {
  const result = await recordService.fetchEnergyRecords(req)
  return res.status(result.status).send(result);
};

exports.getPaginatedRecords = async (req, res) => {
  const result = await recordService.fetchPaginatedEnergyRecords(req);
  return res.status(result.status).send(result);
};