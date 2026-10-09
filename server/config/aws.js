import { S3Client } from '@aws-sdk/client-s3';
import { SESClient } from '@aws-sdk/client-ses';
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { SNSClient } from '@aws-sdk/client-sns';
import dotenv from 'dotenv';

dotenv.config();

const awsConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

// Only export initialized clients if credentials are provided (prevents crashes in dev without AWS keys)
const hasKeys = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== 'placeholder_key';

export const s3Client = hasKeys ? new S3Client(awsConfig) : null;
export const sesClient = hasKeys ? new SESClient(awsConfig) : null;
export const cwClient = hasKeys ? new CloudWatchClient(awsConfig) : null;
export const snsClient = hasKeys ? new SNSClient(awsConfig) : null;
