# EcoWitt → Windy Proxy

A lightweight Node.js service that:

1. **Receives** EcoWitt weather station data via `POST /receiveEcowittData`
2. **Stores** the latest payload verbatim to `data/ecowitt_latest.json`
3. **Uploads** to [Windy Stations v2 API](https://stations.windy.com) every **60 seconds** via a scheduled job

---

## Quick Start

### With Docker Compose (recommended)

```bash
# 1. Copy the env template and add your Windy station password
cp .env.example .env
#    → edit WINDY_STATION_PASSWORD in .env

# 2. Build and start
docker compose up -d

# 3. Verify it's running
curl http://localhost:8888/health
```

### Without Docker (local dev)

```bash
npm install
cp .env.example .env   # edit WINDY_STATION_PASSWORD
set -a && source .env && set +a
npm start
```

---

## Configuration

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP listen port | `8888` |
| `WINDY_STATION_ID` | Station hex ID from [stations.windy.com](https://stations.windy.com/stations) | *(required)* |
| `WINDY_STATION_PASSWORD` | Station password from [stations.windy.com](https://stations.windy.com/stations) | *(required)* |
| `DATA_DIR` | Directory for the data file | `/app/data` (Docker) or `data/` (local) |

---

## EcoWitt Station Setup

In the **WS View / WS View Plus** app:

1. **Device List → [your device] → Weather Services → Customized**
2. Protocol: `Ecowitt`
3. Server IP / hostname: your host running this service
4. Path: `/receiveEcowittData`
5. Port: `8888`
6. Upload interval: 60 s (or whatever you prefer – the proxy caches the latest value)

---

## Unit Conversion Table

| EcoWitt field | Unit | Windy field | Unit |
|---|---|---|---|
| `tempf` | °F | `temp` | °C |
| `humidity` | % | `humidity` | % |
| `windspeedmph` | mph | `wind` | m/s |
| `windgustmph` | mph | `gust` | m/s |
| `winddir` | ° | `winddir` | ° |
| `baromrelin` | inHg | `mbar` | hPa |
| `hourlyrainin` | in | `precip` | mm |
| `solarradiation` | W/m² | `radiation` | W/m² |
| `uv` | index | `uvi` | index |
| `dewptf` | °F | `dewpoint` | °C |

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/receiveEcowittData` | Receives & stores EcoWitt payload |
| `GET` | `/health` | Health check – returns `{"status":"ok"}` |

---

## Project Structure

```
data_proxy/
├── src/
│   ├── server.js                  # Express app + cron scheduler
│   ├── routes/
│   │   └── ecowitt.js             # POST /receiveEcowittData handler
│   ├── converters/
│   │   └── ecowitt2windy.js       # Unit conversion logic
│   ├── jobs/
│   │   └── windyUploader.js       # 60-second scheduled upload job
│   └── utils/
│       └── logger.js              # Simple structured logger
├── data/                          # Runtime data directory (gitignored)
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── package.json
```
