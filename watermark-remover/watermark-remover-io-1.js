// Here  it saves the dewatermarked/cleaned image with the same name as the original image and it also deletes the original download images folder.

// module imports
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const imagesUrl = ['https://learn.zoner.com/wp-content/uploads/2019/02/infographic_how_to_watermark_a_photo.png', 'https://www.smugmughelp.com/hc/article_attachments/18212659045780'];

const downloadFolder = 'C:/Users/This PC/Downloads/downloaded_images';
const outputFolder = 'C:/Users/This PC/Downloads/dewatermarked_images';

fs.mkdirSync(downloadFolder, { recursive: true });
fs.mkdirSync(outputFolder, { recursive: true });

puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: 'YOUR_2CAPTCHA_API_KEY',
    },
    visualFeedback: true,
  })
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const downloadOriginalImage = async (imageUrl) => {
  const imageName = `${path.basename(imageUrl.split('?')[0]).replace(/[^\w.-]/g, '_')}`;
  const destPath = path.join(downloadFolder, imageName);

  try {
    const res = await fetch(imageUrl);
    const buffer = await res.buffer();
    fs.writeFileSync(destPath, buffer);
    return destPath;
  } catch (err) {
    console.error('Error downloading original image:', err);
    return null;
  }
};

const downloadCleanedImage = async (imageUrl, originalImageName) => {
  const outputPath = path.join(outputFolder, originalImageName);

  try {
    const res = await fetch(imageUrl);
    const buffer = await res.buffer();
    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Downloaded cleaned image as: ${outputPath}`);
  } catch (err) {
    console.error('Error downloading cleaned image:', err);
  }
};

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  for (let i = 0; i < imagesUrl.length; i++) {
    console.log(`🔄 Processing image ${i + 1}/${imagesUrl.length}`);
    const imageUrl = imagesUrl[i];
    const originalImageName = `${path.basename(imageUrl.split('?')[0]).replace(/[^\w.-]/g, '_')}`;

    try {
      const imagePath = await downloadOriginalImage(imageUrl);
      if (!imagePath) continue;

      await page.goto('https://www.watermarkremover.io/upload', {
        waitUntil: 'load',
      });

      await page.waitForSelector('input[type=file]');
      const fileInput = await page.$('input[type=file]');
      await fileInput.uploadFile(imagePath);

      const hasCaptcha = await page.$('.g-recaptcha');
      if (hasCaptcha) {
        console.log('⚙️ Solving CAPTCHA...');
        await sleep(1000);
        await page.solveRecaptchas();
      }

      console.log('⏳ Waiting for processing...');
      await page.waitForSelector('.ImageMagnifier__Tab-sc-kcdk33-3.kLxbAH', {
        timeout: 60000,
      });

      console.log('⏳ Waiting for "Watermark Removed" section...');
      const cleanedImageUrl = await page.evaluate(() => {
        const sections = Array.from(document.querySelectorAll('.ImageMagnifier__OutputSection-sc-kcdk33-0'));
        for (const section of sections) {
          const label = section.querySelector('.ImageMagnifier__Tab-sc-kcdk33-3')?.textContent;
          if (label?.toLowerCase().includes('watermark removed')) {
            const divs = section.querySelectorAll('.ImageMagnifier__CommonDiv-sc-kcdk33-4');
            for (const div of divs) {
              const bg = div.style.backgroundImage;
              const match = bg.match(/url\("([^"]+)"\)/);
              if (match) return match[1];
            }
          }
        }
        return null;
      });

      if (!cleanedImageUrl) {
        console.log('❌ Could not find cleaned image URL.');
        continue;
      }

      console.log(`✅ Cleaned image URL found: ${cleanedImageUrl}`);
      await downloadCleanedImage(cleanedImageUrl, originalImageName);

      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      await sleep(1000);
    } catch (err) {
      console.error(`❌ Error processing image ${i + 1}:`, err.message);
      continue;
    }
  }

  console.log('🧹 Cleaning up download folder...');
  try {
    fs.rmSync(downloadFolder, { recursive: true, force: true });
    console.log(`🗑️ Deleted folder: ${downloadFolder}`);
  } catch (err) {
    console.warn(`⚠️ Failed to delete folder: ${err.message}`);
  }

  console.log('🎉 All done!');
  await browser.close();
})();
