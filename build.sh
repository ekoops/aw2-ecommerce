#!/bin/bash

CUR_DIR=$PWD
SERVICE=$1


# if service is present...
if [ -n "$SERVICE" ]; then
  cd "$PWD/$SERVICE" || exit 1
  if [ -f gradlew ]; then
    # it is a gradle project
    ./gradlew bootJar
  else
    # it is a node project
    npm run build
  fi
else
  cd "$CUR_DIR/catalog-service" && ./gradlew bootJar || exit 2
  cd "$CUR_DIR/discovery-service" && ./gradlew bootJar || exit 3
  cd "$CUR_DIR/mail-service" && npm run build || exit 4
  cd "$CUR_DIR/order-service" && npm run build || exit 5
  # cd "$CUR_DIR/order-service-cleaner" && npm run build || exit 6
  cd "$CUR_DIR/wallet-service" && ./gradlew bootJar || exit 7
  cd "$CUR_DIR/warehouse-service" && npm run build || exit 8
fi

