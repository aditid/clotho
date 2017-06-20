#!/bin/bash
export NODE_ENV=production
export MONGODB_URI=mongodb://mongo:27017/clotho

while ! nc -z mongo 27017; do sleep 3; echo "waiting for mongo to start"; done
npm start