FROM mongo:5.0.2

WORKDIR /home/init

COPY ["./order-db-rs.js", "./run.sh", "./"]

RUN chmod +x ./run.sh

ENTRYPOINT ["./run.sh"]