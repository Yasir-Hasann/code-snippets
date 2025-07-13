// module imports
const dotenv = require('dotenv');

// 1st
dotenv.config();
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : process.env.NODE_ENV === 'staging' ? '.env.staging' : '.env.development',
});

//2nd
dotenv.config();
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
