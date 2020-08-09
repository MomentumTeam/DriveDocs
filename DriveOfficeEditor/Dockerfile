FROM node:10

RUN apt-get update

RUN apt-get install libreoffice -y

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]