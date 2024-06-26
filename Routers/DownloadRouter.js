const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/:filename', async(req, res) => {

    if(!req || !req.params) return res.status(400).json({ message: 'request error' });

    const { filename } = req.params;

    const mimeType = () => {
        if(path.extname(filename) === '.png') return 'image/png';
        if(path.extname(filename) === '.jpg') return 'image/jpeg';
        if(path.extname(filename) === '.avi') return 'video/avi';
        if(path.extname(filename) === '.mp4') return 'video/mp4';
        return '-1';
    };

    if(mimeType() === '-1') return res.status(400).json({ message: 'request error' });

    try {

        console.log('reached download');

        // res.download(
        //     path.join(__dirname, '..', 'uploads', filename), 
        //     filename, // Remember to include file extension
        //     (err) => {
        //         if (err) {
        //             res.status(200).send('');
        //         }
        // });

        var img = fs.readFileSync(path.join(__dirname, '..', 'uploads', filename));
        res.writeHead(200, {'Content-Type': mimeType() });
        res.end(img, 'binary');    

    } catch (err) {
        console.log(err.message);
        return res.status(404).json({ message: 'not exist error' });
    }

});

module.exports = router;