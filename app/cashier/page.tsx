"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface OrderItem {
  id: number;
  quantity: number;
  menu: {
    name: string;
    price: number;
  };
}

interface Order {
  id: number;
  customerName: string;
  // --- PERBAIKAN STRUKTUR MEJA ---
  table?: {
    tableNumber: number;
  };
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string; 
  proofImage?: string;   
  paymentProof?: string;
  proof?: string;
  notes?: string;
  orderItems?: OrderItem[]; 
}

export default function CashierDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState("");
  
  const [activeFilter, setActiveFilter] = useState<"ALL" | "QRIS" | "CASH" | "CANCELLED">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [orderToReject, setOrderToReject] = useState<number | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    const isValidToken = storedToken && storedToken !== "undefined" && storedToken !== "null";

    if (!isValidToken) {
      toast.error("Akses ditolak! Silakan login terlebih dahulu. 🛑");
      localStorage.clear();
      router.replace("/login");
      return;
    } 
    
    if (storedRole !== "CASHIER") {
      toast.error("Akses ditolak! Halaman ini khusus Kasir. 🛑");
      router.replace(storedRole === "ADMIN" ? "/admin" : "/login");
      return;
    } 
    
    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (token) {
      fetchOrders();
      const intervalId = setInterval(fetchOrders, 10000); 
      return () => clearInterval(intervalId);
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
      
      if (selectedOrder) {
        const updatedSelected = sortedOrders.find((o: Order) => o.id === selectedOrder.id);
        if (updatedSelected) setSelectedOrder(updatedSelected);
      }
    } catch (error) {
      console.error("Gagal mengambil data pesanan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.MouseEvent, orderId: number) => {
    e.stopPropagation(); 
    const toastId = toast.loading("Memverifikasi pembayaran...");
    try {
      await axios.put(`${API_URL}/order/${orderId}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Pembayaran berhasil diverifikasi!", { id: toastId });
      fetchOrders(); 
    } catch (error) {
      toast.error("Gagal memverifikasi pembayaran.", { id: toastId });
    }
  };

  const executeReject = async () => {
    if (!orderToReject) return;
    setIsRejecting(true);
    const toastId = toast.loading("Membatalkan pesanan...");
    try {
      await axios.put(`${API_URL}/order/${orderToReject}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Pesanan berhasil ditolak / dibatalkan.", { id: toastId });
      fetchOrders(); 
      setOrderToReject(null); 
    } catch (error) {
      toast.error("Gagal menolak pesanan.", { id: toastId });
    } finally {
      setIsRejecting(false);
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
    const path = order.paymentProof || order.proofImage || order.proof || order.payment_proof || order.receipt || null;
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_URL}/${path}`;
  };

  const handlePrint = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      const itemsHtml = order.orderItems && order.orderItems.length > 0 
        ? order.orderItems.map(item => `
            <div class="row">
              <span>${item.quantity}x ${item.menu?.name || 'Menu'}</span>
              <span>${formatRupiah((item.menu?.price || 0) * item.quantity)}</span>
            </div>
          `).join('')
        : '<div class="row" style="text-align: center; color: #666;"><i>(Detail menu tidak tersedia)</i></div>';

      const notesHtml = order.notes 
        ? `<div class="divider"></div>
           <div style="font-weight: bold; margin-bottom: 4px;">CATATAN:</div>
           <div style="font-style: italic;">${order.notes}</div>` 
        : '';

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
            <div class="row"><span>Meja:</span><span>${order.table?.tableNumber || '-'}</span></div>
            <div class="row"><span>Metode:</span><span>${order.paymentMethod}</span></div>
            
            ${notesHtml}

            <div class="divider"></div>
            
            <div style="font-weight: bold; margin-bottom: 8px;">PESANAN:</div>
            ${itemsHtml}
            
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
    if (activeFilter === "ALL") return order.paymentStatus !== "REJECTED" && order.paymentStatus !== "CANCELLED";
    if (activeFilter === "CANCELLED") return order.paymentStatus === "REJECTED" || order.paymentStatus === "CANCELLED";
    return order.paymentMethod === activeFilter && order.paymentStatus !== "REJECTED" && order.paymentStatus !== "CANCELLED";
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
      
      {orderToReject !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-[slideUp_0.2s_ease-out]">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⚠️</div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Tolak Pesanan?</h3>
            <p className="text-slate-500 text-center text-sm font-medium mb-6">
              Apakah Anda yakin ingin membatalkan pesanan <span className="font-bold text-slate-700">#{orderToReject}</span> ini? Aksi ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setOrderToReject(null)}
                className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={executeReject}
                disabled={isRejecting}
                className="flex-1 bg-red-500 text-white hover:bg-red-600 py-3 rounded-xl text-sm font-bold transition-all disabled:bg-slate-300 disabled:text-slate-500 active:scale-95"
              >
                {isRejecting ? "Memproses..." : "Ya, Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-slate-900 text-white p-6 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Ruang<span className="text-emerald-500">Kasir.</span>
          </h1>
          <p className="text-slate-400 font-medium text-xs mt-1">
            Kelola pesanan masuk dan verifikasi pembayaran.
          </p>
        </div>
        <button onClick={handleLogout} className="bg-slate-800 hover:bg-red-500 text-slate-300 hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group active:scale-95">
          Keluar Sistem
        </button>
      </header>

      <main className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        <div className="flex-1 w-full">
          <div className="flex flex-wrap items-center gap-2 mb-6 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-max">
            <button onClick={() => setActiveFilter("ALL")} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeFilter === "ALL" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}>
              Aktif & Selesai
            </button>
            <button onClick={() => setActiveFilter("QRIS")} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all border ${activeFilter === "QRIS" ? "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm" : "text-slate-500 border-transparent hover:bg-slate-50"}`}>
              📱 QRIS
            </button>
            <button onClick={() => setActiveFilter("CASH")} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all border ${activeFilter === "CASH" ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm" : "text-slate-500 border-transparent hover:bg-slate-50"}`}>
              💵 Tunai
            </button>
            <div className="w-px h-5 bg-slate-200 mx-1"></div>
            <button onClick={() => setActiveFilter("CANCELLED")} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all border ${activeFilter === "CANCELLED" ? "bg-red-50 text-red-600 border-red-100 shadow-sm" : "text-slate-400 border-transparent hover:bg-red-50"}`}>
              Dibatalkan
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] shadow-sm border border-slate-100">
              <span className="text-5xl mb-4 opacity-50">🧾</span>
              <p className="text-slate-400 font-medium">Tidak ada pesanan di kategori ini.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                
                const isQrisUnpaid = order.paymentMethod === "QRIS" && (order.paymentStatus === "PENDING" || (order.paymentStatus === "WAITING_CONFIRMATION" && !getProofUrl(order)));
                
                let displayStatus = order.paymentStatus;
                if (order.paymentStatus === 'REJECTED') displayStatus = 'DIBATALKAN';
                if (isQrisUnpaid) displayStatus = 'MENUNGGU PEMBAYARAN';

                return (
                <div key={order.id} onClick={() => setSelectedOrder(order)} className={`w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isSelected ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-100 hover:border-slate-300'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border shrink-0 transition-colors ${isSelected ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
                      <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>Meja</span>
                      {/* --- PERBAIKAN MEJA CARD KIRI --- */}
                      <span className="text-xl font-black leading-none">{order.table?.tableNumber || '-'}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{order.customerName}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">#{order.id}</span>
                        <div className="flex items-center gap-1 text-slate-500">
                          {order.paymentMethod === 'QRIS' ? <span className="text-[10px]">📱</span> : <span className="text-[10px]">💵</span>}
                          <span className={`text-[10px] font-bold ${order.paymentMethod === 'QRIS' ? 'text-indigo-600' : 'text-emerald-600'}`}>{order.paymentMethod}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end justify-center text-left sm:text-right">
                    <span className={`text-[9px] font-extrabold px-2 py-1 rounded-md tracking-widest uppercase mb-1 w-max sm:ml-auto ${
                        order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                        order.paymentStatus === 'CANCELLED' || order.paymentStatus === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {displayStatus}
                    </span>
                    <p className="font-black text-slate-900 text-lg">{formatRupiah(order.totalAmount)}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t sm:border-0 border-slate-100 w-full sm:w-auto">
                    {isQrisUnpaid ? (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 flex-1 sm:flex-none text-center animate-pulse">
                        Menunggu Bukti...
                      </span>
                    ) : order.paymentStatus === "PENDING" || order.paymentStatus === "WAITING_CONFIRMATION" ? (
                      <>
                        {order.paymentMethod === "QRIS" && getProofUrl(order) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(getProofUrl(order) as string, "_blank");
                            }}
                            className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all flex-1 sm:flex-none active:scale-95 shadow-sm"
                          >
                            Cek Bukti
                          </button>
                        )}
                        
                        <button onClick={(e) => { e.stopPropagation(); setOrderToReject(order.id); }} className="bg-red-50 text-red-600 border border-red-100 px-5 py-2 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all flex-1 sm:flex-none active:scale-95 shadow-sm">
                          Tolak
                        </button>
                        <button onClick={(e) => handleVerify(e, order.id)} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all flex-1 sm:flex-none active:scale-95 shadow-sm">
                          Terima
                        </button>
                      </>
                    ) : order.paymentStatus === "CANCELLED" || order.paymentStatus === "REJECTED" ? (
                        <span className="text-[10px] font-bold text-red-400 bg-red-50 px-3 py-2 rounded-xl border border-red-100 flex-1 sm:flex-none text-center">Dibatalkan</span>
                    ) : (
                      <>
                        {order.paymentMethod === "QRIS" && getProofUrl(order) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(getProofUrl(order) as string, "_blank");
                            }}
                            className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all flex-1 sm:flex-none active:scale-95 shadow-sm"
                          >
                            Cek Bukti
                          </button>
                        )}
                        <button onClick={(e) => handlePrint(e, order)} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-none active:scale-95">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                          Struk
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>

        <aside className="w-full lg:w-[380px] xl:w-[420px] shrink-0 sticky top-[104px]">
          {!selectedOrder ? (
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-24 h-24 bg-emerald-50 border-4 border-white shadow-lg text-emerald-500 rounded-full flex items-center justify-center text-4xl mb-5">👨‍💻</div>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-3">{today}</span>
              <h3 className="font-extrabold text-slate-900 text-2xl mb-2">Kasir Bertugas</h3>
              <p className="text-slate-500 text-sm leading-relaxed px-4">Pilih salah satu kartu pesanan di sebelah kiri untuk melihat rincian menu yang dipesan oleh pelanggan.</p>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-140px)] animate-[slideUp_0.3s_ease-out]">
              <div className="bg-slate-900 text-white p-6 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Order #{selectedOrder.id}</span>
                    <h2 className="text-2xl font-black">{selectedOrder.customerName}</h2>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-center">
                    <span className="block text-[9px] text-slate-300 font-bold uppercase tracking-widest">Meja</span>
                    {/* --- PERBAIKAN MEJA CARD KANAN --- */}
                    <span className="block text-2xl font-black text-emerald-400 leading-none">{selectedOrder.table?.tableNumber || '-'}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Rincian Pesanan</h4>
                
                {selectedOrder.notes && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <span className="block text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1">Catatan Pelanggan:</span>
                    <p className="text-sm font-medium text-amber-900">{selectedOrder.notes}</p>
                  </div>
                )}

                {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 ? (
                  <div className="space-y-4">
                    {selectedOrder.orderItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center font-bold text-sm">{item.quantity}x</div>
                          <span className="font-bold text-slate-700 text-sm">{item.menu?.name || 'Menu'}</span>
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{formatRupiah(item.menu?.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <span className="text-3xl opacity-30 mb-2 block">🍽️</span>
                    <p className="text-sm text-slate-400 font-medium">Detail item tidak dikirim oleh server database.</p>
                    <p className="text-[10px] text-slate-300 mt-1">(Pastikan backend melakukan include OrderItem)</p>
                  </div>
                )}
                {selectedOrder.paymentMethod === "QRIS" && getProofUrl(selectedOrder) && (
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <a href={getProofUrl(selectedOrder) as string} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-indigo-50 hover:bg-indigo-500 text-indigo-600 hover:text-white border border-indigo-100 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      Lihat Bukti Transfer QRIS
                    </a>
                  </div>
                )}
              </div>
              <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                <div className="flex justify-between items-center mb-5">
                  <span className="font-bold text-slate-500">Total Pembayaran</span>
                  <span className="font-black text-2xl text-slate-900">{formatRupiah(selectedOrder.totalAmount)}</span>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors">
                  Tutup Rincian
                </button>
              </div>
            </div>
          )}
        </aside>
      </main>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </div>
  );
}