# Deployment

Public endpoints:

- app domain -> nginx -> web
- /api -> nginx -> api
- /ws -> nginx -> api websocket gateway
- turn host -> coturn

Required runtime components:

- postgres
- redis
- coturn
- api
- web
- nginx
