-- Migrasi untuk tabel api_tokens di Laravel untuk autentikasi mobile app

CREATE TABLE IF NOT EXISTS `api_tokens` (
    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `client_id` int(10) UNSIGNED NOT NULL,
    `token` varchar(255) NOT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `expires_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `api_tokens_token_unique` (`token`),
    KEY `api_tokens_client_id_foreign` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alternatif menggunakan Laravel Migration

/*
Jika ingin menggunakan Laravel Migration, buat file dengan nama:
{timestamp}_create_api_tokens_table.php

Dengan konten:

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('api_tokens', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('client_id');
            $table->string('token')->unique();
            $table->timestamps();
            $table->timestamp('expires_at')->nullable();
            
            // Tambahkan foreign key jika tblclients memiliki primary key id
            // $table->foreign('client_id')->references('id')->on('tblclients')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_tokens');
    }
};
*/ 