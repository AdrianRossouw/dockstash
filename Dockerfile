FROM node

RUN npm install -g dockstash

ENTRYPOINT ["dockstash"]
