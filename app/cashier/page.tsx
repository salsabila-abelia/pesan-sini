"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface Order {
  id: number;
  customerName: string;
  tableNumber: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string; 
  proofImage?: string;   
  paymentProof?: string;
  proof?: string;
}

export default function CashierDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState("");
  
  const [activeFilter, setActiveFilter] = useState<"ALL" | "QRIS" | "CASH">("ALL");

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // SATPAM PROTEKSI HALAMAN
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    const isValidToken = storedToken && storedToken !== "undefined" && storedToken !== "null";

    if (!isValidToken) {
      alert("Akses ditolak! Silakan login terlebih dahulu. 🛑");
      localStorage.clear();
      router.replace("/login");
      return;
    } 
    
    if (storedRole !== "CASHIER") {
      alert("Akses ditolak! Halaman ini khusus Kasir. 🛑");
      router.replace(storedRole === "ADMIN" ? "/admin" : "/login");
      return;
    } 
    
    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/order`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orderData = response.data.data || response.data;
      const sortedOrders = orderData.sort((a: any, b: any) => b.id - a.id);
      setOrders(sortedOrders);
    } catch (error) {
      console.error("Gagal mengambil data pesanan:", error);
      alert("Sesi kamu mungkin sudah habis. Silakan login kembali.");
      localStorage.clear();
      router.replace("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (orderId: number) => {
    try {
      await axios.put(`${API_URL}/order/${orderId}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Pembayaran berhasil diverifikasi!");
      fetchOrders(); 
    } catch (error) {
      alert("Gagal memverifikasi pembayaran.");
    }
  };

  const handleReject = async (orderId: number) => {
    if (!window.confirm("Yakin ingin menolak pembayaran ini?")) return;
    try {
      await axios.put(`${API_URL}/order/${orderId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Pembayaran ditolak.");
      fetchOrders(); 
    } catch (error) {
      alert("Gagal menolak pembayaran.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.replace("/login");
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  };

  const getProofUrl = (order: any) => {
    return order.paymentProof || order.proofImage || order.proof || order.payment_proof || order.receipt || null;
  };

  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Struk Order #${order.id}</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: black; font-size: 14px; max-width: 300px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h2 { margin: 0; font-size: 20px; }
              .divider { border-bottom: 2px dashed black; margin: 15px 0; }
              .row { display: flex; justify-content: space-between; margin: 8px 0; }
              .total { font-weight: bold; font-size: 16px; margin-top: 15px; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>PESAN-SINI</h2>
              <p>Jl. Contoh Restoran No. 123</p>
              <div class="divider"></div>
              <b>ORDER #${order.id}</b>
            </div>
            
            <div class="row"><span>Pelanggan:</span><span>${order.customerName}</span></div>
            <div class="row"><span>Meja:</span><span>${order.tableNumber}</span></div>
            <div class="row"><span>Metode:</span><span>${order.paymentMethod}</span></div>
            <div class="row"><span>Status:</span><span>${order.paymentStatus}</span></div>
            
            <div class="divider"></div>
            
            <div class="row total">
              <span>TOTAL:</span>
              <span>${formatRupiah(order.totalAmount)}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="footer">
              <p>Terima kasih atas kunjungan Anda!</p>
              <p>-- Salinan Dapur & Customer --</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "ALL") return true;
    return order.paymentMethod === activeFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F5F7] space-y-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <span className="font-bold text-slate-500 text-sm tracking-widest uppercase">Memuat Workspace Kasir...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans text-slate-900 selection:bg-emerald-200">
      
      <main className="p-5 md:p-8 lg:p-12 max-w-[1440px] mx-auto w-full">
        
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-1.5">
              Ruang<span className="text-emerald-600">Kasir.</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-base">
              Kelola pesanan masuk dan verifikasi pembayaran.
            </p>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="w-full md:w-auto bg-white hover:bg-red-500 text-red-500 hover:text-white border border-red-100 px-6 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 group active:scale-95"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Keluar Sistem
          </button>
        </header>

        <div className="flex flex-wrap items-center gap-2 mb-8 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-max">
          <button 
            onClick={() => setActiveFilter("ALL")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeFilter === "ALL" 
                ? "bg-slate-900 text-white shadow-md" 
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Semua Pesanan
          </button>
          
          <button 
            onClick={() => setActiveFilter("QRIS")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${
              activeFilter === "QRIS" 
                ? "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm" 
                : "text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            📱 QRIS
          </button>

          <button 
            onClick={() => setActiveFilter("CASH")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${
              activeFilter === "CASH" 
                ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm" 
                : "text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            💵 Tunai (Cash)
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] shadow-sm border border-slate-100">
            <span className="text-6xl mb-4 opacity-50">🧾</span>
            <p className="text-slate-400 font-medium">
              {activeFilter === "ALL" 
                ? "Belum ada pesanan masuk saat ini." 
                : `Tidak ada pesanan ${activeFilter} untuk saat ini.`}
            </p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 xl:gap-8 space-y-6 xl:space-y-8">
            
            {filteredOrders.map((order) => (
              <div key={order.id} className="break-inside-avoid w-full inline-block bg-white rounded-[1.5rem] p-6 sm:p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 transition-all duration-300">
                
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-5">
                  <div>
                    <span className="inline-block bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-extrabold tracking-wider uppercase mb-3">
                      Meja {order.tableNumber}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-xl leading-tight mb-1">{order.customerName}</h3>
                    <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Order #{order.id}</p>
                  </div>
                  
                  <div className="text-right flex flex-col items-end">
                    <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg tracking-widest uppercase shadow-sm mb-3 ${
                      order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                      order.paymentStatus === 'REJECTED' ? 'bg-red-50 text-red-600 border border-red-100' : 
                      'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {order.paymentStatus}
                    </span>
                    <p className="font-black text-slate-900 text-lg">{formatRupiah(order.totalAmount)}</p>
                    <div className="flex items-center gap-1 mt-1 text-slate-500">
                      <span className={`text-xs font-bold ${order.paymentMethod === 'QRIS' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                        {order.paymentMethod}
                      </span>
                      {order.paymentMethod === 'QRIS' ? <span className="text-xs">📱</span> : <span className="text-xs">💵</span>}
                    </div>
                  </div>
                </div>

                {/* PERUBAHAN: Tampilan gambar QRIS diganti menjadi tombol Cek Bukti */}
                {order.paymentMethod === "QRIS" && getProofUrl(order) && (
                  <div className="mb-6">
                    <a 
                      href={`${API_URL}/${getProofUrl(order)}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center justify-center gap-2 w-full bg-indigo-50/50 hover:bg-indigo-500 text-indigo-600 hover:text-white border border-indigo-100 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      Lihat Bukti Pembayaran
                    </a>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  {order.paymentStatus === "PENDING" || order.paymentStatus === "WAITING_CONFIRMATION" ? (
                    <>
                      <button onClick={() => handleReject(order.id)} className="flex-1 bg-white border-2 border-slate-100 text-slate-600 py-3 rounded-xl text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors active:scale-95">
                        Tolak
                      </button>
                      <button onClick={() => handleVerify(order.id)} className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-md hover:shadow-emerald-600/20 active:scale-95">
                        Terima
                      </button>
                    </>
                  ) : order.paymentStatus === "REJECTED" ? (
                    <button disabled className="w-full bg-red-50 border border-red-100 text-red-500 py-3 rounded-xl text-sm font-bold cursor-not-allowed">
                      Orderan Dibatalkan
                    </button>
                  ) : (
                    <div className="w-full flex gap-3">
                      <button disabled className="flex-1 bg-slate-50 border border-slate-100 text-slate-400 py-3 rounded-xl text-sm font-bold cursor-not-allowed hidden sm:block">
                        Diproses
                      </button>
                      <button 
                        onClick={() => handlePrint(order)} 
                        className="flex-1 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white py-3 rounded-xl text-sm font-bold transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2"
                        title="Cetak Struk"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Cetak Struk
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}