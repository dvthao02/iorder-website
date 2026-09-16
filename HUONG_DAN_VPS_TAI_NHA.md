# Hướng dẫn tạo VPS tại nhà bằng Windows + Hyper-V

Tài liệu này dành cho máy Windows riêng chạy 24/7. Ubuntu Server chạy trong Hyper-V sẽ là máy chủ để chạy website.

## 1. Mô hình sau khi hoàn thành

```text
Internet -> Cloudflare (HTTPS) -> Cloudflare Tunnel -> Ubuntu VM -> Docker -> Website
```

Không cần mở port trên modem nếu dùng Cloudflare Tunnel. Đây là lựa chọn nên dùng khi bắt đầu.

## 2. Cấu hình máy ảo đã tạo

Gợi ý cho máy Windows có 8 GB RAM và còn khoảng 83 GB trống:

| Hạng mục | Giá trị |
| --- | --- |
| Tên VM | `iorder-vps` (hoặc tên tùy thích) |
| Generation | Generation 2 |
| RAM khởi động | 4096 MB |
| Dynamic Memory maximum | 6144 MB |
| CPU | 2 virtual processors |
| Virtual hard disk | VHDX dynamic, tối đa 50 GB |
| ISO | Ubuntu Server 26.04.1 |

Trong Hyper-V Manager, mở **Settings** của VM để đổi CPU tại mục **Processor** nếu chưa đặt.

## 3. Việc đầu tiên sau khi đăng nhập Ubuntu

Trong màn hình Ubuntu Server, chạy lần lượt các lệnh sau.

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y openssh-server curl ca-certificates
sudo systemctl enable --now ssh
hostname -I
```

Ví dụ kết quả của `hostname -I`:

```text
172.26.34.120
```

Đó là IP nội bộ của máy ảo. Ghi lại IP này.

> Khi gõ mật khẩu với `sudo`, Ubuntu không hiện dấu `*`; đó là bình thường.

## 4. Đăng nhập Ubuntu từ Windows bằng SSH

Trên máy Windows, mở PowerShell và thay `thao` bằng username bạn đã tạo, thay IP bằng IP ở bước trước:

```powershell
ssh thao@172.26.34.120
```

Lần đầu, gõ `yes` khi được hỏi xác nhận khóa máy chủ, sau đó nhập mật khẩu Ubuntu.

Từ đây, có thể làm phần lớn thao tác trong PowerShell thay vì cửa sổ Hyper-V.

## 5. Cài Docker và Docker Compose

Sau khi SSH vào Ubuntu, chạy toàn bộ các lệnh dưới đây theo thứ tự.

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"${UBUNTU_CODENAME:-$VERSION_CODENAME}\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Thoát SSH rồi kết nối lại để quyền Docker có hiệu lực:

```bash
exit
```

Mở lại PowerShell trên Windows:

```powershell
ssh thao@172.26.34.120
```

Kiểm tra Docker:

```bash
docker run hello-world
docker compose version
```

Nếu thấy thông báo chào mừng từ Docker thì cài đặt thành công.

## 6. Chạy thử một website

Chạy Nginx thử nghiệm tại cổng 8080:

```bash
docker run -d --name web-test --restart unless-stopped -p 8080:80 nginx:alpine
```

Trên Windows, mở trình duyệt và vào:

```text
http://172.26.34.120:8080
```

Nếu thấy trang **Welcome to nginx!**, máy chủ đã chạy website thành công.

Dừng và xóa web thử nghiệm khi không cần nữa:

```bash
docker rm -f web-test
```

## 7. Lưu ý về mạng Hyper-V

`Default Switch` thường cho VM ra Internet được và Windows host có thể truy cập IP VM. Tuy nhiên, máy khác trong cùng Wi-Fi/LAN có thể không truy cập trực tiếp được.

Khi cần VM có IP cùng lớp mạng với modem (ví dụ `192.168.1.x`), tạo **External Virtual Switch**:

1. Trong Hyper-V Manager, mở **Virtual Switch Manager**.
2. Chọn **New virtual network switch** -> **External**.
3. Chọn card mạng đang dùng (ưu tiên LAN dây), đặt tên `External LAN` và Apply.
4. Tắt VM, mở Settings -> **Network Adapter**, chọn `External LAN`, rồi bật lại VM.
5. Trong Ubuntu chạy lại `hostname -I` để lấy IP mới.

## 8. Public website ra Internet bằng Cloudflare Tunnel

Làm bước này khi website local tại `http://IP-VM:8080` đã hoạt động.

Bạn cần một domain đã thêm vào tài khoản Cloudflare. Sau đó, cài `cloudflared` trên Ubuntu theo hướng dẫn chính thức của Cloudflare, đăng nhập, tạo tunnel và trỏ hostname về dịch vụ local:

```text
www.tenmiencuaban.com -> http://localhost:8080
```

Cloudflare sẽ tự cấp HTTPS. Không public PostgreSQL, Redis, admin panel hoặc SSH ra Internet.

## 9. Khi deploy dự án iOrder

Dự án iOrder gồm web, admin, API và PostgreSQL. Khi Docker đã sẵn sàng, bước tiếp theo là tạo một file `compose.yaml` để chạy các dịch vụ đó cùng nhau.

Trước khi public thật, cần có:

- Biến môi trường/secret riêng, không commit vào Git.
- Mật khẩu database mạnh.
- Backup database và thư mục uploads ra một nơi khác.
- Docker containers dùng `restart: unless-stopped`.
- Windows tắt Sleep; BIOS bật tự khởi động sau khi có điện.
- Hyper-V cấu hình VM tự khởi động cùng Windows.

## 10. Các lệnh kiểm tra hay dùng

```bash
# Xem container đang chạy
docker ps

# Xem log container
docker logs --tail 100 TEN_CONTAINER

# Xem dung lượng ổ đĩa
df -h

# Xem RAM
free -h

# Xem IP
hostname -I

# Cập nhật các gói Ubuntu
sudo apt update && sudo apt upgrade -y
```

## 11. Không làm những việc này

- Không chạy website bằng tài khoản `root`.
- Không mở cổng database ra Internet.
- Không tắt tường lửa/modem bảo mật chỉ để thử cho nhanh.
- Không để Windows hoặc VM tự sleep.
- Không để đầy ổ Windows: luôn chừa tối thiểu 25 GB.
