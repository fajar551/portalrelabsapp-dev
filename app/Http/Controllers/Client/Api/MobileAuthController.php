<?php

namespace App\Http\Controllers\Client\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MobileAuthController extends Controller
{
    // Method untuk debug token format
    public function debugToken(Request $request)
    {
        try {
            $token = $request->bearerToken();

            if (!$token) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Token tidak ditemukan'
                ], 401);
            }

            // Coba decode token
            $decodedToken = null;
            try {
                $decodedToken = json_decode(base64_decode($token), true);
            } catch (\Exception $e) {
                $decodedToken = 'Gagal decode: ' . $e->getMessage();
            }

            // Cek di tabel api_tokens
            $apiToken = DB::table('api_tokens')
                ->where('token', $token)
                ->first();

            // Cek di tabel personal_access_tokens
            $personalToken = DB::table('personal_access_tokens')
                ->where('token', hash('sha256', $token))
                ->first();

            return response()->json([
                'status' => 'success',
                'token_info' => [
                    'token_length' => strlen($token),
                    'token_preview' => substr($token, 0, 50) . '...',
                    'decoded_token' => $decodedToken,
                    'found_in_api_tokens' => $apiToken ? true : false,
                    'found_in_personal_access_tokens' => $personalToken ? true : false,
                    'api_token_data' => $apiToken,
                    'personal_token_data' => $personalToken
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    // Perbaiki getHomeData untuk handle kedua format token
    public function getHomeData(Request $request)
    {
        try {
            // Ambil token dari header
            $token = $request->bearerToken();

            if (!$token) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Token tidak ditemukan'
                ], 401);
            }

            // Cari di tabel api_tokens
            $tokenData = DB::table('api_tokens')
                ->where('token', $token)
                ->first();

            if (!$tokenData) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Token tidak valid atau sudah kadaluarsa'
                ], 401);
            }

            $clientId = $tokenData->client_id;

            // 1. Ambil data client
            $client = DB::table('tblclients')
                ->where('id', $clientId)
                ->select('id', 'firstname', 'lastname', 'email', 'status')
                ->first();

            if (!$client) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Client tidak ditemukan'
                ], 404);
            }

            // 2. Ambil semua invoice dari client
            $invoices = DB::table('tblinvoices')
                ->where('userid', $clientId)
                ->orderBy('date', 'desc')
                ->limit(50)
                ->get([
                    'id',
                    'invoicenum',
                    'date',
                    'duedate',
                    'total',
                    'status',
                    'paymentmethod',
                    'subtotal',
                    'tax',
                    'tax2',
                    'notes'
                ]);

            // 3. Ambil status domain
            $domainStatus = DB::table('tblhosting')
                ->where('userid', $clientId)
                ->value('domainstatus');

            // 4. Ambil notifikasi
            $notifications = DB::table('tblemails')
                ->where('userid', $clientId)
                ->orderBy('date', 'desc')
                ->limit(100)
                ->get(['id', 'userid', 'subject', 'message', 'date', 'to', 'attachments']);

            // 5. Ambil riwayat pembayaran (paid invoices)
            $paymentHistory = DB::table('tblinvoices')
                ->where('userid', $clientId)
                ->where('status', 'Paid')
                ->orderBy('datepaid', 'desc')
                ->get([
                    'id',
                    'invoicenum',
                    'datepaid',
                    'subtotal',
                    'tax',
                    'total',
                    'paymentmethod',
                    DB::raw('DATE_FORMAT(datepaid, "%M") as month'),
                    DB::raw('YEAR(datepaid) as year')
                ]);

            // Format payment history
            $formattedPayments = [];
            foreach ($paymentHistory as $payment) {
                $formattedPayments[] = [
                    'id' => $payment->id,
                    'invoicenum' => $payment->invoicenum,
                    'month' => $payment->month,
                    'year' => $payment->year,
                    'amount' => $payment->total,
                    'datepaid' => $payment->datepaid,
                    'status' => 'Paid',
                    'status_text' => 'Dibayar',
                    'paymentmethod' => $payment->paymentmethod
                ];
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'client' => [
                        'id' => $client->id,
                        'name' => $client->firstname . ' ' . $client->lastname,
                        'email' => $client->email,
                        'status' => $client->status,
                    ],
                    'invoices' => $invoices,
                    'domain_status' => $domainStatus ?? '-',
                    'notifications' => $notifications,
                    'payment_history' => $formattedPayments
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    // Method untuk debug phone formats
    public function debugPhoneFormats()
    {
        $phones = Client::select('id', 'firstname', 'lastname', 'phonenumber')
            ->whereNotNull('phonenumber')
            ->where('phonenumber', '!=', '')
            ->where('phonenumber', 'like', '%82130697168%')
            ->get();

        return response()->json([
            'status' => 'success',
            'phones' => $phones
        ]);
    }

    // Method untuk debug table structure
    public function debugTableStructure()
    {
        try {
            $columns = Schema::getColumnListing('tblclients');
            return response()->json([
                'status' => 'success',
                'columns' => $columns
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    // Normalisasi nomor telepon
    private function normalizePhoneNumber($phoneNumber)
    {
        // Hapus semua karakter non-digit
        $cleaned = preg_replace('/[^0-9]/', '', $phoneNumber);

        // Jika dimulai dengan 62, ganti dengan 0
        if (strpos($cleaned, '62') === 0) {
            $cleaned = '0' . substr($cleaned, 2);
        }

        return $cleaned;
    }

    // Method WhatsApp login
    public function whatsappLogin(Request $request)
    {
        try {
            $request->validate([
                'phone_number' => 'required|string',
                'otp_code' => 'required|string|size:4',
                'device_name' => 'required|string',
            ]);

            $phoneNumber = $request->phone_number;
            $otpCode = $request->otp_code;
            $deviceName = $request->device_name;

            // Normalisasi nomor telepon
            $normalizedPhone = $this->normalizePhoneNumber($phoneNumber);

            // Cari client dengan berbagai kemungkinan format
            $client = Client::where(function ($query) use ($phoneNumber, $normalizedPhone) {
                // Format asli
                $query->where('phonenumber', $phoneNumber)
                    // Format yang sudah dinormalisasi
                    ->orWhere('phonenumber', $normalizedPhone)
                    // Format tanpa 0 di depan
                    ->orWhere('phonenumber', ltrim($normalizedPhone, '0'))
                    // Format dengan 62 di depan
                    ->orWhere('phonenumber', '62' . ltrim($normalizedPhone, '0'))
                    // Format dengan +62 di depan
                    ->orWhere('phonenumber', '+62' . ltrim($normalizedPhone, '0'))
                    // Format dengan spasi atau dash
                    ->orWhere('phonenumber', str_replace([' ', '-', '_'], '', $phoneNumber))
                    ->orWhere('phonenumber', str_replace([' ', '-', '_'], '', $normalizedPhone))
                    // Format dengan 8 di depan (tanpa 0)
                    ->orWhere('phonenumber', '8' . substr($normalizedPhone, 1))
                    // Format dengan 628 di depan
                    ->orWhere('phonenumber', '628' . substr($normalizedPhone, 1))
                    // Format dengan +628 di depan
                    ->orWhere('phonenumber', '+628' . substr($normalizedPhone, 1));
            })->first();

            if (!$client) {
                // Debug: cek semua nomor telepon di database
                $allPhones = Client::select('id', 'firstname', 'lastname', 'phonenumber')
                    ->whereNotNull('phonenumber')
                    ->where('phonenumber', '!=', '')
                    ->limit(10)
                    ->get();

                return response()->json([
                    'status' => 'error',
                    'message' => 'Nomor telepon tidak ditemukan dalam database. Nomor yang dicari: ' . $phoneNumber . ' (normalized: ' . $normalizedPhone . ')',
                    'debug' => [
                        'searched_formats' => [
                            $phoneNumber,
                            $normalizedPhone,
                            ltrim($normalizedPhone, '0'),
                            '62' . ltrim($normalizedPhone, '0'),
                            '+62' . ltrim($normalizedPhone, '0'),
                            '8' . substr($normalizedPhone, 1),
                            '628' . substr($normalizedPhone, 1),
                            '+628' . substr($normalizedPhone, 1)
                        ],
                        'sample_phones_in_db' => $allPhones
                    ]
                ], 404);
            }

            // Verifikasi OTP (hardcoded untuk testing)
            if ($otpCode !== '1234') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Kode OTP tidak valid'
                ], 400);
            }

            // Generate token sederhana seperti method login
            $token = \Illuminate\Support\Str::random(60);

            // Set token expiry menjadi 100 tahun dari sekarang (seumur hidup)
            $expires_at = now()->addYears(100);

            // Simpan token di tabel api_tokens seperti method login
            DB::table('api_tokens')->updateOrInsert(
                ['client_id' => $client->id],
                [
                    'token' => $token,
                    'created_at' => now(),
                    'updated_at' => now(),
                    'expires_at' => $expires_at,
                ]
            );

            // Update last login
            $client->update(['lastlogin' => now()]);

            return response()->json([
                'status' => 'success',
                'message' => 'Login WhatsApp berhasil',
                'data' => [
                    'token' => $token,
                    'expires_at' => $expires_at->toIso8601String(),
                    'client' => [
                        'id' => $client->id,
                        'name' => $client->firstname . ' ' . $client->lastname,
                        'email' => $client->email,
                        'phone' => $client->phonenumber,
                        'mobile' => $client->phonenumber,
                        'company' => $client->companyname,
                        'status' => $client->status,
                        'created_at' => $client->datecreated,
                        'updated_at' => $client->lastlogin
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat login WhatsApp: ' . $e->getMessage()
            ], 500);
        }
    }
}