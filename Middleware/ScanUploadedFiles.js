const fs = require('fs').promises;
const path = require('path');
const { isScan } = require('../utils/logic');
const clamscanConfig = {
    removeInfected: true, // If true, removes infected files
    quarantineInfected: false, // False: Don't quarantine, Path: Moves files to this place.
    scanLog: null, // Path to a writeable log file to write scan results into
    debugMode: true, // Whether or not to log info/debug/error msgs to the console
    fileList: null, // path to file containing list of files to scan (for scanFiles method)
    scanRecursively: true, // If true, deep scan folders recursively
    clamdscan: {
      path: 'C:/ClamAV/clamd.exe', // Path to clamscan binary on your server
      db: null, // Path to a custom virus definition database
      scanArchives: true, // If true, scan archives (ex. zip, rar, tar, dmg, iso, etc...)
      active: true, // If true, this module will consider using the clamscan binary
      configFile: 'C:/ClamAV/clamd.conf',
      socket: 'C:/ClamAV/clamd.conf', // This is pretty typical
      host: '127.0.0.1', // If you want to connect locally but not through socket
      port: 3310, // Because, why not
      timeout: 300000, // 5 minutes
      localFallback: false, // Do no fail over to binary-method of scanning
      multiscan: false, // You hate speed and multi-threaded awesome-sauce
      reloadDb: false, // You want your scans to run slow like with clamscan
      bypassTest: false, // Don't check to see if socket is available. You should probably never set this to true.
      tls: true, // Connect to clamd over TLS
    },
    preference: 'clamdscan' // If clamdscan is found and active, it will be used by default
};
const NodeClam = isScan ? require('clamscan') : null;

const scanFiles = async(req, res, next) => {
    
    try {

        /* 
            scan files for viruses & compress the files to smaller sizes,
            using these libraries and softwares: clamdscan, ffmpeg.
        */

        const clamscan = isScan ? await new NodeClam().init(clamscanConfig) : null;

        console.log('scanning files: ', req.files);

        let filesList = [];
        if(isScan)
            for (let i = 0; i < req.files?.length; i++) {
                filesList.push(path.join(__dirname, '..', 'uploads', req.files[i].filename));
            };

        if(filesList.length <= 0 && isScan) return res.status(400).json({ message: 'not exist error' });

        const { goodFiles, badFiles, errors, viruses } = isScan 
            ? await clamscan.scanFiles(filesList) 
            : { goodFiles: null, badFiles: [], errors: null, viruses: null };

        if(viruses) {}

        if(errors) {
            console.log(errors);
            for (let i = 0; i < req.files.length; i++) {
                try {
                    await fs.unlink(path.join(__dirname, '..', 'uploads', req.files[i]?.filename));
                } catch (err) {}
            }
            return res.status(500).json({ message: 'server error' });
        } else if(badFiles && badFiles.length > 0){
            for (let i = 0; i < req.files; i++) {
                await fs.unlink(path.join(__dirname, '..', 'uploads', badFiles[i]));
            };
        }

        let totalSize = 0;

        if(isScan && req?.files)
            for (let i = 0; i < req.files?.length; i++) {
                if(badFiles.includes(req.files[i]?.filename)){
                    req.files[i] = null;
                } else {
                    totalSize += req.files[i]?.size;
                }
            };

        req.uploadedFilesTotalSize = totalSize;

        next();

    } catch (err) {
        console.log(err);
        for (let i = 0; i < req.files.length; i++) {
            try {
                await fs.unlink(path.join(__dirname, '..', 'uploads', req.files[i].filename));
            } catch (err) {}
        }
        return res.status(500).json({ message: 'server error' });
    }

};

module.exports = scanFiles;