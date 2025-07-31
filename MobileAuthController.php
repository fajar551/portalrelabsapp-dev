<?php

namespace App\Http\Controllers\Client\Api;

use App\Models\Image;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Paymentgateway;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;

use App\Http\Controllers\Controller;

class MobileAuthController extends Controller
{

    public function login(Request $request)
    {
        // Ubah validasi untuk mendukung email atau id pelanggan (id)
        $request->validate([
            'identifier' => 'required',
            'password' => 'required',
            'device_name' => 'nullable|string',
        ]);

        // Deteksi apakah identifier adalah email atau ID pelanggan
        $isEmail = filter_var($request->identifier, FILTER_VALIDATE_EMAIL);

        // Cari client berdasarkan email atau ID
        $query = DB::table('tblclients');

        if ($isEmail) {
            // Jika format email, cari berdasarkan email
            $query->where('email', $request->identifier);
        } else {
            // Jika bukan format email, cari berdasarkan ID
            $query->where('id', $request->identifier);
        }

        $client = $query->first();

        // Cek jika client ditemukan dan password benar
        if ($client && Hash::check($request->password, $client->password)) {
            // Buat token sederhana
            $token = Str::random(60);

            // Set token expiry menjadi 15 menit dari sekarang
            // $expires_at = now()->addMinutes(15);
            $expires_at = now()->addYears(100);

            // Simpan token di tabel api_tokens
            DB::table('api_tokens')->updateOrInsert(
                ['client_id' => $client->id],
                [
                    'token' => $token,
                    'created_at' => now(),
                    // 'expires_at' => $expires_at,
                ]
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Login berhasil',
                'data' => [
                    'token' => $token,
                    'expires_at' => $expires_at->toIso8601String(),
                    'client' => [
                        'id' => $client->id,
                        'name' => $client->firstname . ' ' . $client->lastname,
                        'email' => $client->email,
                        'phone' => $client->phonenumber,
                        'address' => $client->address1,
                        'status' => $client->status,
                    ]
                ]
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'ID Pelanggan/Email atau password salah'
        ], 401);
    }

    /**
     * Menampilkan halaman redirect ke aplikasi mobile
     */
    public function resetRedirect(Request $request)
    {
        $token = $request->token;
        $email = $request->email;
        $appUrl = "app://reset-password?token=$token&email=$email";

        return \view('redirect_to_app', [
            'appUrl' => $appUrl,
            'token' => $token,
            'email' => $email
        ]);
    }

    /**
     * Kirim email reset password dengan kode verifikasi
     */
    public function forgotPassword(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return \response()->json([
                'success' => false,
                'message' => 'Email tidak valid',
                'errors' => $validator->errors()
            ], 422);
        }

        $email = $request->email;
        $client = \App\Models\Client::where('email', $email)->first();

        if (!$client) {
            return \response()->json([
                'success' => false,
                'message' => 'Email tidak ditemukan dalam database'
            ], 404);
        }

        // Buat kode verifikasi 4 digit
        $verificationCode = sprintf('%04d', rand(0, 9999));

        // Simpan token ke database
        \Illuminate\Support\Facades\DB::table('password_resets')->updateOrInsert(
            ['email' => $email],
            [
                'email' => $email,
                'token' => $verificationCode,
                'created_at' => \Illuminate\Support\Carbon::now()
            ]
        );

        // Kirim email dengan kode verifikasi
        try {
            \Illuminate\Support\Facades\Mail::send('emails.verification_code', [
                'code' => $verificationCode,
                'email' => $email
            ], function ($message) use ($email) {
                $message->to($email);
                $message->subject('Kode Verifikasi Reset Password');
            });

            return \response()->json([
                'success' => true,
                'message' => 'Kode verifikasi telah dikirim ke email Anda'
            ]);
        } catch (\Exception $e) {
            return \response()->json([
                'success' => false,
                'message' => 'Gagal mengirim email kode verifikasi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset password dengan kode verifikasi
     */
    public function resetPassword(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|min:6',
            'password_confirmation' => 'required|same:password'
        ]);

        if ($validator->fails()) {
            return \response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $email = $request->email;
        $token = $request->token;
        $password = $request->password;

        // Cek apakah token valid
        $passwordReset = \Illuminate\Support\Facades\DB::table('password_resets')
            ->where('email', $email)
            ->where('token', $token)
            ->first();

        if (!$passwordReset) {
            return \response()->json([
                'success' => false,
                'message' => 'Kode verifikasi tidak valid'
            ], 400);
        }

        // Cek apakah token sudah expired (24 jam)
        $tokenCreatedAt = \Illuminate\Support\Carbon::parse($passwordReset->created_at);
        if (\Illuminate\Support\Carbon::now()->diffInHours($tokenCreatedAt) > 24) {
            return \response()->json([
                'success' => false,
                'message' => 'Kode verifikasi sudah kadaluarsa'
            ], 400);
        }

        // Update password client
        $client = \App\Models\Client::where('email', $email)->first();
        if (!$client) {
            return \response()->json([
                'success' => false,
                'message' => 'Email tidak ditemukan dalam database'
            ], 404);
        }

        // Update password
        $client->password = \Illuminate\Support\Facades\Hash::make($password);
        $client->save();

        // Hapus token dari tabel password_resets
        \Illuminate\Support\Facades\DB::table('password_resets')
            ->where('email', $email)
            ->delete();

        return \response()->json([
            'success' => true,
            'message' => 'Password berhasil diperbarui'
        ]);
    }

    public function getAllClients(Request $request)
    {
        // Ambil semua data client (hanya data yang perlu ditampilkan)
        $clients = DB::table('tblclients')
            ->select('id', 'firstname', 'lastname', 'email', 'status', 'password')
            ->limit(50) // Batasi untuk optimasi
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'clients' => $clients
            ]
        ]);
    }

    public function getClientById(Request $request, $id = null)
    {
        // Coba ambil client ID dari token jika tidak ada di parameter URL
        if (!$id) {
            // Ambil token dari header
            $token = $request->bearerToken();

            if (!$token) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Token tidak ditemukan'
                ], 401);
            }

            // Cari client_id berdasarkan token
            $tokenData = DB::table('api_tokens')
                ->where('token', $token)
                ->first();

            if (!$tokenData) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Token tidak valid atau sudah kadaluarsa'
                ], 401);
            }

            $id = $tokenData->client_id;
        }

        // Ambil data client berdasarkan ID
        $client = DB::table('tblclients')
            ->where('id', $id)
            ->first();

        if (!$client) {
            return response()->json([
                'status' => 'error',
                'message' => 'Client tidak ditemukan'
            ], 404);
        }

        // Filter data yang diperlukan untuk halaman Account
        return response()->json([
            'status' => 'success',
            'data' => [
                'client' => [
                    'id' => $client->id,
                    'firstname' => $client->firstname,
                    'lastname' => $client->lastname,
                    'email' => $client->email,
                    'address1' => $client->address1,
                    'address2' => $client->address2,
                    'city' => $client->city,
                    'state' => $client->state,
                    'postcode' => $client->postcode,
                    'country' => $client->country,
                    'phonenumber' => $client->phonenumber,
                    'company' => $client->companyname,
                    'status' => $client->status,
                    'created_at' => $client->datecreated,
                ]
            ]
        ]);
    }

    public function getAllInvoices(Request $request)
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

            // Cari client_id berdasarkan token
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

            // Ambil semua invoice dari client
            $invoices = DB::table('tblinvoices')
                ->where('userid', $clientId)
                ->orderBy('date', 'desc')
                ->limit(50) // Batasi hasilnya untuk optimasi
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

            return response()->json([
                'status' => 'success',
                'data' => [
                    'invoices' => $invoices
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    // public function getInvoiceById(Request $request, $id)
    // {
    //     try {
    //         // Ambil token dari header
    //         $token = $request->bearerToken();

    //         if (!$token) {
    //             return response()->json([
    //                 'status' => 'error',
    //                 'message' => 'Token tidak ditemukan'
    //             ], 401);
    //         }

    //         // Cari client_id berdasarkan token
    //         $tokenData = DB::table('api_tokens')
    //             ->where('token', $token)
    //             ->where('expires_at', '>', now())
    //             ->first();

    //         if (!$tokenData) {
    //             return response()->json([
    //                 'status' => 'error',
    //                 'message' => 'Token tidak valid atau sudah kadaluarsa'
    //             ], 401);
    //         }

    //         $clientId = $tokenData->client_id;

    //         // Ambil detail invoice
    //         $invoice = DB::table('tblinvoices')
    //             ->where('id', $id)
    //             ->where('userid', $clientId) // Pastikan invoice milik client yang benar
    //             ->first();

    //         if (!$invoice) {
    //             return response()->json([
    //                 'status' => 'error',
    //                 'message' => 'Invoice tidak ditemukan'
    //             ], 404);
    //         }

    //         // Ambil item-item invoice
    //         $items = DB::table('tblinvoiceitems')
    //             ->where('invoiceid', $id)
    //             ->get();

    //         // Format response
    //         return response()->json([
    //             'status' => 'success',
    //             'data' => [
    //                 'invoice' => $invoice,
    //                 'items' => $items
    //             ]
    //         ]);
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'status' => 'error',
    //             'message' => 'Terjadi kesalahan: ' . $e->getMessage()
    //         ], 500);
    //     }
    // }

    public function getInvoiceById(Request $request, $id)
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

            // Cari client_id berdasarkan token
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

            // Ambil detail invoice
            $invoice = DB::table('tblinvoices')
                ->where('id', $id)
                ->where('userid', $clientId) // Pastikan invoice milik client yang benar
                ->first();

            if (!$invoice) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invoice tidak ditemukan'
                ], 404);
            }

            // Ambil item-item invoice
            $items = DB::table('tblinvoiceitems')
                ->where('invoiceid', $id)
                ->get();

            // Ambil informasi pembayaran dan gateway
            $payment_info = [];
            $va_number = null;
            $gateway_name = null;

            // 1. Prioritaskan paymentmethod dari invoice untuk menentukan gateway
            $invoice_gateway = null;

            // Cek payment method dari invoice
            if (isset($invoice->paymentmethod) && !empty($invoice->paymentmethod)) {
                $invoice_gateway = $invoice->paymentmethod;
            }
            // Jika tidak ada, cek gateway dari invoice
            else if (isset($invoice->gateway) && !empty($invoice->gateway)) {
                $invoice_gateway = $invoice->gateway;
            }

            // Debug info
            \Log::info("Invoice Gateway: " . $invoice_gateway);

            // 2. Dapatkan semua VA untuk client menggunakan JOIN
            $va_values = DB::table('tblcustomfieldsvalues')
                ->join('tblcustomfields', 'tblcustomfields.id', '=', 'tblcustomfieldsvalues.fieldid')
                ->where('tblcustomfields.type', 'client')
                ->where(function ($query) {
                    $query->where('tblcustomfields.fieldname', 'LIKE', 'Fixed VA%')
                        ->orWhere('tblcustomfields.fieldname', 'LIKE', '%Virtual Account%')
                        ->orWhere('tblcustomfields.fieldname', 'LIKE', '%VA%');
                })
                ->where('tblcustomfieldsvalues.relid', $clientId)
                ->whereNotNull('tblcustomfieldsvalues.value')
                ->where('tblcustomfieldsvalues.value', '!=', '')
                ->select(
                    'tblcustomfields.id as field_id',
                    'tblcustomfields.fieldname as field_name',
                    'tblcustomfieldsvalues.value as va_value'
                )
                ->get();

            // Log seluruh data VA untuk debugging
            \Log::info("VA Values: ", $va_values->toArray());

            // Array untuk menyimpan semua VA dan gateway names
            $available_va_numbers = [];
            $gateway_names = [];
            $field_name_to_gateway = [];

            // Mapping gateway codes (baik standard maupun Xendit variants)
            $gateway_code_map = [
                // BCA VA variants
                'bcavaconventionalpayment' => 'bcava',
                'bcavaxendit' => 'bcava',

                // BNI VA variants
                'bnivaxendit' => 'bniva',
                'bnivaconventionalpayment' => 'bniva',

                // BRI VA variants
                'brivaconventionalpayment' => 'briva',
                'brivaxendit' => 'briva',

                // Mandiri VA variants
                'mandirieconventionalpayment' => 'mandiriea',
                'mandirivaxendit' => 'mandiriea',

                // Permata VA variants
                'permatabankvaxendit' => 'permatava',
                'permatabankva' => 'permatava',
            ];

            // Mendapatkan gateway code yang telah distandarisasi
            $normalized_invoice_gateway = isset($gateway_code_map[$invoice_gateway])
                ? $gateway_code_map[$invoice_gateway]
                : strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $invoice_gateway));

            \Log::info("Normalized Invoice Gateway: " . $normalized_invoice_gateway);

            // Mengekstrak gateway code dari fieldname
            foreach ($va_values as $va_value) {
                $field_name = $va_value->field_name;
                $field_gateway = null;
                $normalized_field_gateway = null;

                if (strpos(strtolower($field_name), 'bri') !== false) {
                    $field_gateway = 'brivaconventionalpayment';
                    $normalized_field_gateway = 'briva';
                    $gateway_names[$field_gateway] = 'BRI VA';
                } elseif (strpos(strtolower($field_name), 'mandiri') !== false) {
                    $field_gateway = 'mandirieconventionalpayment';
                    $normalized_field_gateway = 'mandiriea';
                    $gateway_names[$field_gateway] = 'Mandiri VA';
                } elseif (strpos(strtolower($field_name), 'permata') !== false) {
                    $field_gateway = 'permatabankvaxendit';
                    $normalized_field_gateway = 'permatava';
                    $gateway_names[$field_gateway] = 'Permata Bank VA';
                } elseif (strpos(strtolower($field_name), 'bca') !== false) {
                    $field_gateway = 'bcavaconventionalpayment';
                    $normalized_field_gateway = 'bcava';
                    $gateway_names[$field_gateway] = 'BCA VA';
                } elseif (strpos(strtolower($field_name), 'bni') !== false) {
                    $field_gateway = 'bnivaxendit';
                    $normalized_field_gateway = 'bniva';
                    $gateway_names[$field_gateway] = 'BNI VA';
                } elseif (strpos(strtolower($field_name), 'cimb') !== false) {
                    $field_gateway = 'cimbvaxendit';
                    $normalized_field_gateway = 'cimbva';
                    $gateway_names[$field_gateway] = 'CIMB VA';
                } elseif (strpos(strtolower($field_name), 'sampoerna') !== false) {
                    $field_gateway = 'sahabat_sampoerna';
                    $normalized_field_gateway = 'sahabat_sampoerna';
                    $gateway_names[$field_gateway] = 'Sampoerna VA';
                }

                if ($field_gateway) {
                    // Simpan VA number dengan gateway-nya
                    $available_va_numbers[$field_gateway] = $va_value->va_value;

                    // Juga simpan mapping field_name ke gateway untuk memudahkan lookup
                    $field_name_to_gateway[$field_name] = $field_gateway;

                    // Cek kecocokan antara normalized invoice gateway dan normalized field gateway
                    \Log::info("Checking: normalized_invoice_gateway={$normalized_invoice_gateway}, normalized_field_gateway={$normalized_field_gateway}");

                    if ($normalized_field_gateway == $normalized_invoice_gateway) {
                        $va_number = $va_value->va_value;
                        $gateway_name = $gateway_names[$field_gateway];

                        \Log::info("Match found! VA: {$va_number}, Gateway: {$field_gateway}");
                    }
                }
            }

            // Jika VA number tidak ditemukan tapi invoice gateway terdeteksi, coba cari match terdekat
            if (!$va_number && $invoice_gateway) {
                \Log::info("No exact match found, trying to find closest match");

                // Konversi untuk BCA Xendit -> BCA Conventional
                if ($normalized_invoice_gateway == 'bcava') {
                    foreach ($available_va_numbers as $gateway => $va) {
                        $normalized_gateway = isset($gateway_code_map[$gateway]) ? $gateway_code_map[$gateway] : '';

                        if ($normalized_gateway == 'bcava') {
                            $va_number = $va;
                            $gateway_name = $gateway_names[$gateway] ?? 'BCA VA';
                            \Log::info("BCA match found! VA: {$va_number}, Gateway: {$gateway}");
                            break;
                        }
                    }
                }

                // Jika masih belum ditemukan, gunakan gateway asli invoice dan ambil VA yang tersedia
                if (!$va_number) {
                    // Gunakan gateway asli invoice dan VA dari available
                    foreach ($gateway_code_map as $gateway_code => $normalized_code) {
                        if ($normalized_code == $normalized_invoice_gateway && isset($available_va_numbers[$gateway_code])) {
                            $va_number = $available_va_numbers[$gateway_code];
                            $gateway_name = $gateway_names[$gateway_code] ?? $this->getGatewayName($gateway_code);
                            \Log::info("Secondary match found! VA: {$va_number}, Gateway: {$gateway_code}");
                            break;
                        }
                    }
                }
            }

            // Jika masih tidak ada VA yang cocok, kembalikan status invoice gateway tapi tanpa VA
            if (!$va_number && count($available_va_numbers) > 0) {
                \Log::info("Using invoice gateway without VA: {$invoice_gateway}");

                $gateway_name = $this->getGatewayName($invoice_gateway);
            }

            // 4. Tambahkan informasi payment ke response
            $payment_info = [
                'gateway' => $invoice_gateway,
                'normalized_gateway' => $normalized_invoice_gateway,
                'va_number' => $va_number,
                'virtual_account_number' => $va_number,
                'account_number' => $va_number,
                'gateway_name' => $gateway_name ?? $this->getGatewayName($invoice_gateway),
                'available_payment_methods' => array_map(function ($key, $value) use ($gateway_names) {
                    return [
                        'gateway' => $key,
                        'gateway_name' => $gateway_names[$key] ?? $this->getGatewayName($key),
                        'va_number' => $value
                    ];
                }, array_keys($available_va_numbers), array_values($available_va_numbers))
            ];

            // Format response
            return response()->json([
                'status' => 'success',
                'data' => [
                    'invoice' => $invoice,
                    'items' => $items,
                    'payment_info' => $payment_info
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error("Error in getInvoiceById: " . $e->getMessage());
            \Log::error($e->getTraceAsString());

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mendapatkan nama gateway berdasarkan kode gateway
     */
    private function getGatewayName($gateway)
    {
        $gatewayNames = [
            'brivaconventionalpayment' => 'BRI VA',
            'mandirieconventionalpayment' => 'Mandiri VA',
            'permatabankvaxendit' => 'Permata Bank VA',
            'bcavaconventionalpayment' => 'BCA VA',
            'bnivaxendit' => 'BNI VA',
            'bcavaxendit' => 'BCA VA',
            'brivaxendit' => 'BRI VA',
            'mandirivaxendit' => 'Mandiri VA',
            'permatavaxendit' => 'Permata Bank VA',
        ];

        return $gatewayNames[$gateway] ?? $gateway;
    }

    /**
     * Mendapatkan nama gateway berdasarkan kode gateway
     */
    // private function getGatewayName($gateway) 
    // {
    //     $gatewayNames = [
    //         'brivaconventionalpayment' => 'BRI VA',
    //         'mandirieconventionalpayment' => 'Mandiri VA',
    //         'permatabankvaxendit' => 'Permata Bank VA',
    //         'bcavaconventionalpayment' => 'BCA VA',
    //         'bnivaxendit' => 'BNI VA',
    //         // Tambahkan gateway lain sesuai kebutuhan
    //     ];

    //     return $gatewayNames[$gateway] ?? $gateway;
    // }

    public function getDetailInvoice(Request $request)
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

            // Cari client_id berdasarkan token
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

            // Ambil invoice dari user
            $invoices = DB::table('tblinvoices')
                ->where('userid', $clientId)
                ->orderBy('date', 'desc')
                ->get(['id', 'invoicenum', 'date', 'duedate', 'total', 'status', 'paymentmethod', 'subtotal', 'tax']);

            if ($invoices->isEmpty()) {
                return response()->json([
                    'status' => 'success',
                    'data' => [
                        'invoices' => [],
                        'items' => [],
                        'hosting' => [],
                    ]
                ]);
            }

            // Kumpulkan semua invoice ID
            $invoiceIds = $invoices->pluck('id')->toArray();

            // Ambil invoice items untuk semua invoice
            $invoiceItems = DB::table('tblinvoiceitems')
                ->whereIn('invoiceid', $invoiceIds)
                ->get(['id', 'invoiceid', 'description', 'amount', 'taxed']);

            // Ambil hosting yang terhubung dengan invoice
            $hostingServices = DB::table('tblhosting')
                ->where('userid', $clientId)
                ->join('tblproducts', 'tblhosting.packageid', '=', 'tblproducts.id')
                ->select(
                    'tblhosting.id as hosting_id',
                    'tblhosting.packageid',
                    'tblhosting.domain',
                    'tblhosting.domainstatus',
                    'tblhosting.nextduedate',
                    'tblhosting.billingcycle',
                    'tblhosting.amount',
                    'tblproducts.name as product_name',
                    'tblproducts.description as product_description',
                    'tblproducts.servertype'
                )
                ->get();

            // Kelompokkan item berdasarkan invoice ID
            $groupedItems = [];
            foreach ($invoiceItems as $item) {
                if (!isset($groupedItems[$item->invoiceid])) {
                    $groupedItems[$item->invoiceid] = [];
                }
                $groupedItems[$item->invoiceid][] = $item;
            }

            // Tambahkan items ke masing-masing invoice
            $enhancedInvoices = [];
            foreach ($invoices as $invoice) {
                $invoiceDetails = (array) $invoice;
                $invoiceDetails['items'] = $groupedItems[$invoice->id] ?? [];

                // Format tanggal untuk lebih mudah dibaca
                $invoiceDetails['formatted_date'] = date('d M Y', strtotime($invoice->date));
                $invoiceDetails['formatted_duedate'] = date('d M Y', strtotime($invoice->duedate));

                // Status pembayaran dalam bahasa Indonesia
                $invoiceDetails['status_text'] = $this->translateStatus($invoice->status);

                $enhancedInvoices[] = $invoiceDetails;
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'invoices' => $enhancedInvoices,
                    'hosting' => $hostingServices,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getInvoiceDetails(Request $request, $invoice_id)
    {
        try {
            // 1. Ambil token dari header Authorization
            $token = $request->bearerToken();

            if (!$token) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Token tidak ditemukan'
                ], 401);
            }

            // 2. Dapatkan client_id dari tabel api_tokens langsung
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

            // 3. Dapatkan invoice dengan menggunakan client ID
            $invoice = DB::table('tblinvoices')
                ->where(function ($query) use ($invoice_id) {
                    $query->where('id', $invoice_id)
                        ->orWhere('invoicenum', $invoice_id);
                })
                ->where('userid', $clientId)
                ->first();

            if (!$invoice) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invoice tidak ditemukan'
                ], 404);
            }

            // 4. Dapatkan invoice items
            $invoiceItems = DB::table('tblinvoiceitems')
                ->where('invoiceid', $invoice->id)
                ->get();

            // Format data untuk respons
            $details = [];
            $monthlyCharges = [];
            $proratedCharges = [];

            foreach ($invoiceItems as $item) {
                // Identifikasi jenis item berdasarkan deskripsi atau tipe
                if (strpos(strtolower($item->description), 'prorated') !== false) {
                    $proratedCharges[] = [
                        'description' => $item->description,
                        'amount' => $item->amount
                    ];
                } else {
                    $monthlyCharges[] = [
                        'description' => $item->description,
                        'amount' => $item->amount
                    ];
                }
            }

            // Hitung pajak
            $taxes = [];
            if (isset($invoice->tax) && $invoice->tax > 0) {
                $taxes[] = [
                    'description' => 'PPN ' . (isset($invoice->taxrate) ? $invoice->taxrate . '%' : ''),
                    'amount' => $invoice->tax
                ];
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Invoice details retrieved successfully',
                'data' => [
                    'invoice' => [
                        'id' => $invoice->id,
                        'invoicenum' => $invoice->invoicenum ?? '',
                        'month' => date('F', strtotime($invoice->date)),
                        'year' => date('Y', strtotime($invoice->date)),
                        'amount' => $invoice->total,
                        'status' => $invoice->status,
                        'datepaid' => $invoice->datepaid,
                        'paymentmethod' => $invoice->paymentmethod,
                    ],
                    'details' => $details,
                    'charges' => $charges,
                    'taxes' => $taxes,
                    'monthly_charges' => $monthlyCharges,
                    'prorated_charges' => $proratedCharges,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getPaymentHistory(Request $request)
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

            // Cari client_id berdasarkan token
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

            // Ambil pembayaran yang sudah dilakukan (paid invoices) berdasarkan client ID
            $payments = DB::table('tblinvoices')
                ->where('userid', $clientId)
                ->where('status', 'Paid') // Hanya invoice yang sudah dibayar
                ->orderBy('datepaid', 'desc') // Urutkan berdasarkan tanggal pembayaran terbaru
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

            // Format data pembayaran untuk response
            $formattedPayments = [];
            foreach ($payments as $payment) {
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
                    'payments' => $formattedPayments
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    private function translateStatus($status)
    {
        $translations = [
            'Paid' => 'Dibayar',
            'Unpaid' => 'Belum Dibayar',
            'Cancelled' => 'Dibatalkan',
            'Refunded' => 'Dikembalikan',
            'Collections' => 'Penagihan',
            'Draft' => 'Draft',
            'Payment Pending' => 'Menunggu Pembayaran'
        ];

        return $translations[$status] ?? $status;
    }

    /**
     * Mendapatkan daftar payment gateway beserta instruksinya
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPaymentGateways(Request $request)
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

            // Ambil semua data dari tabel tblpaymentgateways
            $rawGateways = DB::table('tblpaymentgateways')->get();

            // Kelompokkan data berdasarkan gateway
            $gateways = [];
            $visibleGateways = [];

            // Pertama identifikasi gateway yang visible = on
            foreach ($rawGateways as $item) {
                if ($item->setting === 'visible' && $item->value === 'on') {
                    $visibleGateways[] = $item->gateway;
                }
            }

            // Hanya proses gateway yang visible = on
            foreach ($rawGateways as $item) {
                $gatewayName = $item->gateway;

                // Lewati gateway yang tidak visible
                if (!in_array($gatewayName, $visibleGateways)) {
                    continue;
                }

                // Inisialisasi gateway jika belum ada
                if (!isset($gateways[$gatewayName])) {
                    // Cek apakah gateway adalah Virtual Account
                    $isVA = $this->isVirtualAccount($gatewayName);

                    $gateways[$gatewayName] = [
                        'id' => $item->id,
                        'name' => $gatewayName,
                        // 'description' => 'Pembayaran melalui ' . $gatewayName,
                        // Untuk VA, gunakan instruksi sederhana
                        'instructions' => $isVA ?
                            '<p><strong>Silahkan melakukan pembayaran ke nomor Virtual Account Anda berikut: {{va_number}}</strong></p>' :
                            '',
                        'status' => 'Aktif',
                        'is_va' => $isVA
                    ];
                }

                // Atur properti berdasarkan setting
                switch ($item->setting) {
                    case 'name':
                        $gateways[$gatewayName]['name'] = $item->value;
                        break;
                    case 'instructions':
                        // Hanya terapkan instruksi lengkap untuk gateway non-VA
                        if (!$gateways[$gatewayName]['is_va']) {
                            $gateways[$gatewayName]['instructions'] = $item->value;
                        }
                        break;
                    case 'description':
                        $gateways[$gatewayName]['description'] = $item->value;
                        break;
                }
            }

            // Konversi ke array nilai untuk respons
            $results = array_values($gateways);

            return response()->json([
                'status' => 'success',
                'message' => 'Berhasil mendapatkan daftar payment gateway',
                'data' => [
                    'gateways' => $results
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mendapatkan daftar payment gateway: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cek apakah gateway adalah Virtual Account
     * 
     * @param string $gatewayName
     * @return bool
     */
    private function isVirtualAccount($gatewayName)
    {
        $vaKeywords = [
            'va',
            'virtual account',
            'virtualaccount',
            'permata',
            'bca',
            'bni',
            'bri',
            'mandiri',
            'xendit'
        ];

        foreach ($vaKeywords as $keyword) {
            if (stripos($gatewayName, $keyword) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Format instruksi pembayaran dengan placeholder untuk VA
     * 
     * @param string $instructions
     * @param string $gatewayName
     * @return string
     */
    private function formatInstructions($instructions, $gatewayName)
    {
        // Jika gateway adalah VA, tambahkan keterangan placeholder
        if ($this->isVirtualAccount($gatewayName)) {
            // Ganti placeholder {$nova} dengan placeholder yang akan diisi di frontend
            $instructions = str_replace('{$nova}', '{{va_number}}', $instructions);

            // Tambahkan instruksi VA di awal
            $vaMessage = "<p><strong>Silahkan melakukan pembayaran ke nomor Virtual Account Anda berikut: {{va_number}}</strong></p>";

            // Pastikan tidak menambahkan dua kali jika sudah ada placeholder serupa
            if (strpos($instructions, '{{va_number}}') === false) {
                $instructions = $vaMessage . $instructions;
            }
        }

        return $instructions;
    }


    /**
     * Generate nomor Virtual Account untuk pembayaran invoice
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function generateVirtualAccount(Request $request)
    {
        try {
            // Validasi input
            $validator = Validator::make($request->all(), [
                'invoice_id' => 'required|integer',
                'gateway_id' => 'required|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => $validator->errors()->first(),
                ], 422);
            }

            $invoiceId = $request->input('invoice_id');
            $gatewayId = $request->input('gateway_id');

            // Cek invoice
            $invoice = Invoice::where('id', $invoiceId)
                ->orWhere('invoicenum', $invoiceId)
                ->first();

            if (!$invoice) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invoice tidak ditemukan',
                ], 404);
            }

            // Cek gateway
            $gateway = Paymentgateway::find($gatewayId);
            if (!$gateway) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Payment gateway tidak ditemukan',
                ], 404);
            }

            // Generate VA number (contoh sederhana: kombinasi invoice ID dan timestamp)
            // Dalam implementasi nyata, ini akan memanggil API penyedia VA
            $timestamp = now()->format('YmdHis');
            $vaNumberPrefix = '8277'; // Contoh prefix VA

            // Buat VA number yang unik (kombinasi prefix + invoice ID + timestamp)
            $invoicePart = str_pad(preg_replace('/[^0-9]/', '', $invoiceId), 8, '0', STR_PAD_LEFT);
            $vaNumber = $vaNumberPrefix . $invoicePart . substr($timestamp, -4);

            // Panjang max VA number biasanya 16 digit, pastikan tidak melebihi
            $vaNumber = substr($vaNumber, 0, 16);

            // Simpan VA Number ke database (opsional, tergantung kebutuhan)
            // $transaction = new PaymentTransaction();
            // $transaction->invoice_id = $invoice->id;
            // $transaction->gateway_id = $gatewayId;
            // $transaction->va_number = $vaNumber;
            // $transaction->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Virtual Account berhasil dibuat',
                'data' => [
                    'invoice_id' => $invoice->id,
                    'va_number' => $vaNumber,
                    'gateway_id' => $gatewayId,
                    'gateway_name' => $gateway->name,
                    'amount' => $invoice->total,
                    'expires_at' => now()->addDays(1)->format('Y-m-d H:i:s'),
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat Virtual Account: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getAllNotifications(Request $request)
    {
        try {
            // Ambil token dari header Authorization: Bearer {token}
            $token = $request->bearerToken();

            if (!$token) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Token tidak ditemukan'
                ], 401);
            }

            // Cek token di tabel api_tokens
            $tokenData = DB::table('api_tokens')
                ->where('token', $token)
                ->first();

            if (!$tokenData) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Token tidak valid atau sudah kadaluarsa'
                ], 401);
            }

            // Ambil semua notifikasi dari tblemails, bisa difilter by userid jika mau
            $query = DB::table('tblemails')
                ->select('id', 'userid', 'subject', 'message', 'date', 'to', 'attachments');

            // Jika ingin filter by user (otomatis dari token, atau dari query param)
            $userid = $request->userid ?? $tokenData->client_id;
            if ($userid) {
                $query->where('userid', $userid);
            }

            $notifications = $query->orderBy('date', 'desc')->limit(100)->get();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'notifications' => $notifications
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    function getGoogleAccessToken($serviceAccountFile)
    {
        $jsonKey = json_decode(file_get_contents($serviceAccountFile), true);

        $header = ['alg' => 'RS256', 'typ' => 'JWT'];
        $now = time();
        $payload = [
            'iss' => $jsonKey['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => $jsonKey['token_uri'],
            'iat' => $now,
            'exp' => $now + 3600,
        ];

        $base64UrlHeader = rtrim(strtr(base64_encode(json_encode($header)), '+/', '-_'), '=');
        $base64UrlPayload = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');
        $data = $base64UrlHeader . '.' . $base64UrlPayload;

        // Sign JWT
        $signature = '';
        openssl_sign($data, $signature, $jsonKey['private_key'], 'sha256');
        $base64UrlSignature = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

        $jwt = $data . '.' . $base64UrlSignature;

        // Get access token
        $postFields = http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $jsonKey['token_uri']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
        $result = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($result, true);
        return $result['access_token'] ?? null;
    }

    // public function sendPushNotificationV1($fcmToken, $title, $body, $data = [])
    // {
    //     try {
    //         $serviceAccountPath = storage_path('app/firebase-service-account.json');
    //         $projectId = 'relabs-96c17';

    //         $accessToken = $this->getGoogleAccessToken($serviceAccountPath);

    //         // Batasi panjang pesan
    //         $truncatedBody = Str::limit(strip_tags($body), 100);

    //         // Log ukuran pesan
    //         \Log::info("Ukuran pesan asli: " . strlen($body) . " karakter");
    //         \Log::info("Ukuran pesan setelah dipotong: " . strlen($truncatedBody) . " karakter");

    //         $message = [
    //             'message' => [
    //                 'token' => $fcmToken,
    //                 'notification' => [
    //                     'title' => $title,
    //                     'body' => $truncatedBody,
    //                 ],
    //                 'android' => [
    //                     'priority' => 'high',
    //                     'notification' => [
    //                         'channel_id' => 'email_channel',
    //                         'sound' => 'default',
    //                         'default_sound' => true,
    //                         'default_vibrate_timings' => true,
    //                         'default_light_settings' => true,
    //                         'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
    //                         'visibility' => 'public'
    //                     ]
    //                 ],
    //                 'apns' => [
    //                     'headers' => [
    //                         'apns-priority' => '10'
    //                     ],
    //                     'payload' => [
    //                         'aps' => [
    //                             'sound' => 'default',
    //                             'badge' => 1,
    //                             'content-available' => 1
    //                         ]
    //                     ]
    //                 ],
    //                 'data' => array_merge([
    //                     'full_message' => $body,
    //                     'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
    //                     'title' => $title,
    //                     'body' => $truncatedBody,
    //                     'sound' => 'default',
    //                     'status' => 'done',
    //                     'screen' => 'email_detail'
    //                 ], $data)
    //             ],
    //         ];

    //         $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";
    //         $headers = [
    //             "Authorization: Bearer $accessToken",
    //             "Content-Type: application/json",
    //         ];

    //         $ch = curl_init();
    //         curl_setopt($ch, CURLOPT_URL, $url);
    //         curl_setopt($ch, CURLOPT_POST, true);
    //         curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    //         curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    //         curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($message));

    //         $response = curl_exec($ch);
    //         $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    //         // Log response untuk debugging
    //         \Log::info("FCM Request Payload: " . json_encode($message));
    //         \Log::info("FCM Response Code: " . $httpCode);
    //         \Log::info("FCM Response: " . $response);

    //         curl_close($ch);

    //         if ($httpCode == 200) {
    //             return 'Push notification sent!';
    //         } else {
    //             return 'Failed: ' . $response;
    //         }
    //     } catch (\Exception $e) {
    //         \Log::error("Error in sendPushNotificationV1: " . $e->getMessage());
    //         return 'Failed: ' . $e->getMessage();
    //     }
    // }

    public function sendPushNotificationV1($fcmToken, $title, $date, $data = [])
    {
        try {
            $serviceAccountPath = storage_path('app/firebase-service-account.json');
            $projectId = 'relabs-96c17';

            $accessToken = $this->getGoogleAccessToken($serviceAccountPath);

            // Format tanggal agar lebih user friendly
            $dateString = Carbon::parse($date)->format('d M Y H:i');

            $message = [
                // 'message' => [
                //     'token' => $fcmToken,
                //     'notification' => [
                //         'title' => $title,
                //         'body' => "Tanggal: $dateString", // hanya tanggal
                //     ],
                //     'android' => [
                //         'priority' => 'high',
                //         'notification' => [
                //             'channel_id' => 'email_channel',
                //             'sound' => 'default',
                //             'default_sound' => true,
                //             'default_vibrate_timings' => true,
                //             'default_light_settings' => true,
                //             'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                //             'visibility' => 'public'
                //         ]
                //     ],
                //     'apns' => [
                //         'headers' => [
                //             'apns-priority' => '10'
                //         ],
                //         'payload' => [
                //             'aps' => [
                //                 'sound' => 'default',
                //                 'badge' => 1,
                //                 'content-available' => 1
                //             ]
                //         ]
                //     ],
                //     'data' => array_merge([
                //         'email_date' => $dateString,
                //         'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                //         'title' => $title,
                //         'sound' => 'default',
                //         'status' => 'done',
                //         'screen' => 'email_detail'
                //     ], $data)
                // ],

                'message' => [
                    'token' => $fcmToken,
                    'notification' => [
                        'title' => $title,
                        'body' => "Tanggal: $dateString",
                    ],
                    'android' => [
                        'priority' => 'high',
                        'notification' => [
                            'channel_id' => 'email_channel',
                        ]
                    ],
                    'data' => [
                        'email_id' => (string)$emailId,
                        'type' => 'email',
                        'timestamp' => now()->toIso8601String()
                    ]
                ]

            ];

            $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";
            $headers = [
                "Authorization: Bearer $accessToken",
                "Content-Type: application/json",
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($message));

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode == 200) {
                return 'Push notification sent!';
            } else {
                return 'Failed: ' . $response;
            }
        } catch (\Exception $e) {
            \Log::error("Error in sendPushNotificationV1: " . $e->getMessage());
            return 'Failed: ' . $e->getMessage();
        }
    }

    // public function saveFcmToken(Request $request)
    // {
    //     try {
    //         $request->validate([
    //             'user_id' => 'required|integer',
    //             'fcm_token' => 'required|string',
    //         ]);

    //         DB::table('user_fcm_tokens')->updateOrInsert(
    //             ['user_id' => $request->user_id],
    //             [
    //                 'fcm_token' => $request->fcm_token, 
    //                 'updated_at' => now()
    //             ]
    //         );

    //         return response()->json([
    //             'status' => 'success',
    //             'message' => 'FCM token saved successfully'
    //         ]);
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'status' => 'error',
    //             'message' => $e->getMessage()
    //         ], 500);
    //     }
    // }

    public function saveFcmToken(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required|integer',
                'fcm_token' => 'required|string',
            ]);

            // Hapus token yang sama jika sudah ada untuk user lain
            DB::table('user_fcm_tokens')->where('fcm_token', $request->fcm_token)->delete();

            // Update/insert token untuk user ini
            DB::table('user_fcm_tokens')->updateOrInsert(
                ['user_id' => $request->user_id],
                [
                    'fcm_token' => $request->fcm_token,
                    'updated_at' => now()
                ]
            );

            return response()->json([
                'status' => 'success',
                'message' => 'FCM token saved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function createEmailAndPush(Request $request)
    {
        try {
            // 1. Validasi input
            $request->validate([
                'userid' => 'required|integer',
                'subject' => 'required|string',
                'message' => 'required|string',
                'to' => 'required|email'
            ]);

            // 2. Simpan email ke tblemails
            $emailId = DB::table('tblemails')->insertGetId([
                'userid' => $request->userid,
                'subject' => $request->subject,
                'message' => $request->message,
                'date' => now(),
                'to' => $request->to,
                'attachments' => $request->attachments ?? null,
            ]);

            // 3. Ambil FCM token user
            $fcm = DB::table('user_fcm_tokens')
                ->where('user_id', $request->userid)
                ->value('fcm_token');

            // 4. Kirim push notification jika token ada
            $pushResult = null;
            if ($fcm) {
                // $pushResult = $this->sendPushNotificationV1(
                //     $fcm, 
                //     $request->subject, 
                //     $request->message,
                //     [
                //         'email_id' => $emailId,
                //         'type' => 'email',
                //         'timestamp' => now()->toIso8601String()
                //     ]
                // );

                $pushResult = $this->sendPushNotificationV1(
                    $fcm,
                    $request->subject,
                    now(), // atau $request->date jika ada
                    [
                        'email_id' => (string)$emailId,
                        'type' => 'email',
                        'timestamp' => now()->toIso8601String()
                    ]
                );
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Email & push notification sent',
                'data' => [
                    'email_id' => (string)$emailId,
                    'push_result' => $pushResult
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error("Error in createEmailAndPush: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getDomainStatus($userid)
    {
        try {
            \Log::info('Fetching domain status for user ID: ' . $userid);

            $domainStatus = DB::table('tblhosting')
                ->where('userid', $userid)
                ->value('domainstatus');

            \Log::info('Domain status result: ' . ($domainStatus ?? 'null'));

            if ($domainStatus === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Status domain tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $domainStatus
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in getDomainStatus: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil status domain: ' . $e->getMessage()
            ], 500);
        }
    }

    public function openTicket(Request $request)
    {
        $request->validate([
            'department_id' => 'required|integer',
            'subject' => 'required|string',
            'message' => 'required|string',
            'urgency' => 'required|string|in:Low,Medium,High',
            'attachment' => 'nullable|file|mimes:jpg,jpeg,png,gif,pdf,txt|max:2048',
        ]);

        $token = $request->bearerToken();
        $tokenData = \DB::table('api_tokens')->where('token', $token)->where('expires_at', '>', now())->first();
        if (!$tokenData) {
            return response()->json([
                'status' => 'error',
                'message' => 'Token tidak valid atau sudah kadaluarsa'
            ], 401);
        }

        $client = \DB::table('tblclients')->where('id', $tokenData->client_id)->first();
        if (!$client) {
            return response()->json([
                'status' => 'error',
                'message' => 'Client tidak ditemukan'
            ], 404);
        }

        // Generate nomor tiket unik (6 digit acak, pastikan tidak duplikat)
        do {
            $tid = mt_rand(100000, 999999);
        } while (\DB::table('tbltickets')->where('tid', $tid)->exists());

        // Proses upload attachment jika ada
        $attachmentName = '';
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName(); // hanya nama file asli
            $file->move(public_path('attachments/mobilerelabs'), $attachmentName); // simpan ke public/attachments
        }

        $ticket = \App\Models\Ticket::create([
            'tid' => $tid,
            'did' => $request->department_id,
            'userid' => $client->id,
            'name' => $client->firstname . ' ' . $client->lastname,
            'email' => $client->email,
            'ipaddress' => $request->ip(),
            'date' => now(),
            'title' => $request->subject,
            'message' => $request->message,
            'status' => 'Open',
            'urgency' => $request->urgency,
            'editor' => 'markdown',
            'lastreply' => now(),
            'attachment' => $attachmentName,
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $ticket,
            'message' => 'Tiket berhasil dibuat',
        ]);
    }

    public function getTicketsByUserId($userid)
    {
        $tickets = \App\Models\Ticket::where('userid', $userid)
            ->orderBy('date', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $tickets,
            'message' => 'Daftar tiket berhasil diambil',
        ]);
    }

    public function getTicketById($id)
    {
        $ticket = \App\Models\Ticket::find($id);
        if (!$ticket) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tiket tidak ditemukan',
            ], 404);
        }
        return response()->json([
            'status' => 'success',
            'data' => $ticket,
            'message' => 'Detail tiket berhasil diambil',
        ]);
    }

    public function getTicketDetailById($id)
    {
        $ticket = \App\Models\Ticket::with(['replies', 'department'])->find($id);
        if (!$ticket) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tiket tidak ditemukan',
            ], 404);
        }
        return response()->json([
            'status' => 'success',
            'data' => [
                'ticket' => $ticket,
                'replies' => $ticket->replies,
                'department' => $ticket->department,
            ],
            'message' => 'Detail tiket lengkap berhasil diambil',
        ]);
    }

    public function getTicketRepliesByTicketId($tid)
    {
        // Ambil tiket berdasarkan tid
        $ticket = \App\Models\Ticket::with('department')->where('tid', $tid)->first();
        if (!$ticket) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tiket tidak ditemukan',
            ], 404);
        }
        // Ambil semua replies berdasarkan tid
        $replies = \DB::table('tblticketreplies')->where('tid', $tid)->orderBy('date', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'ticket' => $ticket,
                'replies' => $replies,
                'department' => $ticket->department,
            ],
            'message' => 'Detail tiket dan replies berhasil diambil',
        ]);
    }
    public function getTicketConversationByTid($tid)
    {
        // Ambil tiket utama
        $ticket = \App\Models\Ticket::with('department')->where('tid', $tid)->first();
        if (!$ticket) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tiket tidak ditemukan',
            ], 404);
        }

        // Ambil semua replies
        $replies = \DB::table('tblticketreplies')->where('tid', $tid)->orderBy('date', 'asc')->get();

        // Gabungkan pesan awal (dari tbltickets) dan semua reply
        $conversation = [];

        // Pesan awal (dari tiket)
        $conversation[] = [
            'type' => 'ticket',
            'name' => $ticket->name,
            'email' => $ticket->email,
            'message' => $ticket->message,
            'date' => $ticket->date,
            'attachment' => $ticket->attachment,
            'is_admin' => 0,
        ];

        // Semua reply (dari tblticketreplies)
        foreach ($replies as $reply) {
            $conversation[] = [
                'type' => 'reply',
                'name' => $reply->name,
                'email' => $reply->email,
                'message' => $reply->message,
                'date' => $reply->date,
                'attachment' => $reply->attachment,
                'is_admin' => $reply->admin ? 1 : 0,
            ];
        }

        // Urutkan berdasarkan tanggal (jika perlu, walau sudah diurutkan)
        usort($conversation, function ($a, $b) {
            return strtotime($a['date']) <=> strtotime($b['date']);
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'ticket' => $ticket,
                'department' => $ticket->department,
                'conversation' => $conversation,
            ],
            'message' => 'Percakapan tiket berhasil diambil',
        ]);
    }

    // public function getTicketAdminClientByTid($tid)
    // {
    //     // Ambil tiket utama berdasarkan tid
    //     $ticket = \DB::table('tbltickets')->where('tid', $tid)->first();
    //     if (!$ticket) {
    //         return response()->json([
    //             'status' => 'error',
    //             'message' => 'Tiket tidak ditemukan',
    //         ], 404);
    //     }

    //     // Ambil semua replies berdasarkan tid
    //     $replies = \DB::table('tblticketreplies')->where('tid', $tid)->orderBy('date', 'asc')->get();

    //     // Gabungkan pesan awal (dari tiket) dan semua reply
    //     $conversation = [];

    //     // Pesan awal (dari tiket)
    //     $conversation[] = [
    //         'id' => $ticket->id,
    //         'tid' => $ticket->tid,
    //         'name' => $ticket->name,
    //         'email' => $ticket->email,
    //         'date' => $ticket->date,
    //         'message' => $ticket->message,
    //         'attachment' => $ticket->attachment,
    //         'is_admin' => 0,
    //         'type' => 'ticket',
    //     ];

    //     // Semua reply (dari tblticketreplies)
    //     foreach ($replies as $reply) {
    //         $conversation[] = [
    //             'id' => $reply->id,
    //             'tid' => $reply->tid,
    //             'name' => $reply->name,
    //             'email' => $reply->email,
    //             'date' => $reply->date,
    //             'message' => $reply->message,
    //             'attachment' => $reply->attachment,
    //             'is_admin' => $reply->admin ? 1 : 0,
    //             'type' => 'reply',
    //         ];
    //     }

    //     // Urutkan berdasarkan tanggal (jaga-jaga)
    //     usort($conversation, function($a, $b) {
    //         return strtotime($a['date']) <=> strtotime($b['date']);
    //     });

    //     return response()->json([
    //         'status' => 'success',
    //         'data' => [
    //             'ticket' => $ticket,
    //             'conversation' => $conversation,
    //         ],
    //         'message' => 'Percakapan tiket berhasil diambil',
    //     ]);
    // }

    public function getTicketAdminClientByTid($tid)
    {
        // Ambil data tiket utama
        $ticket = DB::table('tbltickets')
            ->where('id', $tid)
            ->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Tiket tidak ditemukan'
            ], 404);
        }

        // Ambil pesan awal dari tiket
        $initialMessage = [
            'id' => $ticket->id,
            'tid' => $ticket->id,
            'name' => $ticket->name,
            'email' => $ticket->email,
            'date' => $ticket->date,
            'message' => $ticket->message,
            'attachment' => $ticket->attachment,
            'is_admin' => 0,
            'role' => 'Client',
            'type' => 'ticket'
        ];

        // Ambil semua balasan dari tblticketreplies
        $replies = DB::table('tblticketreplies')
            ->where('tid', $tid)
            ->select(
                'id',
                'tid',
                'name',
                'email',
                'date',
                'message',
                'attachment',
                DB::raw('CASE WHEN admin IS NOT NULL AND admin != "" THEN 1 ELSE 0 END as is_admin'),
                DB::raw('CASE WHEN admin IS NOT NULL AND admin != "" THEN "Admin" ELSE "Client" END as role'),
                DB::raw('"reply" as type')
            )
            ->get();

        // Gabungkan pesan awal dan balasan
        $conversation = collect([$initialMessage])->concat($replies)
            ->sortBy('date')
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'data' => [
                'ticket' => $ticket,
                'conversation' => $conversation
            ]
        ]);
    }

    public function getTicketConversation($tid)
    {
        // Ambil pesan awal dari tbltickets
        $ticket = DB::table('tbltickets')
            ->where('id', $tid)
            ->select(
                'id',
                'id as tid',
                'name',
                'email',
                'date',
                'message',
                'attachment',
                DB::raw('0 as is_admin'),
                DB::raw('"Client" as role'),
                DB::raw('"ticket" as type')
            );

        // Ambil semua balasan dari tblticketreplies
        $replies = DB::table('tblticketreplies')
            ->where('tid', $tid)
            ->select(
                'id',
                'tid',
                'name',
                'email',
                'date',
                'message',
                'attachment',
                DB::raw('CASE WHEN admin IS NOT NULL AND admin != "" THEN 1 ELSE 0 END as is_admin'),
                DB::raw('CASE WHEN admin IS NOT NULL AND admin != "" THEN "Admin" ELSE "Client" END as role'),
                DB::raw('"reply" as type')
            );

        // Gabungkan pesan awal dan balasan, urutkan berdasarkan tanggal
        $conversation = $ticket
            ->unionAll($replies)
            ->orderBy('date', 'asc')
            ->get();

        return response()->json([
            'conversation' => $conversation
        ]);
    }

    public function sendTicketReply(Request $request)
    {
        $request->validate([
            'tid' => 'required|integer|exists:tbltickets,id',
            'message' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:jpg,jpeg,png,gif,pdf,txt|max:5048',
        ]);

        // Validasi custom: harus ada message atau attachment
        if (empty($request->message) && !$request->hasFile('attachment')) {
            return response()->json([
                'success' => false,
                'message' => 'Pesan atau file attachment harus diisi',
            ], 422);
        }

        // Ambil user dari token jika pakai auth, atau dari request
        $user = $request->user(); // Jika pakai sanctum/jwt
        $clientName = $request->name ?? ($user ? $user->name : 'Client');
        $clientEmail = $user ? $user->email : '';

        // Proses upload attachment jika ada
        $attachmentName = '';
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $file->move(public_path('attachments'), $attachmentName);
        }

        // Simpan ke tblticketreplies
        $replyId = DB::table('tblticketreplies')->insertGetId([
            'tid' => $request->tid,
            'userid' => $user ? $user->id : 0,
            'contactid' => 0,
            'requestor_id' => 0,
            'name' => $clientName,
            'email' => $clientEmail,
            'date' => now(),
            'message' => $request->message ?? '',
            'admin' => '', // kosong artinya client
            'attachment' => $attachmentName, // simpan nama file
            'attachments_removed' => 0,
            'rating' => 0,
            'editor' => 'markdown',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Balasan berhasil dikirim',
            'reply_id' => $replyId,
        ]);
    }

    public function uploadImage(Request $request)
    {
        try {
            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
                'type' => 'nullable|string|in:profile,ticket,other'
            ]);

            $image = $request->file('image');
            $type = $request->type ?? 'other';

            // Generate unique filename
            $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();

            // Store image in storage/app/public/images
            $image->storeAs('public/images/' . $type, $filename);

            // Save to database (sederhana)
            $imageRecord = Image::create([
                'filename' => $filename,
                'original_name' => $image->getClientOriginalName(),
                'type' => $type,
                'size' => $image->getSize()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Image uploaded successfully',
                'data' => [
                    'id' => $imageRecord->id,
                    'filename' => $filename,
                    'url' => asset('storage/images/' . $type . '/' . $filename),
                    'type' => $type
                ]
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload multiple images
     */
    public function uploadMultipleImages(Request $request)
    {
        try {
            $request->validate([
                'images.*' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
                'type' => 'nullable|string|in:profile,ticket,other'
            ]);

            $images = $request->file('images');
            $type = $request->type ?? 'other';
            $uploadedImages = [];

            foreach ($images as $image) {
                // Generate unique filename
                $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();

                // Store image in storage/app/public/images
                $image->storeAs('public/images/' . $type, $filename);

                // Save to database (sederhana)
                $imageRecord = Image::create([
                    'filename' => $filename,
                    'original_name' => $image->getClientOriginalName(),
                    'type' => $type,
                    'size' => $image->getSize()
                ]);

                $uploadedImages[] = [
                    'id' => $imageRecord->id,
                    'filename' => $filename,
                    'url' => asset('storage/images/' . $type . '/' . $filename),
                    'type' => $type
                ];
            }

            return response()->json([
                'success' => true,
                'message' => count($uploadedImages) . ' images uploaded successfully',
                'data' => $uploadedImages
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload images',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete image
     */
    public function deleteImage($id)
    {
        try {
            $image = Image::findOrFail($id);

            // Delete file from storage
            if (Storage::exists($image->path)) {
                Storage::delete($image->path);
            }

            // Delete from database
            $image->delete();

            return response()->json([
                'success' => true,
                'message' => 'Image deleted successfully'
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Image not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function uploadFiles(Request $request)
    {
        try {
            $request->validate([
                'files.*' => 'required|file|mimes:pdf,txt,doc,docx,xls,xlsx,zip,rar,ppt,pptx|max:10240', // 10MB max
                'type' => 'nullable|string|in:document,other'
            ]);

            $files = $request->file('files');
            $type = $request->type ?? 'document';
            $uploadedFiles = [];

            foreach ($files as $file) {
                // Generate unique filename
                $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();

                // Store file in storage/app/public/files
                $file->storeAs('public/files/' . $type, $filename);

                // Save to database (sederhana)
                $fileRecord = Image::create([
                    'filename' => $filename,
                    'original_name' => $file->getClientOriginalName(),
                    'type' => $type,
                    'size' => $file->getSize()
                ]);

                $uploadedFiles[] = [
                    'id' => $fileRecord->id,
                    'filename' => $filename,
                    'url' => asset('storage/files/' . $type . '/' . $filename),
                    'type' => $type,
                    'original_name' => $file->getClientOriginalName()
                ];
            }

            return response()->json([
                'success' => true,
                'message' => count($uploadedFiles) . ' files uploaded successfully',
                'data' => $uploadedFiles
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload files',
                'error' => $e->getMessage()
            ], 500);
        }
    }

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

            // Cari client_id berdasarkan token
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

    private function normalizePhoneNumber($phoneNumber)
    {
        // Bersihkan dari karakter khusus
        $clean = preg_replace('/[^0-9]/', '', $phoneNumber);

        // Jika dimulai dengan 62, ubah ke format 0
        if (substr($clean, 0, 2) === '62') {
            return '0' . substr($clean, 2);
        }

        // Jika dimulai dengan +62, ubah ke format 0
        if (substr($phoneNumber, 0, 3) === '+62') {
            return '0' . substr($phoneNumber, 3);
        }

        // Jika sudah format 0, kembalikan as is
        if (substr($clean, 0, 1) === '0') {
            return $clean;
        }

        // Jika tidak ada prefix, tambahkan 0
        return '0' . $clean;
    }

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