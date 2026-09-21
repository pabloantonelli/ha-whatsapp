ARG BUILD_FROM
FROM ${BUILD_FROM}

# Baileys 7 is ESM-only and requires Node 20 or newer.
RUN apk add --no-cache nodejs npm \
    && node -e "if (+process.versions.node.split('.')[0] < 20) { console.error('Node 20+ required, got ' + process.version); process.exit(1) }"

WORKDIR /app

# Dependencies first, so the layer is cached while only sources change.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src/ ./src/
COPY custom_component/ /custom_component/
COPY run.sh finish.sh /
RUN chmod a+x /run.sh /finish.sh

EXPOSE 3000
CMD [ "/run.sh" ]
