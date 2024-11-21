const Joi = require('joi');

const validateLocationUpdate = (req, res, next) => {
  const settingsSchema = Joi.object({
    settings: Joi.object({
      groundTemperature: Joi.number().required()
    }).required()
  });

  const thresholdsSchema = Joi.object({
    temperature: Joi.object({
      min: Joi.number().required(),
      max: Joi.number().required()
    }).required(),
    humidity: Joi.object({
      min: Joi.number().required(),
      max: Joi.number().required()
    }).required(),
    pressure: Joi.object({
      min: Joi.number().required(),
      max: Joi.number().required()
    }).required()
  });

  const isSettingsUpdate = req.path.includes('/settings');
  const schema = isSettingsUpdate ? settingsSchema : thresholdsSchema;

  const { error } = schema.validate(req.body);
  if (error) {
    console.error('Validation error:', error.details[0].message);
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = { validateLocationUpdate }; 