# Tabler — Restoran İdarəetmə Sistemi

Müasir veb əsaslı restoran idarəetmə sistemi. Menyu, masalar, sifarişlər, mətbəx axını, personal, rollar və hesabatlar — hamısı bir paneldə.

## Demo

| İstifadəçi | Şifrə | Rol | Panel |
|------------|-------|-----|-------|
| `admin` | `admin123` | Super Admin | `/super-admin` |
| `orxan@nerimanov.az` | `orxan123` | Restoran Admin | `/admin` |
| `tural@bakibalta.az` | `tural123` | Restoran Admin | `/admin` |
| `waiter1` | `waiter123` | Ofisant | `/waiter` |
| `waiter2` | `waiter123` | Ofisant | `/waiter` |
| `chef1` | `chef123` | Aşpaz | `/kitchen` |

## Xüsusiyyətlər

- **Multi-tenant sistem** — Super admin təşkilat yaradır, hər təşkilatın öz admini
- **Super Admin Paneli** — Təşkilat idarəetməsi, QR kod, yaratma/silme
- **Admin Paneli** — Dashboard, menyu CRUD (çoxdilli ad/təsvir), masa idarəetməsi, sifariş tarixçəsi, hesabatlar, personal/rol idarəetməsi, tənzimləmələr
- **Ofisant Paneli** — Masa xəritəsi, aktiv sifarişlər, müştəri sifarişi təsdiqi, hesab istəyi
- **Mətbəx Paneli** — Yeni sifarişlər, hazırlama axını, status idarəetməsi, hazırlanma vaxtı izləmə
- **Müştəri Menyusu** — Hər təşkilat üçün ayrı URL (`/org/:orgId/menu`), səbət, sifariş, kamera təsdiqi, sifariş izləmə
- **6 Müştəri Teması** — Classic Blue, Emerald, Sunset, Rose, Violet, Amber (light/dark variantları)
- **4 Sifariş Rejimi** — Ofisant, müştəri, müştəri-ofisant təsdiqi, mətbəx
- **Ödəniş** — Nağd/kart, qabaqdan/sonradan ödəniş
- **İcazə Sistemi** — 22 icazə, 9 qrup, rol əsaslı giriş
- **Çoxdilli Adlar** — Məhsul/kateqoriya adları AZ/EN/RU dillərində saxlanılır
- **İnterfeys Dilləri** — Azərbaycan, İngilis, Rus
- **Tünd/Açıq Mövzu** — Admin panel üçün
- **Real-vaxt yeniləmə** — localStorage polling ilə çox-tab sinkronizasiyası
- **Səs Bildirişləri** — Yeni sifariş və hazır sifariş üçün səs

## Texnologiyalar

| Texnologiya | Versiya | Məqsəd |
|-------------|---------|--------|
| React | 19.2 | UI framework |
| TypeScript | 6.0 | Type safety |
| Vite | 8.1 | Build tool |
| Tailwind CSS | 4.3 | Styling |
| Zustand | 5.0 | State management |
| React Router | 7.18 | Routing |
| Lucide React | 1.25 | İkonlar |
| date-fns | — | Tarix əməliyyatları |
| oxlint | 1.71 | Linting |

## Quraşdırma

```bash
# Dependant-ları yüklə
npm install

# Development server
npm run dev

# Production build
npm run build

# Build preview
npm run preview

# Lint
npm run lint
```

## Struktur

```
src/
├── components/
│   ├── admin/
│   │   └── TableStatusModal.tsx      # Masa status dəyişikliyi modalı
│   ├── customer/
│   │   └── CameraCapture.tsx         # Müştəri kamera komponenti
│   ├── kitchen/
│   │   └── KitchenOrderCard.tsx      # Mtbəx sifariş kartı
│   ├── layout/
│   │   ├── AppLayout.tsx             # Admin layout (sidebar + outlet)
│   │   ├── Header.tsx                # Səhifə başlığı
│   │   └── Sidebar.tsx               # Admin yan panel
│   ├── ui/
│   │   ├── ErrorBoundary.tsx         # Xəta yaxalama
│   │   └── ToastContainer.tsx        # Toast bildirişləri
│   └── waiter/
│       └── WaiterTableDetailModal.tsx # Ofisant masa detalları
├── data/
│   └── mock.ts                       # İlkin demo məlumatları
├── lib/
│   ├── constants.ts                  # Paylaşılan sabitlər
│   ├── sounds.ts                     # Səs bildirişləri
│   └── validation.ts                 # Şifrə hash, input validation
├── pages/
│   ├── LoginPage.tsx                  # Giriş səhifəsi
│   ├── NotFoundPage.tsx              # 404 səhifəsi
│   ├── admin/
│   │   ├── AdminDashboard.tsx        # Admin baxış paneli
│   │   ├── Organizations.tsx        # Super Admin təşkilat idarəetməsi
│   │   ├── AdminMenu.tsx             # Menyu idarəetməsi
│   │   ├── AdminOrders.tsx           # Sifariş tarixçəsi
│   │   ├── AdminReports.tsx          # Hesabatlar
│   │   ├── AdminSettings.tsx         # Tənzimləmələr
│   │   ├── AdminTables.tsx           # Masa idarəetməsi
│   │   ├── RoleManagement.tsx        # Rol idarəetməsi
│   │   └── StaffManagement.tsx       # Personal idarəetməsi
│   ├── customer/
│   │   ├── CustomerMenu.tsx          # Müştəri menyusu
│   │   └── CustomerOrder.tsx         # Sifariş izləmə
│   ├── kitchen/
│   │   └── KitchenDashboard.tsx      # Mtbəx paneli
│   └── waiter/
│       └── WaiterDashboard.tsx       # Ofisant paneli
├── store/
│   ├── useCustomerTheme.ts           # Müştəri tema store
│   ├── useSidebar.ts                 # Sidebar state
│   ├── useStore.ts                   # Əsas Zustand store
│   └── useToast.ts                   # Toast store
├── types/
│   └── index.ts                      # TypeScript tipləri
├── utils/
│   └── localize.ts                   # Çoxdilli ad yardımçısı
├── App.tsx                           # Router konfiqurasiyası
├── main.tsx                          # Giriş nöqtəsi
└── index.css                         # Tailwind + mövzu
```

## Route Xəritəsi

| Route | Komponent | Rollar | İcazə |
|-------|-----------|--------|-------|
| `/login` | LoginPage | Hamısı | — |
| `/super-admin` | Organizations | admin | — |
| `/admin` | AdminDashboard | admin, org_admin | — |
| `/admin/menu` | AdminMenu | admin, org_admin | `menu.view` |
| `/admin/tables` | AdminTables | admin, org_admin | `tables.view` |
| `/admin/orders` | AdminOrders | admin, org_admin | `orders.view` |
| `/admin/reports` | AdminReports | admin, org_admin | `reports.view` |
| `/admin/staff` | StaffManagement | admin, org_admin | `staff.view` |
| `/admin/roles` | RoleManagement | admin, org_admin | `roles.view` |
| `/admin/settings` | AdminSettings | admin, org_admin | `settings.view` |
| `/waiter` | WaiterDashboard | waiter | — |
| `/kitchen` | KitchenDashboard | chef | — |
| `/org/:orgId/menu` | CustomerMenu | Hamısı | — |
| `/org/:orgId/menu/:tableId` | CustomerMenu | Hamısı | — |
| `/order` | CustomerOrder | Hamısı | — |

## İcazə Sistemi

| Qrup | İcazələr |
|------|----------|
| Dashboard | `dashboard.view` |
| Menyu | `menu.view`, `menu.create`, `menu.edit`, `menu.delete` |
| Masalar | `tables.view`, `tables.manage`, `tables.status` |
| Sifarişlər | `orders.view`, `orders.manage`, `orders.cancel` |
| Hesabatlar | `reports.view` |
| Personal | `staff.view`, `staff.create`, `staff.edit`, `staff.delete` |
| Rollar | `roles.view`, `roles.create`, `roles.edit`, `roles.delete` |
| Mtbəx | `kitchen.view`, `kitchen.manage` |
| Tənzimləmələr | `settings.view`, `settings.edit` |

## Sifariş Rejimləri

| Rejim | Təsvir |
|-------|--------|
| `waiter` | Ofisant sifarişi özü yazır, müştəri sadəcə menyuya baxa bilər |
| `customer` | Müştəri menyudan sifariş edir, birbaşa metbəxə gedir |
| `customer-waiter-confirm` | Müştəri sifariş edir, ofisant təsdiqləyir, sonra metbəxə gedir |
| `kitchen` | Ofisant və ya müştəri paneli olmadan, sistem vasitəsilə metbəxə düşür |

## Environment

`.env.example` faylını `.env` kimi kopyalayın:

```bash
cp .env.example .env
```

| Dəyişən | Təsvir | Susmaya görə |
|---------|--------|--------------|
| `VITE_APP_NAME` | Tətbiq adı | `Tabler` |
| `VITE_API_URL` | Backend API URL | — |
| `VITE_DEBUG` | Debug rejimi | `false` |