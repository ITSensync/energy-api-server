const machineStatusService = require('../services/machineStatusService')

exports.updateStatus = async (req, res) => {
  const result = await machineStatusService.updateStatus(req.body);
  res.status(result.status).send(result);
}