FROM paparent/nodejs:0.10.28

ADD bin /app/bin
ADD lib /app/lib
ADD node_modules /app/node_modules

WORKDIR /app

ENTRYPOINT ["bin/dockstash"]
CMD [""]
