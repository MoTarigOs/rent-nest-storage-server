const express = require('express');
const app = express();
require('dotenv').config();
var cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./Config/dbConnection.js');
const PORT = process.env.PORT || 5500;
const cookieParser = require('cookie-parser');
const rateLimitMiddleware = require('./Middleware/RateLimiter.js');
const tooBusy = require('toobusy-js');
const helmet = require('helmet');
const buildLogger = require('./Logger/ProdLogger.js');
const scanFiles = require('./Middleware/ScanUploadedFiles.js');
const logger = buildLogger();

connectDB();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN, credentials: true, allowedHeaders: ['Content-Type', 'authorization'] }));
app.use(rateLimitMiddleware);
app.use(express.urlencoded({ extended: false })); 
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(helmet());
app.use(function (req, res, next) {
    if(tooBusy()){
        return res.status(503).send("The server is too busy, please try again after a moment");
    } else {
        next();
    }
});
app.disable('x-powered-by');

app.use("/upload", require("./Routers/UploadRouter.js"));
app.use("/download", require("./Routers/DownloadRouter.js"));
app.use("/delete", require("./Routers/DeleteRouter.js"));
app.use("/admin", require("./Routers/AdminRouter.js"));

app.use("/test", async(req, res, next) => {
    req.files = [{ filename: 'test.jpg' }];
    next();
}, scanFiles, (req, res) => {
    res.status(200).json({ message: 'success' });
});


//handle errors & exceptions, with logger
process.on("uncaughtException", (err) => {

    console.error('error occured: ', err.message);

    async function waitForLogger(trans) {
        const transportsFinished = trans.transports.map(t => new Promise(resolve => t.on('finish', resolve)));
        trans.end();
        return Promise.all(transportsFinished);
    };

    logger.error(err);

    waitForLogger(logger).then(async() => {
        console.log('check the Log/exceptions.log file for error details');
        await mongoose.connection.close(true);
        process.exit(0);
    });

});


// Connect to mongoDB and Run the server on PORT
mongoose.connection.once('open', () => {
    app.listen(PORT, () => {
        console.log("Server running on port:", PORT);
    });
});