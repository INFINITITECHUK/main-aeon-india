#!/usr/bin/env bash
ENV=prod docker-compose stop
ENV=prod docker-compose rm -f
ENV=prod docker-compose up -d
