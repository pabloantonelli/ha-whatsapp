ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install required packages
RUN apk add --no-cache git npm nodejs

# Copy application files
COPY package.json /
COPY index.js /
COPY whatsapp.js /
COPY run.sh /
COPY finish.sh /

# Copy custom component for Home Assistant integration
COPY custom_component /custom_component

# Set permissions
RUN chmod a+x /run.sh
RUN chmod a+x /finish.sh

# Install dependencies
WORKDIR /
RUN npm install --production

EXPOSE 3000
CMD [ "/run.sh" ]