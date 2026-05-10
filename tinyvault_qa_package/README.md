# TinyVault Kalite Güvence (QA) Teslim Paketi

Bu paket, TinyVault projesinin tüm test süreçlerine ait kanıtları, raporları ve kapsama analizlerini tek bir merkezde toplar.

## 📁 Paket İçeriği

### [1. Frontend E2E Testleri (Playwright)](./1_frontend_e2e)
- **Rapor:** `report/index.html` (Uçtan uca test sonuçları)
- **Kanıtlar:** `artifacts/` (Test sırasında kaydedilen videolar, trace dosyaları ve hata anı ekran görüntüleri)
- **Durum:** 69 Başarılı, 5 Atlanan (Görsel toast doğrulamaları)

### [2. Frontend Birim Testleri (Vitest)](./2_frontend_unit)
- **Kapsama Raporu:** `coverage/index.html`
- **Kapsama Oranı:** **%95.95** (Statement), **%84.68** (Branch)
- **Kapsanan Alanlar:** Authentication, Subscription CRUD, Filtering, Sorting, UI Components.

### [3. Backend Birim Testleri (Pytest)](./3_backend_unit)
- **Kapsama Raporu:** `coverage/index.html`
- **Kapsama Oranı:** **%97.00**
- **Kapsanan Alanlar:** Auth logic, Subscription services, API endpoints, Lifecycle, Seeding.

### [4. Görsel Kanıtlar & Dokümantasyon](./4_visual_evidence)
- **Ekran Görüntüleri:** Manuel olarak alınan uygulama içi görüntüler.
- **ER Diyagramı:** Veritabanı şeması görseli.

## 📄 Ek Dokümanlar
- **[TEST_CASES.md](./TEST_CASES.md)**: Uygulanan tüm test senaryolarının listesi.
- **[REPORT.md](./REPORT.md)**: Genel proje ve test sonuç raporu.

---
**Oluşturulma Tarihi:** 2026-05-10
**Hazırlayan:** Antigravity AI
