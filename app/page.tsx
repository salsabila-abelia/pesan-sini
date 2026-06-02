"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image: string;
  categoryId: number;
  category: {
    id: number;
    name: string;
  };
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function CustomerPage() {
  const router = useRouter();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [tableId, setTableId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("QRIS");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await axios.get(`${API_URL}/public/menu`);
        const menuData = response.data.data || response.data;
        setMenus(menuData);
      } catch (error) {
        console.error("Gagal mengambil data menu:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenus();
  }, [API_URL]);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  const addToCart = (menu: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === menu.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === menu.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prevCart, { ...menu, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQuantity = item.quantity + delta;
            return { ...item, quantity: newQuantity > 0 ? newQuantity : 0 };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const totalAmount = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Memproses pesanan...");

    try {
      const payload = {
        customerName: customerName,
        tableNumber: Number(tableId),
        paymentMethod: paymentMethod,
        notes: notes,
        items: cart.map((item) => ({
          menuId: item.id,
          quantity: item.quantity,
        })),
      };

      const response = await axios.post(`${API_URL}/public/order`, payload);
      const orderId = response.data.order.id;

      setCart([]);
      setIsCheckoutOpen(false);

      localStorage.setItem("lastPaymentMethod", paymentMethod);
      toast.success("Pesanan berhasil dibuat!", { id: toastId });
      router.push(`/order/${orderId}`);
    } catch (error: any) {
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.message;
        const detail = Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage;
        toast.error(`Gagal Checkout: \n${detail}`, { id: toastId });
      } else {
        toast.error("Terjadi kesalahan jaringan atau server tidak merespon.", { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const uniqueCategories = [
    "Semua",
    ...Array.from(new Set(menus.map((m) => m.category?.name).filter(Boolean))),
  ];

  const categoryPriority = ["Makanan", "Minuman", "Snack", "Dessert"];

  const filteredMenus = menus
    .filter((menu) => {
      const matchSearch = menu.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchCategory =
        activeCategory === "Semua" || menu.category?.name === activeCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      const catA = a.category?.name || "";
      const catB = b.category?.name || "";

      let indexA = categoryPriority.indexOf(catA);
      let indexB = categoryPriority.indexOf(catB);

      if (indexA === -1) indexA = 99;
      if (indexB === -1) indexB = 99;

      if (indexA !== indexB) {
        return indexA - indexB;
      }

      return a.name.localeCompare(b.name);
    });

  return (
    <div className="flex min-h-screen bg-[#F4F5F7] font-sans text-slate-900 selection:bg-emerald-200">
      <main className="flex-1 p-4 md:p-8 pb-32 lg:pb-10 max-w-[1440px] mx-auto w-full">
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Pesan<span className="text-emerald-600">Sini.</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-base mt-1.5">
              Sentuhan modern untuk hidangan favorit Anda.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-xl font-bold text-sm border border-slate-100 shadow-sm text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Siap Melayani
          </div>
        </header>

        {/* --- HERO BANNER --- */}
        <div className="w-full bg-slate-900 rounded-[2rem] p-6 md:p-10 mb-8 relative overflow-hidden flex flex-col justify-center shadow-lg shadow-slate-900/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

          <div className="relative z-10 w-full md:w-2/3">
            <span className="inline-block bg-white/10 backdrop-blur-sm text-emerald-300 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest mb-4 border border-white/10">
              Promo Spesial Hari Ini
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-3">
              Nikmati Hidangan Terbaik Tanpa Antri.
            </h2>
            <p className="text-slate-300 font-medium text-sm md:text-base mb-0">
              Pesan langsung dari meja Anda, bayar pakai QRIS, dan biarkan kami
              yang menyajikannya.
            </p>
          </div>
        </div>

        {/* --- SEARCH BAR & FILTER CATEGORY --- */}
        <div className="mb-8 space-y-4">
          <div className="relative w-full max-w-2xl">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <svg
                focusable="false"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5 text-slate-400"
              >
                <path
                  d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>

            <input
              type="text"
              placeholder="Search menu yang anda inginkan"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-24 py-3.5 bg-white border border-slate-200 hover:shadow-md focus:shadow-md rounded-full text-[15px] font-normal text-slate-700 placeholder:text-slate-500 focus:outline-none transition-shadow"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {uniqueCategories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setActiveCategory(cat as string)}
                className={`snap-start whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm ${
                  activeCategory === cat
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <span className="text-slate-500 font-medium text-sm">
              Menyiapkan hidangan...
            </span>
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <span className="text-5xl opacity-50 mb-4">🍽️</span>
            <p className="text-slate-500 font-medium text-center">
              Menu tidak ditemukan.
              <br />
              Coba kata kunci lain.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredMenus.map((menu) => {
              const randomRating = (Math.random() * (5.0 - 4.5) + 4.5).toFixed(
                1,
              );
              const randomSold = Math.floor(Math.random() * 200) + 50;

              return (
                <div
                  key={menu.id}
                  className="group bg-white p-3 md:p-4 rounded-[1.5rem] shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex flex-col transition-all duration-300"
                >
                  <div className="w-full aspect-[4/3] bg-slate-50 rounded-xl mb-4 overflow-hidden relative">
                    {menu.image ? (
                      <img
                        src={menu.image}
                        alt={menu.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl">
                        🍽️
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 uppercase tracking-wider shadow-sm">
                      {menu.category?.name || "Kategori"}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-amber-400 text-xs">⭐</span>
                      <span className="text-xs font-bold text-slate-700">
                        {randomRating}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        ({randomSold}+ terjual)
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm md:text-base leading-snug mb-1 line-clamp-2">
                      {menu.name}
                    </h3>
                    <p className="text-sm md:text-base font-black text-emerald-600 mb-5 mt-auto">
                      {formatRupiah(menu.price)}
                    </p>
                    <button
                      onClick={() => addToCart(menu)}
                      className="w-full bg-slate-900 hover:bg-emerald-600 text-white py-2.5 md:py-3 rounded-xl text-sm font-bold transition-all duration-300 active:scale-95 shadow-md hover:shadow-emerald-600/20 flex items-center justify-center gap-2"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* --- SIDEBAR KERANJANG --- */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.05)] z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:sticky lg:translate-x-0 lg:w-96 lg:border-l lg:border-slate-100 lg:shadow-none flex flex-col ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Pesanan Anda
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {cart.reduce((a, b) => a + b.quantity, 0)} hidangan terpilih
            </p>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full w-9 h-9 flex items-center justify-center font-bold transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <div className="text-5xl">🛍️</div>
              <p className="text-slate-500 font-medium text-sm">
                Belum ada pesanan.
                <br />
                Silakan pilih menu Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 items-center bg-white">
                  <div className="w-16 h-16 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100">
                    {item.image ? (
                      <img
                        src={item.image}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        🍽️
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {item.name}
                    </h4>
                    <p className="text-emerald-600 font-bold text-xs mt-1">
                      {formatRupiah(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-100">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 bg-white rounded-md shadow-sm text-slate-600 font-bold hover:text-emerald-600 transition-colors"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold w-7 text-center text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 bg-white rounded-md shadow-sm text-slate-600 font-bold hover:text-emerald-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <div className="flex justify-between items-end mb-5">
            <span className="font-semibold text-slate-500 text-sm">
              Total Pembayaran
            </span>
            <span className="font-black text-2xl text-slate-900">
              {formatRupiah(totalAmount)}
            </span>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={() => {
              setIsCheckoutOpen(true);
              setIsCartOpen(false);
            }}
            className="w-full bg-slate-900 disabled:bg-slate-200 text-white py-4 rounded-xl font-bold text-base hover:bg-emerald-600 transition-all duration-300 active:scale-[0.98] shadow-lg shadow-slate-900/20 disabled:shadow-none"
          >
            Proses Pesanan
          </button>
        </div>
      </aside>

      {!isCartOpen && cart.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:hidden bg-slate-900/95 backdrop-blur-md text-white pl-4 pr-6 py-3 rounded-full shadow-2xl z-30 active:scale-95 transition-transform flex items-center gap-4 border border-slate-700 w-auto whitespace-nowrap"
        >
          <div className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-inner">
            {cart.reduce((a, b) => a + b.quantity, 0)}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
              Total
            </span>
            <span className="font-bold text-sm leading-tight">
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </button>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center sm:p-4 transition-opacity">
          <div className="bg-white rounded-t-[2rem] sm:rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-[slideUp_0.3s_ease-out]">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>

            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
              Detail Checkout
            </h2>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              Selesaikan langkah terakhir untuk pesanan Anda.
            </p>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nama Pemesan
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white focus:ring-0 focus:border-slate-900 outline-none transition-colors"
                  placeholder="Masukkan nama Anda"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nomor Meja
                </label>
                <input
                  type="number"
                  required
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white focus:ring-0 focus:border-slate-900 outline-none transition-colors"
                  placeholder="Contoh: 4"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Metode Pembayaran
                </label>
                <div className="relative">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border-2 border-slate-100 rounded-xl pl-4 pr-10 py-3.5 text-sm font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-0 focus:border-slate-900 outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="QRIS">📱 QRIS (Cepat & Praktis)</option>
                    <option value="CASH">💵 Tunai (Bayar di Kasir)</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg
                      className="w-5 h-5 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white focus:ring-0 focus:border-slate-900 outline-none transition-colors resize-none"
                  placeholder="Contoh: Jangan pakai bawang, ekstra pedas..."
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-1/3 bg-slate-100 text-slate-600 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors disabled:bg-slate-300 disabled:text-slate-500 shadow-lg shadow-slate-900/20"
                >
                  {isSubmitting ? "Memproses..." : "Konfirmasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `,
        }}
      />
    </div>
  );
}