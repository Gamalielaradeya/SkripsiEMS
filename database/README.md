# Database — EMS LSTM Thermal Anomaly

Folder ini berisi migration SQL dan seed data untuk PostgreSQL. TimescaleDB tersedia sebagai opsi.

## Struktur

```
database/
├── migrations/   ← DDL create tables, indexes, hypertable
├── seed/         ← Data awal: gateway, sensor, settings, status_icons
└── views/        ← SQL views opsional
```

## Cara Jalankan

```bash
# Pastikan PostgreSQL sudah jalan (via docker-compose)
docker-compose up -d

# Jalankan migration manual (atau otomatis saat backend start)
psql -h localhost -U ems_user -d ems_db -f database/migrations/001_create_tables.sql
psql -h localhost -U ems_user -d ems_db -f database/migrations/002_create_indexes.sql
psql -h localhost -U ems_user -d ems_db -f database/migrations/003_timescaledb.sql
psql -h localhost -U ems_user -d ems_db -f database/migrations/004_layout_constraints.sql
psql -h localhost -U ems_user -d ems_db -f database/seed/001_seed_gateway.sql
psql -h localhost -U ems_user -d ems_db -f database/seed/002_seed_sensors.sql
psql -h localhost -U ems_user -d ems_db -f database/seed/003_seed_status_icons.sql
psql -h localhost -U ems_user -d ems_db -f database/seed/004_seed_settings.sql
psql -h localhost -U ems_user -d ems_db -f database/seed/005_seed_model_version.sql
psql -h localhost -U ems_user -d ems_db -f database/seed/006_seed_api_tokens.sql
psql -h localhost -U ems_user -d ems_db -f database/seed/007_seed_layout.sql
```

Compose default memakai `postgres:16-alpine`, sehingga `003_timescaledb.sql` hanya dijalankan bila server mendukung extension TimescaleDB.
