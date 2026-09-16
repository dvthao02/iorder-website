FROM golang:1.24-alpine AS build

ARG MINIO_COMMIT=7aac2a2c5b7c882e68c1ce017d8256be2feea27f

RUN apk add --no-cache git
RUN git clone https://github.com/minio/minio.git /source \
  && cd /source \
  && git checkout --detach "$MINIO_COMMIT"

WORKDIR /source
RUN CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' -o /out/minio .

FROM alpine:3.22

RUN apk add --no-cache ca-certificates
COPY --from=build /out/minio /usr/local/bin/minio

EXPOSE 9000 9001

ENTRYPOINT ["/usr/local/bin/minio"]
