#!/bin/bash

sleep 5 && mongo --host "$DB_HOST" -u "$DB_USER" -p "$DB_PASS" --authenticationDatabase "$DB_AUTH_DB" ./warehouse-db-rs.js
