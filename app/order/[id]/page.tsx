"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [paymentMethod, setPaymentMethod] = useState<string>("QRIS"); 
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    const savedMethod = localStorage.getItem("lastPaymentMethod");
    if (savedMethod) {
      setPaymentMethod(savedMethod);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return alert("Pilih gambar bukti transfer terlebih dahulu!");

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile); 

      await axios.post(`${API_URL}/public/order/${orderId}/upload-proof`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadSuccess(true);
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 404) {
          alert(`Error 404: Endpoint tidak ditemukan.`);
        } else if (error.response.data) {
          const errorMessage = error.response.data.message;
          alert(`Gagal Upload: \n${Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage}`);
        }
      } else {
        alert("Gagal mengunggah bukti QRIS. Cek koneksi internet atau server.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] p-4 md:p-8 flex items-center justify-center font-sans selection:bg-emerald-200">
      <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
        
        {/* Hiasan background abstrak di pojok (opsional, menambah kesan elegan) */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-50 rounded-tr-full -z-10 opacity-50"></div>

        <div className="text-center mb-6">
          <div className="bg-slate-900 text-white w-20 h-20 rounded-[1.25rem] flex items-center justify-center mx-auto mb-6 text-3xl font-black shadow-lg shadow-slate-900/20">
            #{orderId}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Pesanan Diterima</h1>
        </div>

        {/* LOGIKA PERCABANGAN UI BERDASARKAN METODE PEMBAYARAN */}
        {paymentMethod === "CASH" ? (
          
          // --- TAMPILAN JIKA CASH (ELEGAN) ---
          <div className="text-center bg-slate-50 border border-slate-100 rounded-[1.5rem] p-6 mt-8">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">💵</div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Pembayaran Tunai</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
              Silakan menuju meja kasir dan sebutkan nomor pesanan Anda <strong className="text-slate-900">(#{orderId})</strong> untuk melakukan pembayaran agar pesanan segera diproses.
            </p>
            <button 
              onClick={() => router.push("/")}
              className="w-full bg-slate-900 text-white px-6 py-4 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all duration-300 shadow-md hover:shadow-emerald-600/20 active:scale-95"
            >
              Kembali ke Menu Utama
            </button>
          </div>

        ) : (

          // --- TAMPILAN JIKA QRIS (FORM UPLOAD ELEGAN) ---
          <div className="mt-4">
            {!uploadSuccess && (
              <p className="text-slate-500 text-sm text-center mb-6 font-medium">
                Selesaikan pembayaran menggunakan QRIS dan unggah buktinya di bawah ini agar pesanan segera diproses.
              </p>
            )}

            {uploadSuccess ? (
              <div className="text-center p-6 bg-emerald-50 border border-emerald-100 rounded-[1.5rem] mt-6">
                <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-md shadow-emerald-500/30">✓</div>
                <h2 className="text-lg font-extrabold text-emerald-800 mb-2">Bukti Terkirim!</h2>
                <p className="text-emerald-700/80 text-sm mb-8 font-medium">Kasir sedang memverifikasi pembayaran Anda. Silakan tunggu di meja.</p>
                <button 
                  onClick={() => router.push("/")}
                  className="w-full bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-md active:scale-95"
                >
                  Kembali ke Menu
                </button>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="space-y-6">
                <label className="block w-full border-2 border-dashed border-slate-300 rounded-[1.5rem] p-4 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 bg-slate-50 transition-all">
                  {previewUrl ? (
                    <div className="relative rounded-xl overflow-hidden shadow-sm">
                      <img src={previewUrl} alt="Preview Bukti" className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity font-bold backdrop-blur-sm">
                        Ganti Gambar
                      </div>
                    </div>
                  ) : (
                    <div className="py-8">
                      <span className="text-4xl mb-3 block opacity-80">📸</span>
                      <span className="text-slate-700 font-bold text-sm">Tap untuk pilih foto bukti</span>
                      <p className="text-xs text-slate-400 mt-2 font-medium">Format: JPG, PNG, WEBP (Max 2MB)</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>

                <button 
                  type="submit" disabled={!selectedFile || isUploading}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-md disabled:shadow-none hover:shadow-emerald-600/20 flex justify-center items-center active:scale-95"
                >
                  {isUploading ? "Mengunggah..." : "Kirim Bukti Pembayaran"}
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}