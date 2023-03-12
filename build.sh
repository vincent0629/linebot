#!/bin/bash
read -sp 'Line access token: ' line
echo
read -sp 'ChatSonic api key: ' chatsonic
docker build --build-arg line=$line --build-arg chatsonic=$chatsonic --no-cache -t linebot .
