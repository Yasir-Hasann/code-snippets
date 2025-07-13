// module imports
const express = require('express');
const cors = require('cors');

// file imports
const apiRouter = require('./routes');
const { encryptResponse, decryptRequest } = require('./middlewares/secure-apis');

// variable initializations
const app = express();
const port = 5001;

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(decryptRequest);
app.use(encryptResponse);

// mount routes
app.use('/api/v1', apiRouter);

app.listen(port, () => console.log(`Server is running on port: ${port}`));
