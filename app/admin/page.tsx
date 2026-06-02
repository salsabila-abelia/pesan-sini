"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Table {
  id: number;
  tableNumber: number;
  status?: string;
}
interface Category {
  id: number;
  name: string;
}
interface Menu {
  id: number;
  name: string;
  price: number;
  image: string;
  categoryId: number;
  category?: Category;
}

// --- TAMBAHAN INTERFACE UNTUK REPORT ---
interface Order {
  id: number;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  customerName?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("TABLE");
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState("");

  const [tables, setTables] = useState<Table[]>([]);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const [menus, setMenus] = useState<Menu[]>([]);

  const [editingMenuId, setEditingMenuId] = useState<number | null>(null);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuPrice, setNewMenuPrice] = useState("");
  const [newMenuCategoryId, setNewMenuCategoryId] = useState("");
  const [newMenuImage, setNewMenuImage] = useState<File | null>(null);
  const [isSubmittingMenu, setIsSubmittingMenu] = useState(false);

  // --- STATE UNTUK REPORT & FILTER ---
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [dailyIncome, setDailyIncome] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [yearlyIncome, setYearlyIncome] = useState(0);
  const [reportFilter, setReportFilter] = useState<"ALL" | "TODAY" | "MONTH" | "YEAR">("ALL");

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    const isValidToken =
      storedToken && storedToken !== "undefined" && storedToken !== "null";

    if (!isValidToken) {
      toast.error("Akses ditolak! Silakan login terlebih dahulu. 🛑");
      localStorage.clear();
      router.replace("/login");
      return;
    }

    if (storedRole !== "ADMIN") {
      toast.error("Akses ditolak! Halaman ini khusus Admin. 🛑");
      router.replace(storedRole === "CASHIER" ? "/cashier" : "/login");
      return;
    }

    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (token) {
      fetchTables();
      fetchCategories();
      fetchMenus();
      fetchOrdersForReport(); // Panggil Data Report
    }
  }, [token]);

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API_URL}/table`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        params: { t: new Date().getTime() },
      });
      setTables(response.data.data || response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTable(true);
    try {
      await axios.post(
        `${API_URL}/table`,
        { tableNumber: Number(newTableNumber), status: "EMPTY" },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNewTableNumber("");
      toast.success("Meja berhasil ditambahkan!");
      fetchTables();
    } catch (error) {
      toast.error("Gagal menambah meja.");
    } finally {
      setIsSubmittingTable(false);
    }
  };

  const handleDeleteTable = (id: number) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-bold text-slate-800 m-0">Yakin ingin menghapus meja ini?</p>
          <div className="flex gap-2 justify-end">
            <button
              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
              onClick={() => toast.dismiss(t.id)}
            >
              Batal
            </button>
            <button
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await axios.delete(`${API_URL}/table/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  toast.success("Meja berhasil dihapus!");
                  fetchTables();
                } catch (error) {
                  toast.error("Gagal menghapus meja.");
                }
              }}
            >
              Hapus
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, id: `delete-table-${id}` }
    );
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/category`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        params: { t: new Date().getTime() },
      });
      setCategories(response.data.data || response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCategory(true);
    try {
      await axios.post(
        `${API_URL}/category`,
        { name: newCategoryName },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNewCategoryName("");
      toast.success("Kategori berhasil ditambahkan!");
      fetchCategories();
    } catch (error) {
      toast.error("Gagal menambah kategori.");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = (id: number) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-bold text-slate-800 m-0">Yakin ingin menghapus kategori ini?</p>
          <div className="flex gap-2 justify-end">
            <button
              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
              onClick={() => toast.dismiss(t.id)}
            >
              Batal
            </button>
            <button
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await axios.delete(`${API_URL}/category/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  toast.success("Kategori berhasil dihapus!");
                  fetchCategories();
                } catch (error) {
                  toast.error("Gagal menghapus kategori.");
                }
              }}
            >
              Hapus
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, id: `delete-category-${id}` }
    );
  };

  const fetchMenus = async () => {
    try {
      const response = await axios.get(`${API_URL}/menu`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        params: { t: new Date().getTime() },
      });
      const menuData = response.data.data || response.data;
      const sortedMenus = menuData.sort((a: Menu, b: Menu) => b.id - a.id);
      setMenus(sortedMenus);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitMenu = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingMenuId && !newMenuImage) {
      return toast.error("Gambar menu wajib diisi untuk menu baru!");
    }

    setIsSubmittingMenu(true);
    const toastId = toast.loading("Memproses menu...");

    try {
      if (editingMenuId) {
        if (newMenuImage) {
          const formData = new FormData();
          formData.append("name", newMenuName);
          formData.append("price", newMenuPrice);
          formData.append("categoryId", newMenuCategoryId);
          formData.append("image", newMenuImage);

          await axios.patch(`${API_URL}/menu/${editingMenuId}`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });
        } else {
          const jsonData = {
            name: newMenuName,
            price: Number(newMenuPrice),
            categoryId: Number(newMenuCategoryId),
          };
          await axios.patch(`${API_URL}/menu/${editingMenuId}`, jsonData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
        }
        toast.success("Menu berhasil diperbarui!", { id: toastId });
      } else {
        const formData = new FormData();
        formData.append("name", newMenuName);
        formData.append("price", newMenuPrice);
        formData.append("categoryId", newMenuCategoryId);
        formData.append("image", newMenuImage as File);

        await axios.post(`${API_URL}/menu`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Menu berhasil ditambahkan!", { id: toastId });
      }

      resetMenuForm();
      fetchMenus();
    } catch (error: any) {
      console.error("Detail Error:", error.response?.data || error.message);
      toast.error(
        editingMenuId
          ? "Gagal memperbarui menu. Cek kembali form kamu."
          : "Gagal menambah menu. Pastikan harga berupa angka.",
        { id: toastId }
      );
    } finally {
      setIsSubmittingMenu(false);
    }
  };

  const handleEditClick = (menu: Menu) => {
    setEditingMenuId(menu.id);
    setNewMenuName(menu.name);
    setNewMenuPrice(menu.price.toString());
    setNewMenuCategoryId(menu.categoryId.toString());
    setNewMenuImage(null);

    const fileInput = document.getElementById(
      "image-upload",
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetMenuForm = () => {
    setEditingMenuId(null);
    setNewMenuName("");
    setNewMenuPrice("");
    setNewMenuCategoryId("");
    setNewMenuImage(null);
    const fileInput = document.getElementById(
      "image-upload",
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleDeleteMenu = (id: number) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-bold text-slate-800 m-0">Yakin ingin menghapus menu ini?</p>
          <div className="flex gap-2 justify-end">
            <button
              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
              onClick={() => toast.dismiss(t.id)}
            >
              Batal
            </button>
            <button
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await axios.delete(`${API_URL}/menu/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  toast.success("Menu berhasil dihapus!");
                  fetchMenus();
                } catch (error) {
                  toast.error("Gagal menghapus menu.");
                }
              }}
            >
              Hapus
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, id: `delete-menu-${id}` }
    );
  };

  // --- FUNGSI REPORT & CHART ---
  const fetchOrdersForReport = async () => {
    try {
      const response = await axios.get(`${API_URL}/order`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ordersData: Order[] = response.data.data || response.data;
      setAllOrders(ordersData);
      calculateIncome(ordersData);
    } catch (error) {
      console.error("Gagal mengambil data report:", error);
    }
  };

  const calculateIncome = (orders: Order[]) => {
    const now = new Date();
    let daily = 0;
    let monthly = 0;
    let yearly = 0;

    orders.forEach(order => {
      if (order.paymentStatus === "PAID") {
        const orderDate = new Date(order.createdAt);
        
        if (orderDate.toDateString() === now.toDateString()) {
          daily += order.totalAmount;
        }
        if (orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()) {
          monthly += order.totalAmount;
        }
        if (orderDate.getFullYear() === now.getFullYear()) {
          yearly += order.totalAmount;
        }
      }
    });

    setDailyIncome(daily);
    setMonthlyIncome(monthly);
    setYearlyIncome(yearly);
  };

  // Fungsi Logika Chart Batang (7 Hari Terakhir)
  const getChartData = () => {
    const paidOrders = allOrders.filter(o => o.paymentStatus === "PAID");
    // --- PERBAIKAN TYPESCRIPT: MENAMBAHKAN TIPE DATA PADA ARRAY DAYS ---
    const days: { dateString: string; label: string; amount: number }[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      days.push({
        dateString: d.toDateString(),
        label: d.toLocaleDateString("id-ID", { weekday: "short" }),
        amount: 0
      });
    }
    
    paidOrders.forEach(order => {
      const orderDateStr = new Date(order.createdAt).toDateString();
      const dayMatch = days.find(d => d.dateString === orderDateStr);
      if (dayMatch) {
        dayMatch.amount += order.totalAmount;
      }
    });
    
    const maxAmount = Math.max(...days.map(d => d.amount), 1); // Hindari dibagi 0
    
    return days.map(d => ({
      ...d,
      percentage: (d.amount / maxAmount) * 100
    }));
  };

  const getFilteredReportOrders = () => {
    const now = new Date();
    let filtered = allOrders.filter(o => o.paymentStatus === "PAID");

    if (reportFilter === "TODAY") {
      filtered = filtered.filter(o => new Date(o.createdAt).toDateString() === now.toDateString());
    } else if (reportFilter === "MONTH") {
      filtered = filtered.filter(o => {
        const d = new Date(o.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (reportFilter === "YEAR") {
      filtered = filtered.filter(o => new Date(o.createdAt).getFullYear() === now.getFullYear());
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const handleExportCSV = () => {
    const paidOrders = getFilteredReportOrders();
    if (paidOrders.length === 0) return toast.error("Tidak ada data untuk diexport");

    let csvContent = "ID Pesanan;Tanggal;Pelanggan;Total Bayar\n";

    paidOrders.forEach(row => {
      const date = new Date(row.createdAt).toLocaleDateString("id-ID");
      const customer = row.customerName || 'Guest';
      csvContent += `${row.id};${date};${customer};${row.totalAmount}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Penghasilan_${new Date().toLocaleDateString('id-ID')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.replace("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F5F7] space-y-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <span className="font-bold text-slate-500 text-sm tracking-widest uppercase">
          Memuat Admin Panel...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans flex flex-col md:flex-row text-slate-900 selection:bg-emerald-200 print:bg-white">
      <aside className="w-full md:w-72 bg-slate-900 text-slate-300 p-6 flex flex-col min-h-screen flex-shrink-0 shadow-2xl z-10 print:hidden">
        <div className="mb-10 mt-4 px-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
            Pesan<span className="text-emerald-500">Sini.</span>
          </h1>
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
            Admin Workspace
          </p>
        </div>

        <nav className="flex-1 space-y-3">
          <div
            onClick={() => setActiveTab("TABLE")}
            className={`px-5 py-4 rounded-2xl font-bold cursor-pointer transition-all flex items-center gap-3 ${activeTab === "TABLE" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "hover:bg-slate-800 hover:text-white"}`}
          >
            <span className="text-xl">🍽️</span> Kelola Meja
          </div>

          <div
            onClick={() => setActiveTab("CATEGORY")}
            className={`px-5 py-4 rounded-2xl font-bold cursor-pointer transition-all flex items-center gap-3 ${activeTab === "CATEGORY" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "hover:bg-slate-800 hover:text-white"}`}
          >
            <span className="text-xl">📑</span> Kelola Kategori
          </div>

          <div
            onClick={() => setActiveTab("MENU")}
            className={`px-5 py-4 rounded-2xl font-bold cursor-pointer transition-all flex items-center gap-3 ${activeTab === "MENU" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "hover:bg-slate-800 hover:text-white"}`}
          >
            <span className="text-xl">🍔</span> Kelola Menu
          </div>

          <div
            onClick={() => { setActiveTab("REPORT"); fetchOrdersForReport(); }}
            className={`px-5 py-4 rounded-2xl font-bold cursor-pointer transition-all flex items-center gap-3 ${activeTab === "REPORT" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "hover:bg-slate-800 hover:text-white"}`}
          >
            <span className="text-xl">📈</span> Laporan
          </div>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-8 bg-slate-800 text-slate-300 hover:bg-red-500 hover:text-white px-5 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group"
        >
          <svg
            className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            ></path>
          </svg>
          Keluar
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto print:p-0">
        {activeTab === "TABLE" && (
          <div className="animate-[slideUp_0.3s_ease-out]">
            <div className="mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900">
                Manajemen Meja
              </h2>
              <p className="text-slate-500 mt-2 font-medium">
                Atur ketersediaan nomor meja untuk pelanggan Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-white p-8 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                  <h3 className="font-extrabold text-lg mb-6 text-slate-900">
                    Tambah Meja
                  </h3>
                  <form onSubmit={handleAddTable} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Nomor Meja
                      </label>
                      <input
                        type="number"
                        required
                        value={newTableNumber}
                        onChange={(e) => setNewTableNumber(e.target.value)}
                        className="w-full border-2 border-slate-100 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white focus:ring-0 focus:border-slate-900 outline-none transition-colors"
                        placeholder="Contoh: 1, 2, 3..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingTable}
                      className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-emerald-600 disabled:bg-slate-300 disabled:text-slate-500 transition-all shadow-md active:scale-95"
                    >
                      {isSubmittingTable ? "Menyimpan..." : "Simpan Meja"}
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white p-8 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                  <h3 className="font-extrabold text-lg mb-6 text-slate-900">
                    Daftar Meja Aktif
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {tables.map((table) => (
                      <div
                        key={table.id}
                        className="border-2 border-slate-100 rounded-[1.25rem] p-6 flex flex-col items-center justify-center relative group hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 transition-all bg-white overflow-hidden"
                      >
                        <span className="text-4xl font-black text-slate-800 mb-1">
                          {table.tableNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                          Meja
                        </span>

                        <div className="absolute inset-0 bg-red-500/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDeleteTable(table.id)}
                            className="bg-white text-red-600 font-bold px-4 py-2 rounded-lg text-sm shadow-sm hover:scale-105 transition-transform"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "CATEGORY" && (
          <div className="animate-[slideUp_0.3s_ease-out]">
            <div className="mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900">
                Manajemen Kategori
              </h2>
              <p className="text-slate-500 mt-2 font-medium">
                Kelompokkan menu agar lebih rapi dan mudah dicari.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-white p-8 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                  <h3 className="font-extrabold text-lg mb-6 text-slate-900">
                    Tambah Kategori
                  </h3>
                  <form onSubmit={handleAddCategory} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Nama Kategori
                      </label>
                      <input
                        type="text"
                        required
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full border-2 border-slate-100 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white focus:ring-0 focus:border-slate-900 outline-none transition-colors"
                        placeholder="Misal: Minuman Dingin..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingCategory}
                      className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-emerald-600 disabled:bg-slate-300 disabled:text-slate-500 transition-all shadow-md active:scale-95"
                    >
                      {isSubmittingCategory
                        ? "Menyimpan..."
                        : "Simpan Kategori"}
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white p-8 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                  <h3 className="font-extrabold text-lg mb-6 text-slate-900">
                    Daftar Kategori
                  </h3>
                  {categories.length === 0 ? (
                    <p className="text-slate-400 text-center py-10 font-medium">
                      Belum ada kategori terdaftar.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex justify-between items-center border-2 border-slate-100 p-5 rounded-2xl hover:border-slate-300 transition-colors bg-slate-50/50"
                        >
                          <span className="font-bold text-slate-800">
                            {cat.name}
                          </span>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-red-500 hover:text-white bg-white hover:bg-red-500 border border-red-100 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "MENU" && (
          <div className="animate-[slideUp_0.3s_ease-out]">
            <div className="mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900">
                Manajemen Menu
              </h2>
              <p className="text-slate-500 mt-2 font-medium">
                Tambah dan atur hidangan yang akan tampil di aplikasi pelanggan.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-1">
                <div
                  className={`p-8 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border transition-colors ${editingMenuId ? "bg-amber-50/30 border-amber-200" : "bg-white border-slate-100"}`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-extrabold text-lg text-slate-900">
                      {editingMenuId ? "Update Menu" : "Tambah Menu Baru"}
                    </h3>
                    {editingMenuId && (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        Mode Edit
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSubmitMenu} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Nama Menu
                      </label>
                      <input
                        type="text"
                        required
                        value={newMenuName}
                        onChange={(e) => setNewMenuName(e.target.value)}
                        className="w-full border-2 border-slate-100 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white focus:ring-0 focus:border-slate-900 outline-none transition-colors"
                        placeholder="Nasi Goreng Spesial"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Harga (Rp)
                      </label>
                      <input
                        type="number"
                        required
                        value={newMenuPrice}
                        onChange={(e) => setNewMenuPrice(e.target.value)}
                        className="w-full border-2 border-slate-100 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white focus:ring-0 focus:border-slate-900 outline-none transition-colors"
                        placeholder="25000"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Kategori
                      </label>
                      <div className="relative">
                        <select
                          required
                          value={newMenuCategoryId}
                          onChange={(e) => setNewMenuCategoryId(e.target.value)}
                          className="w-full border-2 border-slate-100 rounded-xl pl-4 pr-10 py-3.5 text-sm font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-0 focus:border-slate-900 outline-none transition-colors appearance-none cursor-pointer"
                        >
                          <option value="" disabled>
                            Pilih Kategori...
                          </option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                          <svg
                            className="w-5 h-5 text-slate-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
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
                        Gambar Menu{" "}
                        {editingMenuId && (
                          <span className="text-amber-600 lowercase font-medium">
                            (Opsional jika tidak diganti)
                          </span>
                        )}
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        required={!editingMenuId}
                        accept="image/*"
                        onChange={(e) =>
                          setNewMenuImage(
                            e.target.files ? e.target.files[0] : null,
                          )
                        }
                        className="w-full text-sm font-medium text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-slate-900 file:text-white hover:file:bg-emerald-600 file:cursor-pointer file:transition-colors bg-slate-50 border-2 border-slate-100 rounded-xl p-1.5 cursor-pointer"
                      />
                    </div>

                    <div className="pt-2 flex gap-3">
                      {editingMenuId && (
                        <button
                          type="button"
                          onClick={resetMenuForm}
                          className="flex-1 bg-white border-2 border-slate-200 text-slate-600 py-4 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                          Batal
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmittingMenu}
                        className={`flex-1 text-white py-4 rounded-xl font-bold text-sm disabled:bg-slate-300 disabled:text-slate-500 transition-all shadow-md active:scale-95 ${editingMenuId ? "bg-amber-500 hover:bg-amber-600" : "bg-slate-900 hover:bg-emerald-600"}`}
                      >
                        {isSubmittingMenu
                          ? "Menyimpan..."
                          : editingMenuId
                            ? "Simpan Perubahan"
                            : "Simpan Menu"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="xl:col-span-2">
                <div className="bg-white p-8 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-extrabold text-lg text-slate-900">
                      Daftar Menu Terdaftar
                    </h3>
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-xs font-bold">
                      {menus.length} Item
                    </span>
                  </div>

                  {menus.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <span className="text-4xl mb-3 opacity-50">🍔</span>
                      <p className="text-slate-400 font-medium text-sm">
                        Belum ada menu yang didaftarkan.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {menus.map((menu) => (
                        <div
                          key={menu.id}
                          className="border-2 border-slate-100 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all bg-white group"
                        >
                          <div className="w-full h-36 bg-slate-100 relative overflow-hidden">
                            <img
                              src={menu.image}
                              alt={menu.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 uppercase tracking-wider shadow-sm">
                              {menu.category?.name || "Kategori"}
                            </div>
                          </div>

                          <div className="p-5 flex flex-col flex-1">
                            <h4 className="font-bold text-slate-900 text-base leading-snug mb-1">
                              {menu.name}
                            </h4>
                            <p className="font-black text-emerald-600 text-sm mb-5">
                              {formatRupiah(menu.price)}
                            </p>

                            <div className="mt-auto flex gap-2">
                              <button
                                onClick={() => handleEditClick(menu)}
                                className="flex-1 text-amber-600 hover:text-white bg-amber-50 hover:bg-amber-500 py-2.5 rounded-xl text-sm font-bold transition-colors active:scale-95"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleDeleteMenu(menu.id)}
                                className="flex-1 text-red-500 hover:text-white bg-red-50 hover:bg-red-500 py-2.5 rounded-xl text-sm font-bold transition-colors active:scale-95"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB REPORT --- */}
        {activeTab === "REPORT" && (
          <div className="animate-[slideUp_0.3s_ease-out]">
            <div className="mb-10 print:hidden">
              <h2 className="text-3xl font-extrabold text-slate-900">Laporan Penghasilan</h2>
              <p className="text-slate-500 mt-2 font-medium">Pantau performa penjualan harian, bulanan, dan tahunan.</p>
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center mb-8 border-b-2 border-slate-200 pb-4">
              <h1 className="text-3xl font-black text-slate-900">PesanSini.</h1>
              <p className="text-slate-500 mt-1">Laporan Penghasilan Kafe - Dicetak: {new Date().toLocaleDateString("id-ID")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div 
                onClick={() => setReportFilter(reportFilter === "TODAY" ? "ALL" : "TODAY")}
                className={`bg-indigo-50 border border-indigo-100 p-8 rounded-[1.5rem] cursor-pointer transition-all ${reportFilter === "TODAY" ? "ring-4 ring-indigo-400 shadow-lg" : "hover:shadow-md"}`}
              >
                <h3 className="text-indigo-800 font-bold text-sm tracking-wider uppercase mb-2">Hari Ini</h3>
                <p className="text-3xl font-black text-indigo-900">{formatRupiah(dailyIncome)}</p>
              </div>
              <div 
                onClick={() => setReportFilter(reportFilter === "MONTH" ? "ALL" : "MONTH")}
                className={`bg-emerald-50 border border-emerald-100 p-8 rounded-[1.5rem] cursor-pointer transition-all ${reportFilter === "MONTH" ? "ring-4 ring-emerald-400 shadow-lg" : "hover:shadow-md"}`}
              >
                <h3 className="text-emerald-800 font-bold text-sm tracking-wider uppercase mb-2">Bulan Ini</h3>
                <p className="text-3xl font-black text-emerald-900">{formatRupiah(monthlyIncome)}</p>
              </div>
              <div 
                onClick={() => setReportFilter(reportFilter === "YEAR" ? "ALL" : "YEAR")}
                className={`bg-slate-900 border border-slate-800 p-8 rounded-[1.5rem] cursor-pointer transition-all ${reportFilter === "YEAR" ? "ring-4 ring-slate-400 shadow-lg" : "hover:shadow-md"}`}
              >
                <h3 className="text-slate-400 font-bold text-sm tracking-wider uppercase mb-2">Tahun Ini</h3>
                <p className="text-3xl font-black text-white">{formatRupiah(yearlyIncome)}</p>
              </div>
            </div>

            {/* --- KOTAK GRAFIK --- */}
            <div className="bg-white p-8 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-8 print:hidden">
              <h3 className="font-extrabold text-lg text-slate-900 mb-6">Grafik Tren Penjualan (7 Hari Terakhir)</h3>
              <div className="flex items-end justify-between h-56 pt-4 px-2 border-b border-slate-100">
                {getChartData().map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-end flex-1 group h-full">
                    {/* Tooltip Angka ketika di-hover mouse */}
                    <div className="text-center text-[10px] font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity mb-2 whitespace-nowrap shadow-sm">
                      {formatRupiah(day.amount)}
                    </div>
                    {/* Wrapper Batang agar persentase tinggi berfungsi */}
                    <div className="w-full flex-1 flex items-end justify-center relative">
                      <div 
                        style={{ height: `${day.percentage}%` }} 
                        className="w-7 sm:w-10 bg-emerald-500 rounded-t-lg transition-all duration-500 group-hover:bg-slate-900 min-h-[4px]"
                      ></div>
                    </div>
                    {/* Nama Hari */}
                    <span className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
                <h3 className="font-extrabold text-lg text-slate-900">
                  Riwayat Penjualan (Selesai)
                  {reportFilter !== "ALL" && (
                    <span className="text-sm font-medium text-emerald-600 ml-2">
                      ({reportFilter === "TODAY" ? "Hari Ini" : reportFilter === "MONTH" ? "Bulan Ini" : "Tahun Ini"})
                    </span>
                  )}
                </h3>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={handleExportCSV} className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">📄 Export Excel</button>
                  <button onClick={handleExportPDF} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">🖨️ Cetak PDF</button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-widest text-[10px] font-bold">
                      <th className="p-4">ID Pesanan</th>
                      <th className="p-4">Tanggal</th>
                      <th className="p-4">Pelanggan</th>
                      <th className="p-4">Metode</th>
                      <th className="p-4 text-right">Total Bayar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredReportOrders().length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Belum ada pesanan yang selesai untuk rentang waktu ini.</td>
                      </tr>
                    ) : (
                      getFilteredReportOrders().map(order => (
                        <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-bold text-slate-900">#{order.id}</td>
                          <td className="p-4 text-slate-500 font-medium text-sm">{new Date(order.createdAt).toLocaleDateString("id-ID")}</td>
                          <td className="p-4 text-slate-700 font-bold text-sm">{order.customerName || 'Guest'}</td>
                          <td className="p-4"><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase">PAID</span></td>
                          <td className="p-4 text-right font-black text-slate-900">{formatRupiah(order.totalAmount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media print {
          body { background: white !important; }
        }
      `,
        }}
      />
    </div>
  );
}