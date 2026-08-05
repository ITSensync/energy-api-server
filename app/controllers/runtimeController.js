const runtimeService = require('../services/runtimeService');

exports.updateRuntime = async (req, res) => {
  const result = await runtimeService.updateRuntime(req.body)
  return res.status(result.status).send(result);
}

exports.createRuntime = async (req, res) => {
  const result = await runtimeService.createRuntime(req.body)
  return res.status(result.status).send(result);
}