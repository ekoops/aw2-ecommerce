#!/bin/bash

d=./docker-compose

docker-compose \
 -f $d/catalog-svc.yaml \
 -f $d/discovery-svc.yaml \
 -f $d/kafka.yaml \
 -f $d/mail-svc.yaml \
 -f $d/networks.yaml \
 -f $d/order-svc.yaml \
 -f $d/volumes.yaml \
 -f $d/wallet-svc.yaml \
 -f $d/warehouse-svc.yaml \
 down && \


docker-compose \
 -f $d/discovery-svc.yaml \
 -f $d/kafka.yaml \
 -f $d/catalog-svc.yaml \
 -f $d/warehouse-svc.yaml \
 -f $d/mail-svc.yaml \
 -f $d/networks.yaml \
 -f $d/order-svc.yaml \
 -f $d/volumes.yaml \
 -f $d/wallet-svc.yaml \
 up --build "$@"

