# Use an old Node base image with known CVEs
FROM node:12

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Run as root (bad practice)
CMD ["node", "app.js"]
