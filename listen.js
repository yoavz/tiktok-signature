const Signer = require("./index");
const http = require("http");

(async function main() {
  try {
    const server = http
      .createServer()
      .listen(8081)
      .on("listening", function () {
        console.log("TikTok Signature server started");
      });

    const signer = new Signer();
    signer.init();
    console.log("Signer() loaded")

    server.on("request", (request, response) => {
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Headers', '*');

      if (request.method === 'OPTIONS' ) {
          response.writeHead(200);
          response.end();
          return;
      }

      if (request.method === "POST" && request.url === "/signature") {
        var url = "";
        request.on("data", function (chunk) {
          url += chunk;
        });

        request.on("end", async function () {
          console.log("Received url: " + url);

          try {
            const verifyFp = await signer.getVerifyFp();
            const token = await signer.sign(url);
            const cookies = await signer.getCookies();
            let output = JSON.stringify({
              signature: token,
              verifyFp: verifyFp,
              cookies: cookies
            });
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(output);
            console.log("Sent result: " + output);
          } catch (err) {
            console.log(err);
          }
        });
      } else {
        response.statusCode = 404;
        response.end();
      }
    });

    await signer.close();
  } catch (err) {
    console.error(err);
  }
})();
