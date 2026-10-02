const kwhRecordService = require('../services/kwhRecordService.js');

exports.createRecord = async (req, res) => {
  const result = await kwhRecordService.createKwhRecord(req.body)
  return res.status(result.status).send(result);
};