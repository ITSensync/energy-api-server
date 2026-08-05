const { getTodayAverageData } = require("../services/averageRecordService")

exports.getTodayAverage = async (req, res) => {
  const result = await getTodayAverageData(req.query);
  res.status(result.status).send(result);
}