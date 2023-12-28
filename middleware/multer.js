const multer = require('multer');
const path = require('path');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
    'image/avif': 'avif',
    'image/webp': 'webp'
};

const destinationPath = path.join(__dirname, '../images');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, destinationPath);
    },
    filename: function (req, file, cb) {
        const ext = FILE_TYPE_MAP[file.mimetype];
        cb(null, file.originalname.replace(path.extname(file.originalname), '') + '-' + Date.now() + '.' + ext);
    }
});

module.exports = multer({ storage: storage });
