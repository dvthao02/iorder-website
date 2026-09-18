## Mục tiêu

- [ ] Mô tả ngắn thay đổi và lý do.

## Phạm vi deploy

- [ ] Frontend (`web`/`admin`) — chỉ cần build image `web`.
- [ ] Backend API — cần build image `api`.
- [ ] Có migration database — cần backup và chạy service `migrate`.
- [ ] Thay đổi hạ tầng/Docker/secret — cần review riêng.

## Kiểm tra

- [ ] Đã chạy lint/typecheck/test phù hợp ở local.
- [ ] Đã kiểm tra responsive nếu có thay đổi UI.
- [ ] Không đưa `.env`, secret, backup hoặc dữ liệu production vào commit.
