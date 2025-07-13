// module imports
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import UAParser from 'ua-parser-js';

async function getDeviceInfo() {
  const fp = await FingerprintJS.load();

  const result = await fp.get();
  const visitorId = result.visitorId;

  const parser = new UAParser();
  const uaResult = parser.getResult();

  let deviceName = '';

  if (uaResult.device.type === 'mobile' || uaResult.device.type === 'tablet') {
    if (uaResult.device.vendor && uaResult.device.model) {
      deviceName = `${uaResult.device.vendor} ${uaResult.device.model}`;
    } else if (uaResult.device.model) {
      deviceName = uaResult.device.model;
    } else if (uaResult.os.name) {
      deviceName = `${uaResult.os.name} ${uaResult.device.type}`;
    } else {
      deviceName = `${uaResult.device.type}`;
    }
  } else {
    const browserName = uaResult.browser.name || 'Browser';
    const osName = uaResult.os.name || 'Unknown OS';
    deviceName = `${browserName} on ${osName}`;
  }

  const deviceInfo = {
    deviceId: visitorId,
    deviceName,
    browser: {
      name: uaResult.browser.name,
      version: uaResult.browser.version,
      major: uaResult.browser.major,
    },
    os: {
      name: uaResult.os.name,
      version: uaResult.os.version,
    },
    device: {
      model: uaResult.device.model,
      type: uaResult.device.type,
      vendor: uaResult.device.vendor,
    },
    engine: {
      name: uaResult.engine.name,
      version: uaResult.engine.version,
    },
    cpu: {
      architecture: uaResult.cpu.architecture,
    },
  };

  return deviceInfo;
}
