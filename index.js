const { webkit } = require("playwright-webkit");
const { chromium } = require("playwright-chromium");

class Signer {
  // userAgent =
  //   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36"
  userAgent =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36"

  constructor() {
    this.options = {
      ignoreDefaultArgs: ["--mute-audio", "--hide-scrollbars"],
      headless: true,
      userAgent: this.userAgent,
      ignoreHTTPSErrors: true,
    };
  }

  async init() {
    console.log(this.options)

    if (!this.browser) {
      this.browser = await chromium.launch(this.options);
      //this.browser = await webkit.launch(this.options);
    }

    this.context = await this.browser.newContext({
      userAgent: this.userAgent,
    });

    this.page = await this.context.newPage();
    await this.page.goto("https://www.tiktok.com/@rihanna?lang=en", {
      waitUntil: "load",
    });

    await this.page.evaluate(() => {
      delete navigator.__proto__.webdriver

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
    if (this.browser && !this.isExternalBrowser) {
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
