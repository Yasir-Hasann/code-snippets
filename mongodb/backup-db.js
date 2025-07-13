// module imports
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const { exec } = require('child_process');
const { createReadStream, createWriteStream } = require('fs');
const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// variable initializations
const { APP_ENV, DATABASE_URI, AWS_S3_BUCKET_ACCESS_KEY, AWS_S3_BUCKET_SECRET_KEY, AWS_REGION, AWS_S3_BUCKET_NAME } = process.env;
const S3_BACKUP_PREFIX = 'mongodb-backups';
const BACKUP_DIR = path.join(process.cwd(), S3_BACKUP_PREFIX);
const RETENTION_DAYS = 90;

const S3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_S3_BUCKET_ACCESS_KEY,
    secretAccessKey: AWS_S3_BUCKET_SECRET_KEY,
  },
  sslEnabled: false,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

// Function to execute shell commands
const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${command}; ${error.message}`);
        return reject(error);
      }

      if (stderr) console.error(`stderr: ${command}; ${stderr}`);
      console.log(stdout);
      resolve(stdout);
    });
  });
};

// Upload To s3
const uploadToS3 = async (filePath, key) => {
  const fileBuffer = createReadStream(filePath);

  const params = {
    Bucket: AWS_S3_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: 'application/zip',
    ACL: 'public-read',
  };

  try {
    const command = new PutObjectCommand(params);
    await S3.send(command);
    console.log(`Uploaded to S3: https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`);
  } catch (error) {
    console.error('Error in uploading:', error);
    return null;
  }
};

// List files in s3
const listFilesInDirectory = async (prefix) => {
  try {
    const params = {
      Bucket: AWS_S3_BUCKET_NAME,
      Prefix: prefix,
    };

    const command = new ListObjectsV2Command(params);
    const data = await S3.send(command);

    if (data.Contents && data.Contents.length > 0) {
      return data.Contents.map((file) => file.Key);
    } else {
      console.log('No files found in this directory.');
      return [];
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Delete file from s3
const deleteFileFromS3 = async (fileKey) => {
  const params = {
    Bucket: AWS_S3_BUCKET_NAME,
    Key: fileKey,
  };

  try {
    const command = new DeleteObjectCommand(params);
    await S3.send(command);
  } catch (error) {
    console.error('Error: ', error);
  }
};

// Delete old backups
const deleteOldBackups = async () => {
  console.log(`Deleting backups older than ${RETENTION_DAYS} days...`);
  const listFiles = await listFilesInDirectory(S3_BACKUP_PREFIX);

  const now = Date.now();
  for (const file of listFiles) {
    const match = file.match(new RegExp(`(${APP_ENV})_backup_(\\d+)\\.(zip|gz)$`));
    if (match) {
      const fileTimestamp = parseInt(match[2], 10);
      const ageInDays = (now - fileTimestamp) / (1000 * 60 * 60 * 24);

      console.log(`Backup ${file} is ${ageInDays.toFixed(2)} days old`);
      if (ageInDays > RETENTION_DAYS) {
        console.log(`Deleting old backup: ${file}`);
        await deleteFileFromS3(file);
      }
    }
  }
};

// Backup function
exports.backupDatabase = async () => {
  try {
    console.log('Starting MongoDB Backup...');

    const timestamp = Date.now();
    const backupDir = `${BACKUP_DIR}/${APP_ENV}_backup_${timestamp}`;
    const zipFile = `${backupDir}.zip`;

    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await runCommand(`mongodump --uri=${DATABASE_URI} --out=${backupDir}`);

    console.log('Compressing backup...');
    const output = createWriteStream(zipFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(backupDir, false);
      archive.finalize();
    });

    console.log(`Backup compressed: ${zipFile}`);
    const s3Key = `${S3_BACKUP_PREFIX}/${APP_ENV}_backup_${timestamp}.zip`;
    await uploadToS3(zipFile, s3Key);
    // await fs.rm(backupDir, { recursive: true, force: true });
    // await fs.unlink(zipFile);
    await fs.rm(BACKUP_DIR, { recursive: true, force: true });
    await deleteOldBackups();

    console.log('Backup process completed!');
  } catch (error) {
    console.error('Backup failed:', error);
  }
};

// const backupDatabaseToSingleGZip = async () => {
//   try {
//     console.log('Starting MongoDB Backup...');
//     const timestamp = Date.now();
//     const backupFile = `${BACKUP_DIR}/${APP_ENV}_backup_${timestamp}.gz`;

//     await fs.mkdir(BACKUP_DIR, { recursive: true });
//     await runCommand(`mongodump --uri=${DATABASE_URI} --archive=${backupFile} --gzip`);
//     console.log('Backed Up...');
//     const s3Key = `${S3_BACKUP_PREFIX}/${APP_ENV}_backup_${timestamp}.gz`;
//     await uploadToS3(backupFile, s3Key);
//     await fs.unlink(backupFile);
//     await deleteOldBackups();

//     console.log('Backup process completed!');
//   } catch (error) {
//     console.error('Backup failed:', error);
//   }
// };
