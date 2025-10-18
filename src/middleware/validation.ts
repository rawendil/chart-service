import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const logger = new Logger();

// Chart type validation
export const chartTypeSchema = Joi.string()
  .valid('line', 'bar', 'pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble', 'mixed')
  .required();

// Theme validation
export const themeSchema = Joi.string()
  .valid('light', 'dark', 'custom')
  .default('light');

// Dataset validation
export const datasetSchema = Joi.object({
  label: Joi.string().required(),
  data: Joi.array().items(Joi.number()).required(),
  backgroundColor: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ),
  borderColor: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ),
  borderWidth: Joi.number().integer().min(0).max(10),
  fill: Joi.boolean(),
  type: Joi.string().valid('line', 'bar')
});

// Chart data validation
export const chartDataSchema = Joi.object({
  labels: Joi.array().items(Joi.string()).required(),
  datasets: Joi.array().items(datasetSchema).min(1).required()
});

// Chart configuration validation
export const chartConfigSchema = Joi.object({
  type: chartTypeSchema,
  options: Joi.object({
    responsive: Joi.boolean(),
    maintainAspectRatio: Joi.boolean(),
    plugins: Joi.object({
      legend: Joi.object({
        display: Joi.boolean(),
        position: Joi.string().valid('top', 'bottom', 'left', 'right')
      }),
      title: Joi.object({
        display: Joi.boolean(),
        text: Joi.string()
      })
    }),
    scales: Joi.object(),
    elements: Joi.object()
  })
});

// Generate chart request validation (camelCase input)
export const generateChartSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string().max(1000),
  chartType: chartTypeSchema,
  data: chartDataSchema,
  width: Joi.number().integer().min(100).max(4000).default(800),
  height: Joi.number().integer().min(100).max(4000).default(600),
  theme: themeSchema,
  isPublic: Joi.boolean().default(false),
  expiresAt: Joi.date().greater('now'),
  chartConfig: chartConfigSchema
});

// Update chart request validation (camelCase input)
export const updateChartSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string().max(1000),
  data: chartDataSchema,
  width: Joi.number().integer().min(100).max(4000),
  height: Joi.number().integer().min(100).max(4000),
  theme: themeSchema,
  isPublic: Joi.boolean(),
  expiresAt: Joi.date().greater('now'),
  chartConfig: chartConfigSchema
}).min(1); // At least one field must be provided

// Parameter validation middleware
export function validateParams(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Parameter validation failed', {
        errors: validationErrors,
        params: req.params
      });

      res.status(400).json({
        success: false,
        error: 'Parameter validation failed',
        details: validationErrors
      });
      return;
    }

    req.params = value;
    next();
  };
}

// Query validation middleware
export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Query validation failed', {
        errors: validationErrors,
        query: req.query
      });

      res.status(400).json({
        success: false,
        error: 'Query validation failed',
        details: validationErrors
      });
      return;
    }

    req.query = value;
    next();
  };
}

// Validation middleware factory
export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation failed', {
        errors: validationErrors,
        body: req.body
      });

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
      return;
    }

    req.body = value;
    next();
  };
}
