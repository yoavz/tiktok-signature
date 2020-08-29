#tiktok-signature
FROM ubuntu:bionic AS tiktok_signature.build

WORKDIR /usr

RUN apt-get update && apt-get install -y curl \
    libnss3 \
    libx11-xcb-dev \
    libglib2.0-0 \
    libxss1 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libxcb-dri3-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libatspi2.0-0 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libasound2

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g pm2

ADD package.json package.json
ADD package-lock.json package-lock.json
RUN npm i
ADD . .

EXPOSE 8081
CMD [ "pm2-runtime", "listen.js" ]
