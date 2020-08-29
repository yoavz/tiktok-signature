const { chromium, devices } = require("playwright-chromium");
const iPhone11 = devices["iPhone 11 Pro"];

class Signer {
  userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36"
  args = []

  constructor() {
    this.options = {
      args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process', // <- this one doesn't works in Windows
          '--disable-gpu'
      ],
      ignoreDefaultArgs: ["--mute-audio", "--hide-scrollbars"],
      headless: true,
      ignoreHTTPSErrors: true,
    };
  }

  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch(this.options);
    }

    let emulateTemplate = { ...iPhone11 };
    emulateTemplate.viewport.width = getRandomInt(320, 1920);
    emulateTemplate.viewport.height = getRandomInt(320, 1920);

    this.context = await this.browser.newContext({
      ...emulateTemplate,
      deviceScaleFactor: getRandomInt(1, 3),
      isMobile: Math.random() > 0.5,
      hasTouch: Math.random() > 0.5,
      userAgent: this.userAgent,
    });

    this.page = await this.context.newPage();
    await this.page.goto("https://www.tiktok.com/@rihanna?lang=en", {
      waitUntil: "load",
    });

    await this.page.evaluate(() => {
      if (typeof window.byted_acrawler.sign !== "function") {
        throw "No function found";
      }

      window.generateSignature = function generateSignature(
        url,
        verifyFp = null
      ) {
        let newUrl = url;
        if (verifyFp) {
          newUrl = newUrl + "&verifyFp=" + verifyFp;
        }
        return window.byted_acrawler.sign({ url: newUrl });
      };
    });

    return this;
  }

  async sign(str) {
    let verifyFp = await this.getVerifyFp();
    let res = await this.page.evaluate(
      `generateSignature("${str}", "${verifyFp}")`
    );
    return res;
  }

  async getVerifyFp() {
    var content = await this.context.cookies();
    for (let cookie of content) {
      if (cookie.name == "s_v_web_id") {
        return cookie.value;
      }
    }
    return null;
  }

  async getCookies() {
    return this.page.evaluate('document.cookie;');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    if (this.page) {
      this.page = null;
    }
  }
}

function getRandomInt(a, b) {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  const diff = max - min + 1;
  return min + Math.floor(Math.random() * Math.floor(diff));
}

module.exports = Signer;
