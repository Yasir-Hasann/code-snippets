// module imports
const { exec } = require('child_process');
const path = require('path');

function backupAndRestoreMongoDB() {
  const backupDir = path.resolve(__dirname, 'backup');

  const devUri = 'mongodb+srv://<user>:<pass>@example.mongodb.net/dev';
  const prodUri = 'mongodb+srv://<user>:<pass>@example.mongodb.net';

  const mongodumpCmd = `mongodump --uri="${devUri}" --out="${backupDir}"`;
  const mongorestoreCmd = `mongorestore --uri="${prodUri}" --db=prod --drop "${path.join(backupDir, 'dev')}"`;

  console.log('🔄 Starting backup from dev...');
  exec(mongodumpCmd, (dumpErr, dumpStdout, dumpStderr) => {
    if (dumpErr) {
      console.error('❌ Backup failed:', dumpStderr);
      return;
    }

    console.log('✅ Backup completed.\n🔄 Starting restore to prod...');
    exec(mongorestoreCmd, (restoreErr, restoreStdout, restoreStderr) => {
      if (restoreErr) {
        console.error('❌ Restore failed:', restoreStderr);
        return;
      }

      console.log('✅ Restore to prod completed successfully.');
    });
  });
}

backupAndRestoreMongoDB();

// Backup dev Data:
// mongodump --uri="mongodb+srv://<user>:<pass>@example.mongodb.net/dev" --out=./backup

// Copy Data from dev to prod:
// mongorestore --uri="mongodb+srv://<user>:<pass>@example.mongodb.net" --db=prod --drop "C:\Users\MYPC\backup\dev"
