const { chromium, devices } = require("playwright-chromium");

class Signer {
  userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36"

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

    if (process.env.PROXY) {
      console.log("Using proxy: ", process.env.PROXY)
      this.options.proxy = {
          server: process.env.PROXY,
          username: process.env.PROXY_USER,
          password: process.env.PROXY_PASS
      }
    }
  }

  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch(this.options);
    }

    this.context = await this.browser.newContext({
      userAgent: this.userAgent,
    });

    this.page = await this.context.newPage();
    await this.page.goto("https://www.tiktok.com/@rihanna?lang=en", {
      waitUntil: "load",
    });

    await this.page.evaluate(() => {
      // Tik Tok client-side signature function will fail without this line.
      delete navigator.__proto__.webdriver;

      if (!window) {
        throw "No window found"
      }

      if (!window.byted_acrawler) {
        throw "No window.byted_acrawler found!";
      }

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
    }).catch(e => {
      console.log(e);
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

module.exports = Signer;
