'use strict';
const Minio = require('minio');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
require('dotenv').config();

const endPoint = process.env.MINIO_ENDPOINT || 'localhost';
const port = parseInt(process.env.MINIO_PORT, 10) || 9000;
const useSSL = process.env.MINIO_USE_SSL === 'true';
const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin123';
const BUCKET_NAME = process.env.MINIO_BUCKET || 'pravzo-uploads';

const minioClient = new Minio.Client({
  endPoint: endPoint.replace(/^https?:\/\//, ''),
  port: (port === 80 || port === 443 || endPoint.includes('amazonaws.com')) ? undefined : port,
  useSSL,
  accessKey,
  secretKey
});

async function initializeBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
          }
        ]
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      logger.info(`[MinIO] Bucket '${BUCKET_NAME}' created and public policy set.`);
    } else {
      logger.info(`[MinIO] Bucket '${BUCKET_NAME}' ready.`);
    }
  } catch (err) {
    logger.warn('[MinIO] Init notice:', { error: err.message });
  }
}

function getFileUrl(fileName) {
  if (process.env.MINIO_PUBLIC_URL) {
    return `${process.env.MINIO_PUBLIC_URL.replace(/\/$/, '')}/${BUCKET_NAME}/${fileName}`;
  }
  const proto = useSSL ? 'https' : 'http';
  const cleanEndpoint = endPoint.replace(/^https?:\/\//, '');
  if (port === 80 || port === 443 || cleanEndpoint.includes('amazonaws.com')) {
    return `${proto}://${cleanEndpoint}/${BUCKET_NAME}/${fileName}`;
  }
  return `${proto}://${cleanEndpoint}:${port}/${BUCKET_NAME}/${fileName}`;
}

/**
 * Upload buffer directly to MinIO (Zero disk footprint)
 */
async function uploadFile(fileBuffer, fileName, mimeType) {
  await minioClient.putObject(BUCKET_NAME, fileName, fileBuffer, {
    'Content-Type': mimeType || 'application/octet-stream'
  });
  return getFileUrl(fileName);
}

/**
 * Upload local file to MinIO and auto-delete local file afterwards
 */
async function uploadFromPath(localFilePath, fileName, mimeType) {
  try {
    const buffer = fs.readFileSync(localFilePath);
    const targetFileName = fileName || path.basename(localFilePath);
    const fileUrl = await uploadFile(buffer, targetFileName, mimeType);

    // Auto-delete local temp file after cloud upload
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (e) {
        logger.debug('Temp file delete notice:', e.message);
      }
    }
    return fileUrl;
  } catch (err) {
    // Attempt cleanup even on error
    if (fs.existsSync(localFilePath)) {
      try { fs.unlinkSync(localFilePath); } catch (e) {}
    }
    throw err;
  }
}

/**
 * Delete file from MinIO bucket
 */
async function deleteFile(fileNameOrUrl) {
  try {
    if (!fileNameOrUrl) return false;
    let fileName = fileNameOrUrl;
    if (fileNameOrUrl.includes('/')) {
      fileName = fileNameOrUrl.split('/').pop();
    }
    await minioClient.removeObject(BUCKET_NAME, fileName);
    return true;
  } catch (err) {
    logger.warn('[MinIO] Delete file notice:', { error: err.message });
    return false;
  }
}

module.exports = {
  minioClient,
  initializeBucket,
  uploadFile,
  uploadFromPath,
  deleteFile,
  getFileUrl,
  BUCKET_NAME
};
