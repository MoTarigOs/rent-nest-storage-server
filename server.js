const express = require('express');
const app = express();
require('dotenv').config();
var cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./Config/dbConnection.js');
const PORT = process.env.PORT || 5500;
const cookieParser = require('cookie-parser');

connectDB();
app.use(cors({ origin: 'https://rent-nest-site.vercel.app', credentials: true, allowedHeaders: ['Content-Type', 'Authorization', 'authorization'] }));
app.use(express.urlencoded({ extended: false })); 
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());


app.use("/upload", require("./Routers/UploadRouter.js"));
app.use("/download", require("./Routers/DownloadRouter.js"));


//handle errors & exceptions, with logger
process.on("uncaughtException", (err) => {

    console.log('uncaughtexception error: ', err);

    // const errMsg = err.stack.toString().replaceAll(/[\n\r]/g, '');

    // logger.error(errMsg, () => {
    //     mongoose.disconnect();
    //     process.exit(0);
    // });

});


// Connect to mongoDB and Run the server on PORT
mongoose.connection.once('open', () => {
    app.listen(PORT, () => {
        console.log("Server running on port:", PORT);
    });
});