import { PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { cwClient } from '../config/aws.js';

const NAMESPACE = 'BorrowBack';

/**
 * Publishes a custom metric to CloudWatch under namespace 'BorrowBack'.
 * If cwClient is null, logs and returns without throwing.
 *
 * @param {string} metricName - Name of the metric (e.g., 'UserRegistered')
 * @param {number} [value=1] - Metric value
 * @param {string} [unit='Count'] - CloudWatch unit (e.g., 'Count', 'Milliseconds')
 * @param {Array<{Name: string, Value: string}>} [dimensions=[]] - Optional dimensions array
 * @returns {Promise<void>}
 */
export async function publishMetric(metricName, value = 1, unit = 'Count', dimensions = []) {
  try {
    if (!metricName || typeof metricName !== 'string') {
      console.warn('[Metrics] Invalid metricName provided to publishMetric');
      return;
    }

    if (!cwClient) {
      console.log(`[Metrics] CloudWatch client not configured. Skipping metric '${metricName}' (value: ${value}, unit: ${unit})`);
      return;
    }

    const metricDatum = {
      MetricName: metricName,
      Value: Number(value),
      Unit: unit,
      Timestamp: new Date(),
    };

    if (Array.isArray(dimensions) && dimensions.length > 0) {
      metricDatum.Dimensions = dimensions;
    }

    const command = new PutMetricDataCommand({
      Namespace: NAMESPACE,
      MetricData: [metricDatum],
    });

    await cwClient.send(command);
  } catch (error) {
    console.error(`[Metrics] Error publishing metric '${metricName}':`, error.message);
  }
}

/**
 * Publishes API metrics to CloudWatch:
 * - RequestCount (Count)
 * - ResponseTime (Milliseconds)
 * - ErrorCount (Count) if statusCode >= 400
 *
 * @param {string} endpoint - API endpoint/route path
 * @param {number} statusCode - HTTP response status code
 * @param {number} responseTimeMs - Response duration in milliseconds
 * @returns {Promise<void>}
 */
export async function publishAPIMetric(endpoint, statusCode, responseTimeMs) {
  try {
    const cleanEndpoint = String(endpoint || 'unknown').split('?')[0];
    const status = Number(statusCode) || 200;
    const duration = Math.max(0, Number(responseTimeMs) || 0);

    if (!cwClient) {
      console.log(`[Metrics] CloudWatch client not configured. Skipping API metrics for '${cleanEndpoint}' (status: ${status}, duration: ${duration.toFixed(2)}ms)`);
      return;
    }

    const dimensions = [
      { Name: 'Endpoint', Value: cleanEndpoint },
    ];

    const metricData = [
      {
        MetricName: 'RequestCount',
        Value: 1,
        Unit: 'Count',
        Timestamp: new Date(),
        Dimensions: dimensions,
      },
      {
        MetricName: 'ResponseTime',
        Value: duration,
        Unit: 'Milliseconds',
        Timestamp: new Date(),
        Dimensions: dimensions,
      },
    ];

    if (status >= 400) {
      metricData.push({
        MetricName: 'ErrorCount',
        Value: 1,
        Unit: 'Count',
        Timestamp: new Date(),
        Dimensions: dimensions,
      });
    }

    const command = new PutMetricDataCommand({
      Namespace: NAMESPACE,
      MetricData: metricData,
    });

    await cwClient.send(command);
  } catch (error) {
    console.error('[Metrics] Error publishing API metric:', error.message);
  }
}

/**
 * Convenience wrapper for publishing business event metrics.
 * Events like 'UserRegistered', 'ItemCreated', 'BorrowCreated', 'BorrowReturned', 'LoanCreated', 'LoanRepaid'.
 *
 * @param {string} metricName - Name of the business event metric
 * @param {Array<{Name: string, Value: string}>} [dimensions=[]] - Optional dimensions array
 * @returns {Promise<void>}
 */
export async function publishBusinessMetric(metricName, dimensions = []) {
  try {
    if (!metricName || typeof metricName !== 'string') {
      console.warn('[Metrics] Invalid metricName provided to publishBusinessMetric');
      return;
    }

    await publishMetric(metricName, 1, 'Count', dimensions);
  } catch (error) {
    console.error(`[Metrics] Error publishing business metric '${metricName}':`, error.message);
  }
}
