const express = require('express');
const upload = require("../middleware/upload.middleware")
const {createUploadImage} = require('../controller/image.controller');
const router = express.Router();

router.post('/image',upload.array("image_url",5),createUploadImage);

module.exports=router