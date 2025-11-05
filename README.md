# LearnMate - Educational Platform

Talebetik'ten esinlenerek geliştirilmiş modern eğitim ve test platformu. Öğretmenlerin test oluşturabildiği, öğrencilerin bu testleri çözebildiği ve sonuçlarını görebildiği tam stack bir uygulama.

## 🚀 Teknoloji Stack

### Backend
- **Node.js** & **Express.js** - REST API
- **TypeScript** - Type safety
- **PostgreSQL** - İlişkisel veritabanı
- **Prisma ORM** - Modern database toolkit
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Web Frontend
- **Next.js 15** (App Router) - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Redux Toolkit** - State management
- **Axios** - HTTP client
- **React Hook Form** + **Zod** - Form validation

### Mobile (Gelecekte)
- **React Native** (Expo) - Cross-platform mobile
- **TypeScript**
- **React Navigation** - Routing
- **Redux Toolkit** - State management

## 📁 Proje Yapısı

```
LearnMate/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── web/              # Next.js Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/      # Login, Register
│   │   │   ├── (dashboard)/ # Admin, Teacher, Student panels
│   │   │   └── ...
│   │   ├── components/
│   │   ├── lib/
│   │   └── store/
│   └── package.json
│
└── mobile/           # React Native App (Gelecekte)
```

## 🛠️ Kurulum ve Çalıştırma

### 1. Gereksinimler

- Node.js 20.x veya üstü
- PostgreSQL 16.x veya üstü
- npm veya pnpm

### 2. PostgreSQL Kurulumu

```bash
# PostgreSQL veritabanı oluştur
createdb learnmate

# Veya psql ile:
psql -U postgres
CREATE DATABASE learnmate;
\q
```

### 3. Backend Kurulumu

```bash
# Backend klasörüne git
cd backend

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur (manuel)
# Aşağıdaki içeriği backend/.env dosyasına yapıştırın:
```

**backend/.env:**
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/learnmate?schema=public"
JWT_SECRET=learnmate-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=7d
WEB_URL=http://localhost:3000
MOBILE_URL=http://localhost:8081
```

> ⚠️ **Önemli**: `DATABASE_URL`'deki `postgres:password` kısmını kendi PostgreSQL kullanıcı adı ve şifrenizle değiştirin!

```bash
# Prisma Client oluştur
npm run prisma:generate

# Database migration çalıştır
npm run prisma:migrate

# Development server'ı başlat
npm run dev
```

Backend API çalışacak: `http://localhost:5000`

### 4. Web Frontend Kurulumu

```bash
# Web klasörüne git
cd web

# Bağımlılıklar zaten yüklü ama yoksa:
pnpm install

# .env.local dosyasını oluştur (manuel)
# Aşağıdaki içeriği web/.env.local dosyasına yapıştırın:
```

**web/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=LearnMate
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
# Development server'ı başlat
pnpm dev
```

Web uygulaması çalışacak: `http://localhost:3000`

## 🧪 Test Etme

### 1. İlk Kullanıcıyı Oluşturma

`http://localhost:3000/register` adresine gidin ve bir hesap oluşturun:

**Öğretmen Hesabı:**
- Ad: Ahmet
- Soyad: Yılmaz
- Email: teacher@test.com
- Şifre: 123456
- Rol: Öğretmen

**Öğrenci Hesabı:**
- Ad: Ayşe
- Soyad: Demir
- Email: student@test.com
- Şifre: 123456
- Rol: Öğrenci

### 2. Giriş Yapma

`http://localhost:3000/login` adresine gidin ve az önce oluşturduğunuz hesapla giriş yapın.

Rol'e göre otomatik yönlendirme:
- **Öğretmen** → `/teacher`
- **Öğrenci** → `/student`
- **Admin** → `/admin`

## 📋 API Endpoints

### Authentication
```
POST /api/auth/register    - Yeni kullanıcı kaydı
POST /api/auth/login       - Kullanıcı girişi
GET  /api/auth/me          - Mevcut kullanıcı bilgisi (Protected)
PUT  /api/auth/profile     - Profil güncelleme (Protected)
PUT  /api/auth/change-password - Şifre değiştirme (Protected)
```

### Users (Admin Only)
```
GET    /api/users          - Tüm kullanıcılar
GET    /api/users/stats    - Kullanıcı istatistikleri
GET    /api/users/:id      - Kullanıcı detayı
PUT    /api/users/:id      - Kullanıcı güncelleme
DELETE /api/users/:id      - Kullanıcı silme
```

## 🎯 Kullanıcı Rolleri

| Rol | Yetkiler |
|-----|----------|
| **ADMIN** | Tam sistem kontrolü, kullanıcı yönetimi |
| **TEACHER** | Test oluşturma, sınıf yönetimi, öğrenci takibi |
| **STUDENT** | Test çözme, sonuçları görüntüleme |

## 📊 Veritabanı Yapısı

- **users** - Kullanıcı hesapları
- **profiles** - Kullanıcı profil bilgileri
- **classrooms** - Sınıflar
- **classroom_members** - Sınıf üyelikleri
- **subjects** - Dersler
- **topics** - Konular
- **questions** - Soru bankası
- **question_options** - Soru şıkları
- **tests** - Testler
- **test_questions** - Test-soru ilişkisi
- **student_tests** - Öğrenci test atamaları
- **student_answers** - Öğrenci cevapları
- **notifications** - Bildirimler

Detaylı schema için: `backend/prisma/schema.prisma`

## 🔧 Geliştirme Komutları

### Backend
```bash
npm run dev              # Development server
npm run build            # Production build
npm start                # Production server
npm run prisma:generate  # Prisma client oluştur
npm run prisma:migrate   # Migration çalıştır
npm run prisma:studio    # Prisma Studio (DB GUI)
```

### Web
```bash
pnpm dev     # Development server
pnpm build   # Production build
pnpm start   # Production server
pnpm lint    # ESLint çalıştır
```

## 🚧 Gelecek Özellikler

- [ ] Soru bankası yönetimi
- [ ] Test oluşturma ve düzenleme
- [ ] Sınıf yönetimi
- [ ] Test çözme ekranı
- [ ] Sonuç ve istatistik sayfaları
- [ ] Bildirim sistemi
- [ ] Dosya yükleme (resim, PDF)
- [ ] Email bildirimleri
- [ ] React Native mobil uygulama

## 📝 Lisans

MIT

## 👨‍💻 Geliştirici

Bitirme Projesi








