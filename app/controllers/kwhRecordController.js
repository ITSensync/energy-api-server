const kwhRecordService = require('../services/kwhRecordService.js');

exports.createRecord = async (req, res) => {
  const result = await kwhRecordService.createKwhRecord(req.body)
  return res.status(result.status == "ok" ? 200 : result.status).send(result);
};

exports.getRecord = async (req, res) => {
  const result = await kwhRecordService.getKwhRecord(req.query)
  return res.status(result.status).send(result);
}