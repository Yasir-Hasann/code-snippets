// Here is just one problem, it saves the dewatermarked/cleaned image with the generic name results.png returned by the remover API.

// module imports
const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const download = require('image-downloader');
const path = require('path');

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

  const options = {
    url: imageUrl,
    dest: path.join(downloadFolder, imageName),
  };

  try {
    const { filename } = await download.image(options);
    return filename;
  } catch (err) {
    console.error('Error downloading original image:', err);
    return null;
  }
};

const downloadCleanedImage = async (imageUrl) => {
  const imageName = `${path.basename(imageUrl.split('?')[0]).replace(/[^\w.-]/g, '_')}`;
  const options = {
    url: imageUrl,
    dest: path.join(outputFolder, imageName),
  };

  try {
    const { filename } = await download.image(options);
    console.log(`✅ Downloaded cleaned image: ${filename}`);
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

    try {
      const imagePath = await downloadOriginalImage(imagesUrl[i]);
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
      // Option 1 - Not working
      // await page.waitForSelector('a[href*="download"]', { timeout: 1000000 });
      // const downloadLink = await page.$eval('a[href*="download"]', (el) => el.href);
      // await downloadCleanedImage(downloadLink);

      // Option 2 -  Download via button
      // await page.waitForSelector('button[data-test-id="download-btn"]', { timeout: 60000 });
      // await page.click('button[data-test-id="download-btn"]');

      // Option 3 - Download via image src
      // await page.waitForSelector('img[data-testid="pixelbin-image"]', { timeout: 60000 });
      // const base64Image = await page.evaluate(async () => {
      //   const img = document.querySelector('img[data-testid="pixelbin-image"]');
      //   const blobUrl = img.src;

      //   const blob = await fetch(blobUrl).then((res) => res.blob());
      //   return new Promise((resolve) => {
      //     const reader = new FileReader();
      //     reader.onloadend = () => resolve(reader.result.split(',')[1]);
      //     reader.readAsDataURL(blob);
      //   });
      // });

      // const buffer = Buffer.from(base64Image, 'base64');
      // const imageName = path.basename(imagePath);
      // const outputPath = path.join(outputFolder, imageName);
      // fs.writeFileSync(outputPath, buffer);
      // console.log(`✅ Saved cleaned image: ${imageName}`);

      console.log('⏳ Waiting for "Watermark Removed" section...');
      await page.waitForFunction(
        () => {
          return Array.from(document.querySelectorAll('.ImageMagnifier__Tab-sc-kcdk33-3')).some((el) => el.textContent.includes('Watermark Removed'));
        },
        { timeout: 60000 }
      );

      const cleanedImageUrl = await page.evaluate(() => {
        const sections = document.querySelectorAll('.ImageMagnifier__OutputSection-sc-kcdk33-0');
        for (const section of sections) {
          const label = section.querySelector('.ImageMagnifier__Tab-sc-kcdk33-3');
          if (label && label.textContent.includes('Watermark Removed')) {
            const bgDiv = section.querySelector('div[style*="background-image"]');
            if (bgDiv) {
              const bgImage = bgDiv.style.backgroundImage;
              const match = bgImage.match(/url\("([^"]+)"\)/);
              return match ? match[1] : null;
            }
          }
        }
        return null;
      });

      if (!cleanedImageUrl) {
        console.error('❌ Could not find cleaned image URL.');
      } else {
        console.log(`✅ Cleaned image URL found: ${cleanedImageUrl}`);
        await downloadCleanedImage(cleanedImageUrl);
      }

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

  console.log('🎉 All done!');
  await browser.close();
})();
