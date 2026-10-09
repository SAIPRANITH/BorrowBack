import { publishAPIMetric } from '../services/metricsService.js';

/**
 * Express middleware that tracks API response times and publishes metrics to CloudWatch.
 *
 * 1. Records start time using process.hrtime.bigint()
 * 2. On res.finish event, calculates response time in ms
 * 3. Calls publishAPIMetric with route path, status code, and response time
 * 4. Exported as default
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const metricsMiddleware = (req, res, next) => {
  try {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      try {
        const end = process.hrtime.bigint();
        const responseTimeMs = Number(end - start) / 1e6;

        let routePath = req.baseUrl || '';
        if (req.route?.path) {
          const subPath = req.route.path === '/' && req.baseUrl ? '' : req.route.path;
          routePath = `${req.baseUrl || ''}${subPath}`;
        }
        if (!routePath) {
          routePath = req.path || req.originalUrl?.split('?')[0] || req.url || 'unknown';
        }

        const statusCode = res.statusCode || 200;

        publishAPIMetric(routePath, statusCode, responseTimeMs);
      } catch (err) {
        console.error('[MetricsMiddleware] Error processing response metrics:', err.message);
      }
    });
  } catch (err) {
    console.error('[MetricsMiddleware] Error initializing metrics recording:', err.message);
  }

  next();
};

export default metricsMiddleware;
