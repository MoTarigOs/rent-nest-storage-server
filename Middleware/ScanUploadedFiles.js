const fs = require('fs').promises;
const path = require('path');
// const NodeClam = require('clamscan');
// const ClamScan = new NodeClam().init({
//     removeInfected: false, // If true, removes infected files
//     quarantineInfected: false, // False: Don't quarantine, Path: Moves files to this place.
//     scanLog: null, // Path to a writeable log file to write scan results into
//     debugMode: false, // Whether or not to log info/debug/error msgs to the console
//     fileList: null, // path to file containing list of files to scan (for scanFiles method)
//     scanRecursively: true, // If true, deep scan folders recursively
//     clamscan: {
//         path: '/usr/bin/clamscan', // Path to clamscan binary on your server
//         db: null, // Path to a custom virus definition database
//         scanArchives: true, // If true, scan archives (ex. zip, rar, tar, dmg, iso, etc...)
//         active: true // If true, this module will consider using the clamscan binary
//     },
//     clamdscan: {
//         socket: false, // Socket file for connecting via TCP
//         host: false, // IP of host to connect to TCP interface
//         port: false, // Port of host to use when connecting via TCP interface
//         timeout: 60000, // Timeout for scanning files
//         localFallback: true, // Use local preferred binary to scan if socket/tcp fails
//         path: '/usr/bin/clamdscan', // Path to the clamdscan binary on your server
//         configFile: null, // Specify config file if it's in an unusual place
//         multiscan: true, // Scan using all available cores! Yay!
//         reloadDb: false, // If true, will re-load the DB on every call (slow)
//         active: true, // If true, this module will consider using the clamdscan binary
//         bypassTest: false, // Check to see if socket is available when applicable
//         tls: false, // Use plaintext TCP to connect to clamd
//     },
//     preference: 'clamdscan' // If clamdscan is found and active, it will be used by default
// });

const scanFiles = async(req, res, next) => {
    
    try {

        /* 
            scan files for viruses & compress the files to smaller sizes,
            using these libraries and softwares: clamdscan, ffmpeg.
        */

        console.log('scanning files: ', req.files);

        let filesList = [];
        for (let i = 0; i < req.files.length; i++) {
            filesList.push(path.join(__dirname, '..', 'uploads', req.files[i].filename));
        };

        if(filesList.length <= 0) return res.status(501).json({ message: 'not exist error' });

        // const { goodFiles, badFiles, errors, viruses } = await ClamScan.scanFiles(filesList);
        const badFiles = [];
        const errors = null;

        if(errors) {
            console.log(err.message);
            return res.status(501).json({ message: 'unknown error' });
        }

        if(badFiles && badFiles.length > 0){
            for (let i = 0; i < badFiles.length; i++) {
                await fs.unlink(path.join(__dirname, '..', 'uploads', badFiles[i]));
            };
        }

        let totalSize = 0;

        for (let i = 0; i < req.files.length; i++) {
            if(badFiles.includes(req.files[i].filename)){
                req.files[i] = null;
            } else {
                totalSize += req.files[i].size;
            }
        };

        req.uploadedFilesTotalSize = totalSize;

        next();

    } catch (err) {
        console.log(err);
        for (let i = 0; i < req.files.length; i++) {
            await fs.unlink(path.join(__dirname, '..', 'uploads', req.files[i].filename))
        }
        return res.status(501).json({ message: 'server error' });
    }

};

module.exports = scanFiles;