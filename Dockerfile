#FROM node:12.17.0-alpine
FROM node:14 AS development

WORKDIR /opt/oracle/
COPY ./instantclient-basic-linux.x64-21.1.0.0.0.zip .

RUN apt-get update && \
    apt-get install -y libaio1 unzip wget
RUN unzip instantclient-basic-linux.x64-21.1.0.0.0.zip -d /opt/oracle && \
    rm -f instantclient-basic-linux.x64-21.1.0.0.0.zip && \
    cd instantclient* && \
    rm -f *jdbc* *occi* *mysql* *jar uidrvci genezi adrci && \
    echo /opt/oracle/instantclient* > /etc/ld.so.conf.d/oracle-instantclient.conf && \
    ldconfig

#RUN rm instantclient-basic-linux.x64-21.1.0.0.0.zip

WORKDIR /usr/src/app
#RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/*
#COPY ./.certi/ca.crt /usr/local/share/ca-certificates/
#RUN update-ca-certificates
COPY package.json ./
COPY yarn.lock ./
RUN yarn install --production=true
RUN ls -la
