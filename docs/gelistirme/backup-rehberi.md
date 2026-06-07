# Esnaaf Veritabanı Yedekleme Rehberi

## Cloud SQL Otomatik Yedekleme

### Aktifleştirme Komutu
```bash
gcloud sql instances patch esnaaf-db \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --retained-backups-count=7 \
  --retained-transaction-log-days=7 \
  --project=esnaaf-prod-orek
```

### Manuel Yedek Alma
```bash
gcloud sql backups create --instance=esnaaf-db --project=esnaaf-prod-orek
```

### Yedeklerden Geri Yükleme
```bash
gcloud sql backups list --instance=esnaaf-db --project=esnaaf-prod-orek
gcloud sql backups restore BACKUP_ID --restore-instance=esnaaf-db --project=esnaaf-prod-orek
```

## Memorystore Redis Persistence

### RDB Snapshot Aktifleştirme
```bash
gcloud redis instances update esnaaf-redis \
  --persistence-mode=RDB \
  --rdb-snapshot-period=12h \
  --region=europe-west3 \
  --project=esnaaf-prod-orek
```

## Önerilen Backup Stratejisi

| Bileşen | Yöntem | Sıklık | Saklama |
|---------|--------|--------|---------|
| PostgreSQL | Cloud SQL Auto Backup | Günlük 03:00 UTC | 7 gün |
| Redis | RDB Snapshot | 12 saatte bir | 3 snapshot |
| Kod | GitHub Repository | Her push | Sınırsız |
| Env Secrets | AWS SSM / GCP Secret Manager | Versiyon kontrollü | Sınırsız |
