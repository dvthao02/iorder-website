# Hướng dẫn VPS tại nhà cho iOrder

Tài liệu này ghi lại cấu hình đang dùng: một máy Windows riêng chạy Hyper-V, bên trong có Ubuntu Server (iorder-vps) để chạy iOrder bằng Docker.

## 1. Mô hình và khái niệm

```text
Máy Windows riêng
  └─ Hyper-V
      └─ Ubuntu Server VM = VPS tại nhà
          ├─ Docker: web (Nginx), API, PostgreSQL, MinIO
          ├─ Tailscale: quản trị VPS từ xa
          └─ Cloudflare Tunnel: cho người ngoài truy cập web
```

- VPS là máy Ubuntu VM chạy ứng dụng, database và file upload.
- `web` là container Nginx public: phục vụ website, CMS `/admin` và cache asset
  Vite (JS/CSS/ảnh tĩnh) theo tên file hash.
- `api` chỉ xử lý API, xác thực, CMS và nghiệp vụ; không còn trực tiếp phục vụ
  bundle frontend trong Docker production.
- Ảnh/tài liệu upload từ CMS nằm ở MinIO (hoặc media storage đã cấu hình),
  không nằm trong image `web` và không mất khi build lại frontend.
- Domain là tên cố định như example.com; phải đăng ký/mua nếu muốn tên riêng.
- HTTPS do Cloudflare hoặc Tailscale cấp ở lớp public.
- Quick Tunnel là link test ngẫu nhiên dạng *.trycloudflare.com, không phải domain.

## 2. Cấu hình VM khuyến nghị

Với máy Windows có 8 GB RAM và còn khoảng 80 GB trống:

| Hạng mục              | Giá trị                    |
| --------------------- | -------------------------- |
| VM                    | iorder-vps                 |
| Generation            | Generation 2               |
| RAM khởi động         | 4096 MB                    |
| Dynamic Memory tối đa | 6144 MB                    |
| CPU                   | 2 virtual processors       |
| Ổ đĩa                 | VHDX dynamic, tối đa 50 GB |
| Hệ điều hành          | Ubuntu Server 26.04 LTS    |

Trên máy Windows chạy Hyper-V:

1. Tắt chế độ Sleep.
2. Mở Hyper-V Manager → VM iorder-vps → Settings → Automatic Start Action → chọn Always start this virtual machine automatically.
3. Trong BIOS, nếu có, bật Restore on AC Power Loss để máy tự bật sau mất điện.

## 3. Lệnh Ubuntu cơ bản

Đăng nhập Ubuntu bằng user thường (ví dụ dvthao), không dùng SSH root.

```bash
# Cập nhật hệ điều hành
sudo apt update
sudo apt upgrade -y

# Kiểm tra IP LAN của VM
hostname -I

# Kiểm tra SSH đang chạy
sudo systemctl is-active ssh
```

127.0.0.1 luôn có nghĩa là chính máy đang chạy lệnh. Ví dụ http://127.0.0.1:4000 trong VPS là container `web` trên VPS; cùng URL mở trên laptop lại là dịch vụ của laptop, không phải VPS.

## 4. Quản trị VPS từ máy khác bằng Tailscale

Tailscale chỉ là đường quản trị riêng tư, không phải cách public website.

### Trên Ubuntu VPS

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
tailscale ip -4
```

Mở link mà lệnh tailscale up in ra, đăng nhập bằng GitHub/Google. Lệnh cuối trả IP dạng 100.x.x.x.

### Trên máy Windows quản trị

1. Cài ứng dụng Tailscale Windows.
2. Đăng nhập cùng tài khoản Tailscale.
3. Mở PowerShell:

```powershell
ssh dvthao@100.x.x.x
```

Không dùng dấu gạch chéo trước ký tự @.

## 5. Cài Docker trên VPS

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

Đăng xuất SSH rồi SSH lại để quyền Docker có hiệu lực. Kiểm tra:

```bash
docker --version
docker compose version
```

Docker, PostgreSQL, MinIO và quá trình build chỉ chạy trên VPS. Máy Windows quản trị không cần cài Docker hoặc Node.js.

## 6. Đưa source iOrder lên VPS

Máy phát triển chỉ cần push code lên GitHub. Trên VPS:

```bash
sudo apt install -y git
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/dvthao02/iorder-website.git
cd iorder-website
```

Nếu repository đã clone rồi, không clone lần nữa; chỉ dùng git pull origin main khi update.

## 7. Chạy iOrder lần đầu (nội bộ/test)

Vào thư mục deploy và tạo file cấu hình chạy thử từ mẫu:

```bash
cd ~/apps/iorder-website/deploy
cp .env.docker.example .env
# Database và MinIO cần sẵn sàng trước.
docker compose up -d postgres minio

# Migration chỉ cập nhật schema.
docker compose run --rm migrate

# Chỉ database MỚI mới chạy bootstrap để seed dữ liệu lõi và tạo CMS admin.
docker compose --profile bootstrap run --rm --no-deps bootstrap

# Khởi động website/API sau khi dữ liệu ban đầu đã sẵn sàng.
docker compose up -d --build
```

Kiểm tra trạng thái:

```bash
docker compose ps
```

Trạng thái mong đợi:

```text
web       Up (healthy)
api       Up (healthy)
postgres  Up (healthy)
minio     Up (healthy)
```

Service `migrate` chỉ tự tạo/cập nhật schema database. `bootstrap` là lệnh tách
riêng, chỉ chạy một lần cho database mới để seed dữ liệu lõi và tạo CMS admin.
Không chạy `bootstrap` trong deploy thông thường.

> .env.docker.example chứa mật khẩu test. Chỉ dùng khi test nội bộ; không dùng để public lâu dài.

## 8. Import dữ liệu tĩnh từ source vào CMS mới

Repository có script để đưa trang chủ, bài viết, offerings, testimonials và ảnh có sẵn trong source vào database/MinIO.

Chỉ chạy trên database mới, một lần:

```bash
cd ~/apps/iorder-website/deploy
docker compose run --rm --no-deps migrate pnpm content:import:legacy
```

Git clone chỉ mang code; không mang theo một database cũ ở máy khác. Nếu dữ liệu thật đang ở PostgreSQL cũ, phải export database cũ và restore sang VPS theo quy trình riêng.

## 9. Public miễn phí để test: Cloudflare Quick Tunnel

Quick Tunnel tạo URL HTTPS ngẫu nhiên dạng https://random.trycloudflare.com.

- Không cần domain, public IP hay NAT modem.
- Không dùng làm production: không có SLA và URL có thể đổi khi container/VPS restart.
- Không chia sẻ rộng khi .env còn dùng mật khẩu test.

Chạy tunnel nền từ VPS:

```bash
docker run -d --name iorder-quick-tunnel --restart unless-stopped --network deploy_default cloudflare/cloudflared:latest tunnel --url http://web:80
```

Lấy URL test:

```bash
docker logs --tail 50 iorder-quick-tunnel
```

Tìm dòng https://....trycloudflare.com và mở URL đó. Kiểm tra tunnel:

```bash
docker ps --filter name=iorder-quick-tunnel
```

### Lỗi Quick Tunnel thường gặp

| Hiện tượng      | Cách xử lý                                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Error 1033      | Tunnel đã dừng. Kiểm tra docker ps; chạy lại container tunnel để nhận URL mới.                                                            |
| 502 Bad Gateway | Kiểm tra `docker compose ps` để chắc `web` và `api` đều healthy. Tunnel phải dùng network `deploy_default` và URL nội bộ `http://web:80`. |
| Không thấy URL  | Xem docker logs --tail 50 iorder-quick-tunnel.                                                                                            |

Xóa Quick Tunnel sau khi test xong:

```bash
docker rm -f iorder-quick-tunnel
```

## 10. URL miễn phí ổn định hơn: Tailscale Funnel

Tailscale Funnel có thể tạo URL HTTPS ổn định dạng:

```text
https://iorder-vps.<tailnet>.ts.net
```

Trước tiên bật MagicDNS, HTTPS và Funnel trong trang DNS của Tailscale. Sau đó trên VPS:

```bash
sudo tailscale funnel --bg 4000
sudo tailscale funnel status
```

Funnel không cần domain hoặc NAT, nhưng đang beta và có giới hạn băng thông. Nó phù hợp demo/test; website chính thức nên dùng domain riêng.

## 11. Build và public production qua Cloudflare Tunnel

Phần này là quy trình đầy đủ đã áp dụng cho `iwork.vn`. Một route gốc phục vụ
cả website và CMS:

```text
https://iwork.vn/        → website công khai
https://iwork.vn/admin   → CMS
https://media.iwork.vn   → file ảnh/tài liệu công khai trong MinIO
```

Không tạo public hostname cho PostgreSQL hoặc MinIO Console.

### 11.1 Nguyên tắc trước khi public

1. Thêm domain vào Cloudflare, đổi nameserver theo hướng dẫn của Cloudflare và
   chờ zone có trạng thái **Active**.
2. Không mở port modem cho PostgreSQL, MinIO Console hoặc SSH. Cloudflare
   Tunnel tạo kết nối đi ra từ VPS nên không cần public IP/NAT.
3. `VOLUME_PREFIX` là tên Docker volume chứa PostgreSQL và MinIO. Chọn nó khi
   khởi tạo lần đầu, sau đó **không đổi**. Đổi giá trị này khiến Compose trỏ
   sang database và kho ảnh mới, trống.
4. Không chụp/gửi file `.env`, lệnh tunnel token hoặc password. Nếu một secret
   mẫu đã từng được dùng ngoài Internet, xem nó là đã lộ và thay mới.

### 11.2 Tạo cấu hình production

Với môi trường hoàn toàn mới, tạo `.env` từ mẫu production:

```bash
cd ~/apps/iorder-website/deploy
cp .env.production.example .env
chmod 600 .env
nano .env
```

Thay mọi placeholder bằng password/secret riêng. Tạo secret không cần gửi ra
ngoài máy bằng:

```bash
openssl rand -hex 32
```

Các giá trị public quan trọng của `iwork.vn` là:

```ini
# Chỉ cho cloudflared trên cùng VPS truy cập container web; API không có public port.
APP_PORT=127.0.0.1:4000
SITE_URL=https://iwork.vn

# iorder-media là tên bucket, không phải dấu / thừa.
MEDIA_PUBLIC_BASE_URL=https://media.iwork.vn/iorder-media
SENTRY_ENVIRONMENT=production
```

`MEDIA_PUBLIC_BASE_URL` không có dấu `/` ở cuối. URL của một ảnh sẽ có dạng:

```text
https://media.iwork.vn/iorder-media/seed/posts/news3.jpg
```

Nếu VPS đang chạy từ `.env.docker.example` và đã có dữ liệu thật, **không**
copy đè `.env.production.example` và không đổi `VOLUME_PREFIX`. Sao lưu trước,
rồi cập nhật cấu hình hiện tại từng biến một. Thay ngay password CMS,
`SESSION_SECRET` và `CMS_PREVIEW_SECRET` trước khi public CMS.

Để thay password CMS sau khi đã sửa `CMS_ADMIN_PASSWORD` trong `.env`:

```bash
cd ~/apps/iorder-website/deploy
docker compose run --rm migrate pnpm cms:create-admin
```

Để xoay session/preview secret mà không in giá trị secret ra terminal:

```bash
sed -i "s/^SESSION_SECRET=.*/SESSION_SECRET=$(openssl rand -hex 32)/" .env
sed -i "s/^CMS_PREVIEW_SECRET=.*/CMS_PREVIEW_SECRET=$(openssl rand -hex 32)/" .env
```

Sau khi thay hai secret, mọi session CMS cũ sẽ bị đăng xuất; đây là bình thường.

### 11.3 Build và chạy stack lần đầu

```bash
cd ~/apps/iorder-website/deploy
docker compose up -d --build
docker compose ps
curl -i http://127.0.0.1:4000/
curl -i http://127.0.0.1:4000/api/public/health
```

Mong đợi `web`, `api`, `postgres` và `minio` đều `healthy`; website trả HTML
và `/api/public/health` trả JSON có `"status":"ok"`.

Khi chỉ thay biến môi trường của API, khởi động lại riêng API để không chạy lại
frontend/migration không cần thiết:

```bash
docker compose up -d --no-deps --force-recreate api
```

Kiểm tra lại `docker compose ps`. Container `web` phải hiện
`127.0.0.1:4000->80/tcp` (hoặc port bind theo `APP_PORT`), còn `api` chỉ hiện
`8080/tcp` trong mạng Docker nội bộ.

### 11.4 Cài cloudflared trên Ubuntu

Tại Cloudflare Dashboard vào **Networking → Tunnels → Create Tunnel**, đặt tên
dễ nhận biết (ví dụ `iweb-production`), chọn **Debian / 64-bit**. Trên Ubuntu
VPS cài cloudflared từ repository chính thức:

```bash
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared
cloudflared --version
```

Cloudflare hiển thị một lệnh chứa tunnel token. Chạy chính lệnh đó trên VPS,
không đưa token vào Git hoặc chat. Sau đó kiểm tra tunnel đang chạy như service:

```bash
sudo systemctl is-active cloudflared
```

Kết quả phải là `active`. Không chạy tunnel thủ công rồi đóng bằng `Ctrl+C`;
service systemd mới là tiến trình cần duy trì sau reboot.

### 11.5 Tạo public hostname routes

Trong **Networking → Tunnels → iweb-production → Routes → Add route →
Published application**, tạo lần lượt:

| Hostname                            | Service URL             | Dùng cho                         |
| ----------------------------------- | ----------------------- | -------------------------------- |
| _(để trống subdomain)_ + `iwork.vn` | `http://localhost:4000` | Trang chủ, API và CMS `/admin`   |
| `media.iwork.vn`                    | `http://localhost:9000` | MinIO API chỉ để đọc file public |

Cloudflare tự tạo CNAME trỏ tới `*.cfargotunnel.com`; không cần tự tạo thêm A
record cho hai hostname này.

Không thêm route cho:

- PostgreSQL (`5432`): quản trị bằng SSH/Tailscale hoặc lệnh Docker trong VPS.
- MinIO Console (`9001`): chỉ bind localhost; không public.
- CMS subdomain riêng: hiện CMS dùng `https://iwork.vn/admin`, nên không cần
  `admin.iwork.vn`.

Nếu `www.iwork.vn` đang trỏ website cũ, đừng tự xóa A record. Chỉ tạo route
`www.iwork.vn → http://localhost:4000` sau khi chủ động quyết định chuyển
traffic khỏi máy chủ cũ.

### 11.6 Kiểm tra sau khi public

```bash
# Website, CMS và Tunnel phải đi qua Cloudflare.
curl -I https://iwork.vn/
curl -I https://iwork.vn/admin

# Bucket root bị cấm liệt kê nên HTTP 403 là bình thường.
curl -I https://media.iwork.vn/iorder-media/

# Một object thật cần trả HTTP 200.
curl -I https://media.iwork.vn/iorder-media/seed/posts/news3.jpg
```

Sau khi đổi `MEDIA_PUBLIC_BASE_URL`, restart API bằng lệnh ở mục 11.3 rồi hard
refresh CMS (`Ctrl + Shift + R`). Các ảnh seed sẽ được đồng bộ URL khi API khởi
động. Nếu một asset cũ vẫn hỏng, kiểm tra URL đang lưu trong CMS/database trước
khi chạy bất cứ script migration nào.

### 11.7 Việc bảo mật nên làm tiếp

1. Dùng Cloudflare Access để giới hạn `/admin` cho các email quản trị được
   phép; password CMS vẫn là lớp bảo vệ bắt buộc.
2. Đặt backup PostgreSQL tự động và sao chép backup ra ngoài VPS.
3. Lên lịch đổi riêng password PostgreSQL và MinIO nếu đã khởi tạo bằng mẫu
   test. Việc đổi cần cập nhật đồng thời database, MinIO và `.env`, vì vậy phải
   backup và kiểm tra service trước/sau thao tác.

## 12. Quy trình update code an toàn

Không tạo lại database khi update. Database nằm trong Docker volume và phải được giữ nguyên. Chỉ chạy migration để cập nhật schema.

### 12.1 Trên máy phát triển: Git an toàn

```powershell
# Xem chính xác file nào sẽ được commit.
git status

# Chỉ add các file thuộc thay đổi đang làm; không add .env, backup hoặc file local.
git add <danh-sach-file>
git commit -m "Mô tả thay đổi"
git push origin main
```

Kiểm tra commit đã lên GitHub:

```powershell
git log -1 --oneline
git status
```

`git status` nên báo working tree clean trước khi push. Không dùng
`git reset --hard` hoặc `git clean -fd` trên source đang làm nếu chưa chắc file
nào cần giữ.

### 12.2 Trên VPS: lấy code mới

```bash
cd ~/apps/iorder-website
git status
git pull --ff-only origin main
git log -1 --oneline
```

`--ff-only` chỉ cho phép cập nhật thẳng theo commit trên GitHub, tránh tự tạo
merge commit trên VPS. Nếu `git status` báo có file đã sửa trên VPS, dừng lại,
xem file đó trước khi pull; không dùng `git reset --hard` để ép cập nhật.

### 12.3 Khi backend có migration database

Backup trước nếu thay đổi có migration:

```bash
cd ~/apps/iorder-website/deploy
mkdir -p ~/backups
docker compose exec -T postgres pg_dump -U admin_iorder -d iorderCMS | gzip > ~/backups/iordercms-$(date +%F-%H%M).sql.gz
```

Sau đó build lại backend, chạy migration và restart API:

```bash
cd deploy
docker compose up -d --build --force-recreate migrate api
docker compose ps
```

Không chạy pnpm bootstrap:core, pnpm db:seed hoặc pnpm content:import:legacy trong update thông thường: các lệnh này chỉ dành cho database mới hoặc thao tác có chủ đích.

### 12.4 Build Docker theo phạm vi thay đổi

Sau khi đã `git pull` và đang ở `~/apps/iorder-website/deploy`, chọn đúng lệnh
để thời gian deploy ngắn hơn:

| Khi thay đổi                                       | Lệnh                                                        | Điều gì được restart                                          |
| -------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| CSS, React public site, CMS, ảnh tĩnh trong source | `docker compose up -d --build web`                          | Chỉ container `web`; asset Vite mới được Nginx phục vụ/cache. |
| API/backend, không đổi schema database             | `docker compose up -d --build api`                          | Chỉ container `api`.                                          |
| API/backend có migration                           | `docker compose up -d --build --force-recreate migrate api` | Chạy lại migration rồi thay API.                              |
| Thay đổi cả frontend và backend                    | `docker compose up -d --build`                              | Build/update toàn bộ service liên quan.                       |

Ảnh CMS trong MinIO, PostgreSQL và Docker volumes được giữ nguyên trong tất cả
các lệnh trên. Không dùng `docker compose down -v` khi update vì `-v` có thể
xóa volume dữ liệu.

### 12.5 Kiểm tra và xử lý lỗi sau deploy

```bash
# Container và port public
docker compose ps

# Log riêng của public frontend Nginx và API
docker compose logs --tail 100 web
docker compose logs --tail 100 api

# Kiểm tra từ ngay trong VPS
curl -I http://127.0.0.1:4000/
curl -i http://127.0.0.1:4000/api/public/health
```

Nếu website không mở nhưng `api` healthy, kiểm tra trước xem `web` có đang
`Up (healthy)` không. Container `api` không còn bind public port; website chỉ
được phục vụ qua `web` ở port `4000`.

### 12.6 CI, image registry và deploy bằng image đã kiểm tra

Khi GitHub Actions chạy thành công trên `main`, workflow sẽ publish ba image
theo commit SHA lên GitHub Container Registry (GHCR):

```text
ghcr.io/dvthao02/iorder-api:sha-<commit>
ghcr.io/dvthao02/iorder-web:sha-<commit>
ghcr.io/dvthao02/iorder-minio:sha-<commit>
```

Trước khi dùng GHCR trên VPS, vào GitHub repository **Settings → Actions →
General** và bật quyền **Read and write permissions** cho `GITHUB_TOKEN`. Sau
lần publish đầu, đặt package ở chế độ phù hợp (private/public) trong phần
Packages. Nếu package private, tạo GitHub Personal Access Token có quyền
`read:packages`, rồi đăng nhập một lần trên VPS:

```bash
echo '<PAT_READ_PACKAGES>' | docker login ghcr.io -u dvthao02 --password-stdin
```

Không lưu PAT trong Git hoặc gửi vào chat. Ghi hai tag cùng một commit vào
`.env`, sau đó chỉ pull và chạy image đã được CI kiểm tra:

```ini
API_IMAGE=ghcr.io/dvthao02/iorder-api:sha-<commit>
WEB_IMAGE=ghcr.io/dvthao02/iorder-web:sha-<commit>
MINIO_IMAGE=ghcr.io/dvthao02/iorder-minio:sha-<commit>
```

```bash
cd ~/apps/iorder-website/deploy
docker compose pull
docker compose up -d --no-build
docker compose ps
```

Rollback ứng dụng là đổi cả hai tag về commit release trước, rồi chạy lại ba
lệnh trên. Database migration là forward-only: ưu tiên migration sửa tiếp theo;
chỉ restore backup khi thật sự cần.

### 12.7 Staging trước production

Staging cần một VPS/VM riêng hoặc ít nhất một checkout/Compose project, port,
domain, `VOLUME_PREFIX`, database và MinIO **riêng**. Không bao giờ dùng `.env`
production cho staging. Nếu đặt staging chung VPS, clone repository sang thư mục
khác (ví dụ `~/apps/iorder-website-staging`) và luôn thêm
`-p iorder-staging` vào lệnh `docker compose`.

Mẫu có sẵn ở `deploy/.env.staging.example`. Trong checkout staging, copy mẫu
thành `.env`, thay secrets/domain/tag image, rồi chạy:

```bash
cd ~/apps/iorder-website/deploy
cp .env.staging.example .env
nano .env
docker compose pull
docker compose up -d --no-build
```

Chỉ sau khi kiểm tra homepage, CMS, media upload và migration trên staging mới
đổi tag image tương ứng ở production.

## 13. Backup và kiểm tra thường xuyên

```bash
# Container và trạng thái sức khỏe
docker compose ps

# Log API gần nhất
docker compose logs --tail 100 api

# Website và public API sẵn sàng nhận request
curl -I http://127.0.0.1:4000/
curl -i http://127.0.0.1:4000/api/public/health

# Dung lượng ổ đĩa trong VPS
df -h

# Dung lượng Docker đang dùng
docker system df

# RAM
free -h
```

Dọn image cũ sau khi đã kiểm tra bản mới chạy ổn:

```bash
docker image prune -f
```

Không chạy docker system prune --volumes trừ khi bạn hiểu rõ volume nào sẽ bị xóa; lệnh đó có thể làm mất PostgreSQL hoặc MinIO.

Backup database trong cùng VPS chỉ bảo vệ khi update lỗi. Để bảo vệ khi hỏng ổ/mất máy, hãy sao chép file trong ~/backups ra ổ ngoài hoặc cloud storage.

### 13.1 Backup PostgreSQL tự động mỗi ngày

Repository có sẵn backup script và systemd timer. Cài một lần trên VPS:

```bash
cd ~/apps/iorder-website
sudo cp deploy/systemd/iorder-postgres-backup.service /etc/systemd/system/
sudo cp deploy/systemd/iorder-postgres-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now iorder-postgres-backup.timer
systemctl list-timers iorder-postgres-backup.timer
```

Timer tạo file nén ở `~/backups/iorder-postgres`, giữ 14 ngày. Chạy thử ngay:

```bash
sudo systemctl start iorder-postgres-backup.service
ls -lh ~/backups/iorder-postgres
```

Backup MinIO cần được copy sang ổ ngoài hoặc object storage khác. Backup chỉ ở
cùng VPS không bảo vệ khi ổ đĩa/VM hỏng.

## 14. Nguyên tắc an toàn

- Không SSH bằng root.
- Không dùng .env.docker.example khi public lâu dài.
- Không đưa file .env hoặc secret lên GitHub.
- Không xóa Docker volumes chứa PostgreSQL/MinIO.
- Không public port database/MinIO/SSH ra modem.
- Mỗi lần code có migration: backup → migrate → kiểm tra `/api/public/health` → kiểm tra trang web.
