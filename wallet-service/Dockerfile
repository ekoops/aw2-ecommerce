FROM openjdk:11-jre

WORKDIR /home/app/server

COPY *.jar ./app.jar

RUN groupadd app && useradd -g app -s /bin/bash app
USER app

#EXPOSE 4000

ENTRYPOINT [ "java", "-jar", "./app.jar" , "--trace" ]