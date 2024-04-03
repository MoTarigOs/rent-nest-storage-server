const fs = require('fs').promises;
const path = require('path');

const {
    getFolderSize,
    getFolderSizeBin,
    getFolderSizeWasm,
  } = require("go-get-folder-size");
const { getValidFilename } = require('./utils/logic');
  
  const base = "./uploads"; // The directory path you want to get
  
//   await getFolderSizeBin(base); // Binary go, fastest
  
//   await getFolderSize(base); // native node
  
//   await getFolderSizeWasm(base); // Wasm go，slowest

const method = async() => {
      
    // const start = Date.now();
    
    // const file = await fs.stat('./uploads/1710770167105-about-section-background.png'); // Binary go, fastest
  
    // const end = Date.now();

    // console.log('files: ', file.size, ' duration: ', end - start, 'ms');

    try{

    const filenamesArray = [
      '1710887679050-kisspng-humidifier-rural-house-of-forest-lawn-background-material-5aa0a5ebd4cc61.0081692615204776758716.png'
    ];

    const property = {
      _id: '65fa16d82b29fc92738a24a8',
      owner_id: '65f1a49bfef9b29cf5b90e64',
      images: [
        '1710887679050-kisspng-humidifier-rural-house-of-forest-lawn-background-material-5aa0a5ebd4cc61.0081692615204776758716.png',
        '1711366260790-kisspng-humidifier-rural-house-of-forest-lawn-background-material-5aa0a5ebd4cc61.0081692615204776758716.png'
      ],
      videos: []
    };

    console.log(path.extname(filenamesArray[0]));

    let deletedSize = 0;
    const imagesToPull = [];
    const videosToPull = [];
    for (let k = 0; k < filenamesArray.length; k++) {
        if(path.extname(filenamesArray[k]) === '.png' || path.extname(filenamesArray[k]) === '.jpg'){
            for (let i = 0; i < property.images.length; i++) {
                if(property.images[i] === filenamesArray[k]){
                    deletedSize += (await fs.stat(path.join(__dirname, '..', 'uploads', property.images[i]))).size
                    try{
                      await fs.unlink(path.join(__dirname, '..', 'uploads', property.images[i].filename));
                    } catch(err) {
                      console.log('catched inside');
                    }
                      imagesToPull.push(property.images[i]);
                }
            };
        } else if(path.extname(filenamesArray[k]) === '.mp4' || path.extname(filenamesArray[k]) === '.avi'){
            for (let i = 0; i < property.videos.length; i++) {
                if(property.videos[i] === filenamesArray[k]){
                    deletedSize += (await fs.stat(path.join(__dirname, '..', 'uploads', property.videos[i]))).size
                    await fs.unlink(path.join(__dirname, '..', 'uploads', property.videos[i]));
                    videosToPull.push(property.videos[i]);
                }
            };
        }
    }

    console.log(imagesToPull, videosToPull);
    
  } catch(err) {
    console.log('error');
  }
}

console.log(getValidFilename('1711398320137-tall_buil/ding.png'));