FROM mongo:5.0.2

WORKDIR /home/init

COPY ["./warehouse-db-rs.js", "./run.sh", "./"]

RUN chmod +x ./run.sh

ENTRYPOINT ["./run.sh"]