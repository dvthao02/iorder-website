# iOrder release runbook (VPS + Docker)

## Kiến trúc release

```text
GitHub main → GitHub Actions CI → GHCR images theo commit SHA
                                      ↓
                         staging → duyệt → production VPS
                                      ↓
                              web / api / PostgreSQL / MinIO
```

- `web`: Nginx phục vụ website và CMS, cache asset Vite có hash.
- `api`: Fastify API, không bind public port.
- `postgres`: nội dung CMS, users và dữ liệu nghiệp vụ.
- `minio`: ảnh/tài liệu CMS. Dữ liệu không nằm trong Docker image.

## Release gate

Pull request vào `main` phải qua workflow `.github/workflows/ci.yml`:

```text
format → lint → typecheck → migration CI → bootstrap CI → test → build → compose config
```

Sau khi merge `main`, CI publish ba image bất biến:

```text
ghcr.io/dvthao02/iorder-api:sha-<full-commit>
ghcr.io/dvthao02/iorder-web:sha-<full-commit>
ghcr.io/dvthao02/iorder-minio:sha-<full-commit>
```

Không dùng tag `latest` để release hoặc rollback; chỉ dùng tag `sha-...`.

## Chuẩn bị một môi trường mới

1. Dùng `.env` riêng, `VOLUME_PREFIX` riêng, secret riêng và storage riêng.
2. Khởi động PostgreSQL/MinIO.
3. Chạy migration schema.
4. Chỉ database mới: chạy `bootstrap` đúng một lần.
5. Khởi động `api` và `web`.

```bash
cd ~/apps/iorder-website/deploy
docker compose up -d postgres minio
docker compose run --rm migrate
docker compose --profile bootstrap run --rm --no-deps bootstrap
docker compose up -d
```

`bootstrap` không được đưa vào deploy thường vì nó seed dữ liệu lõi và tạo tài
khoản CMS. Migration chỉ thay đổi schema database.

## Deploy staging

Staging phải có VPS/VM hoặc Compose project riêng. Dùng
`deploy/.env.staging.example` làm mẫu; không dùng volume, domain hay `.env`
production.

1. Đặt `API_IMAGE`, `WEB_IMAGE` và `MINIO_IMAGE` cùng commit SHA đã qua CI.
2. Pull image.
3. Chạy migration nếu release có migration.
4. Khởi động/recreate service.
5. Kiểm tra homepage, `/admin`, upload media và `/api/public/health`.

```bash
docker compose pull
docker compose up -d --no-build
docker compose ps
```

## Deploy production

### Frontend hoặc CMS tĩnh

Chỉ thay `WEB_IMAGE` sang tag release rồi:

```bash
docker compose pull web
docker compose up -d --no-build web
```

### API không có migration

```bash
docker compose pull api
docker compose up -d --no-build api
```

### API có migration

Backup database trước, sau đó deploy API tag mới:

```bash
./scripts/backup-postgres.sh
docker compose pull api
docker compose up -d --no-build --force-recreate migrate api
```

Sau mọi release:

```bash
docker compose ps
docker compose logs --tail 100 web
docker compose logs --tail 100 api
curl -I http://127.0.0.1:4000/
curl -i http://127.0.0.1:4000/api/public/health
```

## Rollback

- **Web**: đổi `WEB_IMAGE` về tag SHA release trước, pull và recreate `web`.
- **API**: đổi `API_IMAGE` về tag SHA release trước, pull và recreate `api`.
- **Database**: migration là forward-only. Ưu tiên migration sửa tiếp theo;
  chỉ restore backup khi dữ liệu bị hỏng hoặc migration mang tính phá huỷ.

Không dùng `git reset`, build source trực tiếp hoặc `docker compose down -v`
như một cách rollback production.

## Backup, bảo mật và quan sát

- Backup PostgreSQL hằng ngày bằng systemd timer trong `deploy/systemd/`.
- Mirror MinIO sang object storage/ổ ngoài; backup trên chính VPS là chưa đủ.
- Giữ `.env` ngoài Git, `chmod 600`, không gửi token/password qua chat.
- Dùng Sentry cho lỗi ứng dụng và uptime monitor bên ngoài cho `/` cùng
  `/api/public/health`.
- Định kỳ thử restore backup vào môi trường không phải production.
