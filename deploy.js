const SftpClient = require('ssh2-sftp-client');
const path = require('path');
require('dotenv').config();

const config = {
  host: process.env.SSH_HOST,
  port: 22,
  username: process.env.SSH_USER,
  password: process.env.SSH_PASS,
};

const localPath = path.join(__dirname, 'dist');
const remotePath = '/home/www/html/homepage';

const sftp = new SftpClient();

const main = async () => {
  try {
    await sftp.connect(config);
    console.log('Connected to server');

    console.log(`Creating directory ${remotePath}...`);
    await sftp.mkdir(remotePath, true);
    console.log('Remote directory created.');

    await sftp.uploadDir(localPath, remotePath, (filePath) => {
      return !filePath.includes('node_modules') && !filePath.includes('.git');
    });
    console.log('Files uploaded successfully');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    sftp.end();
  }
};

main();

