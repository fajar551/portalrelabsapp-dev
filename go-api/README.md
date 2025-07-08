# Portal API - Go Version

API Go yang setara dengan Laravel MobileAuthController untuk performa yang lebih cepat.

## Struktur Project

```
go-api/
├── main.go                 # Entry point aplikasi
├── go.mod                  # Go module dependencies
├── go.sum                  # Go module checksums
├── config/
│   └── database.go         # Konfigurasi database
├── controllers/
│   └── mobile_auth.go      # Controller utama (setara MobileAuthController)
├── middleware/
│   └── auth.go             # Middleware autentikasi
├── models/
│   ├── client.go           # Model Client
│   └── image.go            # Model Image
└── routes/
    └── routes.go           # Setup routing
```

## Setup

### 1. Install Dependencies

```bash
go mod init portal-api
go get github.com/gin-gonic/gin
go get gorm.io/gorm
go get gorm.io/driver/mysql
go get golang.org/x/crypto/bcrypt
```

### 2. Konfigurasi Database

Edit `config/database.go` dan sesuaikan dengan database Anda:

```go
dsn := "username:password@tcp(localhost:3306)/database_name?charset=utf8mb4&parseTime=True&loc=Local"
```

### 3. Build & Run

```bash
go build
./portal-api.exe  # Windows
./portal-api      # Linux/Mac
```

## API Endpoints

### Auth Routes (No Middleware)

- `POST /api/v2/auth/login` - Login dengan email/ID dan password

### Protected Routes (With Middleware)

- `GET /api/v2/clients` - Ambil semua clients
- `GET /api/v2/client` - Ambil client berdasarkan token
- `GET /api/v2/client/:id` - Ambil client berdasarkan ID
- `GET /api/v2/invoices` - Ambil semua invoices client
- `POST /api/v2/upload-files` - Upload multiple files
- `DELETE /api/v2/delete-image/:id` - Hapus image

## Perbandingan dengan Laravel

### Laravel API (Port 80/443)

```
POST https://portal.internetan.id:2083/api/auth/login
GET https://portal.internetan.id:2083/api/invoices
```

### Go API (Port 8081)

```
POST https://portal.internetan.id:2083/api/v2/auth/login
GET https://portal.internetan.id:2083/api/v2/invoices
```

## Keuntungan Go API

1. **Performa**: 5-10x lebih cepat dari Laravel
2. **Memory**: Lebih efisien
3. **Concurrent**: Handling request lebih baik
4. **Single Binary**: Deployment lebih mudah

## Deployment di cPanel

### 1. Upload Binary

Upload `portal-api.exe` ke folder `go-api/` di cPanel

### 2. Setup .htaccess

```apache
# Redirect API v2 ke Go server
RewriteRule ^api/v2/(.*)$ http://localhost:8081/api/v2/$1 [P,L]
```

### 3. Run Server

```bash
nohup ./portal-api.exe &
```

## Testing

### Test Login

```bash
curl -X POST http://localhost:8081/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user@example.com","password":"password"}'
```

### Test Protected Route

```bash
curl -X GET http://localhost:8081/api/v2/invoices \
  -H "Authorization: Bearer YOUR_TOKEN"
```
