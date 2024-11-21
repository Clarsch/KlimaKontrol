const Joi = require('joi');

const locationSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  settings: Joi.object({
    groundTemperature: Joi.number().required()
  }).required(),
  thresholds: Joi.object({
    temperature: Joi.object({
      min: Joi.number().required(),
      max: Joi.number().required()
    }),
    humidity: Joi.object({
      min: Joi.number().required(),
      max: Joi.number().required()
    }),
    pressure: Joi.object({
      min: Joi.number().required(),
      max: Joi.number().required()
    })
  }).required(),
  warnings: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      type: Joi.string().required(),
      message: Joi.string().required(),
      active: Joi.boolean().required(),
      timestamp: Joi.date().required()
    })
  ).default([]),
  status: Joi.string().valid('ok', 'warning', 'error').default('ok'),
  lastUpdate: Joi.date().allow(null).default(null),
  environmentalData: Joi.array().default([])
});

const areaSchema = Joi.object({
  name: Joi.string().required(),
  locations: Joi.array().items(Joi.string()).required()
});

const validateConfig = (config) => {
  const result = locationSchema.validate(config);
  if (result.error) {
    throw new Error(`Invalid config: ${result.error.message}`);
  }
  return result.value;
};

const validateAreasConfig = (config) => {
  const result = areaSchema.validate(config);
  if (result.error) {
    throw new Error(`Invalid areas config: ${result.error.message}`);
  }
  return result.value;
};

module.exports = { validateConfig, validateAreasConfig }; 