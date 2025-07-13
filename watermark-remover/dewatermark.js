// module imports
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const imageUrls = ['https://learn.zoner.com/wp-content/uploads/2019/02/infographic_how_to_watermark_a_photo.png', 'https://www.smugmughelp.com/hc/article_attachments/18212659045780'];

const downloadFolder = 'C:/Users/This PC/Downloads/downloaded_images';
const outputFolder = 'C:/Users/This PC/Downloads/dewatermarked_images';
const bearerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJpZ25vcmUiLCJwbGF0Zm9ybSI6I';

fs.mkdirSync(downloadFolder, { recursive: true });
fs.mkdirSync(outputFolder, { recursive: true });

const downloadImage = async (url, index) => {
  try {
    const fileName = `${Date.now()}_${path.basename(url.split('?')[0]).replace(/[^\w.-]/g, '_')}`;

    const filePath = path.join(downloadFolder, fileName);
    const response = await axios.get(url, { responseType: 'stream' });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    return filePath;
  } catch (err) {
    console.error(`Download failed: ${url} - ${err.message}`);
    return null;
  }
};

const removeWatermark = async (filePath, index, originalFileName) => {
  try {
    const form = new FormData();
    form.append('zoom_factor', '2');
    form.append('original_preview_image', fs.createReadStream(filePath));

    const response = await axios.post('https://api.dewatermark.ai/api/object_removal/v5/erase_watermark', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${bearerToken}`,
      },
      maxBodyLength: Infinity,
    });

    const base64Image = response.data?.edited_image?.image;

    if (base64Image) {
      const outputFilePath = path.join(outputFolder, originalFileName);
      fs.writeFileSync(outputFilePath, Buffer.from(base64Image, 'base64'));
      console.log(`Saved dewatermarked image to: ${outputFilePath}`);
    } else {
      console.warn(`No base64 image data found for: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error during watermark removal: ${filePath} - ${err.message}`);
  }
};

const processImages = async () => {
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const originalFileName = path.basename(url.split('?')[0]).replace(/[^\w.-]/g, '_');
    const filePath = await downloadImage(url, i);

    if (filePath) {
      await removeWatermark(filePath, i, originalFileName);
    }
  }
};

processImages();
