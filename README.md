# Purwadhika Final Project Repository

This project uses Express.js and Prisma as the ORM. It is used to build both a mini-project and a final-project for students of the Job Connector Web Development program.

📃 Rules

        ⌨️ Commit & Pull Request

            ✔️ Selalu gunakan `conventional commit message` saat melakukan commit atau pada saat `creating pull request`: https://www.conventionalcommits.org/en/v1.0.0/

            ✔️ `Squash and Merge` pull request menuju ke `branch main`


        🏷️ Standarisasi Penamaan

            🌐 REST API

                ✔️ Selalu ikuti standarisasi `REST API naming convention` untuk penamaan endpoint URL: https://restfulapi.net/resource-naming/

            📂 Penamaan File

                ✔️ Gunakan Format Penamaan yang Sama untuk Directory atau Files:
                        ▪️Format penamaan directory dan file di dalam 1 project harus konsisten dan seragam antara 1 developer dengan developer lainnya.
                        ▪️Untuk penamaan yang lebih dari 1 suku kata bisa menggunakan format `snake_case` atau `camelCase` atau `dot.case`.
                        ▪️Example: index.ts, productsController.ts, productsService.ts
                        ▪️Example: index.ts, products_controller.ts, products_service.ts
                        ▪️Example: index.ts, products.controller.ts, products.service.ts

                ✔️ Gunakan Nama File yang Deskriptif:
                        ▪️Pilih nama yang secara akurat menggambarkan konten dari file tersebut.
                        ▪️Hindari nama file yang terlalu umum seperti `utils.ts` atau `decode.ts`.

                ✔️ Ikuti Standarisasi Penamaan File untuk Jenis File Tertentu:
                        ▪️Untuk file konfigurasi, gunakan nama seperti .env, config.js, atau settings.json.
                        ▪️Gunakan penamaan yang konsisten untuk file test, seperti menambahkan .test.js atau .spec.js ke nama file yang sedang diuji.

<!--  -->
<!--  -->
<!--  -->

📦 Prisma ORM - Dokumentasi Penggunaan!

        🔧 Migrasi Database

            ✔️ Untuk membuat dan menjalankan migrasi selama fase development:

                bash> npm run migrate:dev

            ✔️ Untuk migrasi di fase production

                bash> npx prisma migrate deploy
