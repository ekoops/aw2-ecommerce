FROM openjdk:11-jre

WORKDIR /home/app/server

COPY *.jar ./app.jar

RUN groupadd app && useradd -g app -s /bin/bash app
USER app

EXPOSE 8761

ENTRYPOINT [ "java", "-jar", "./app.jar" ]