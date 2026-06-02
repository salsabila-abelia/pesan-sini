"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

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

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    const isValidToken =
      storedToken && storedToken !== "undefined" && storedToken !== "null";

    if (!isValidToken) {
      alert("Akses ditolak! Silakan login terlebih dahulu. 🛑");
      localStorage.clear();
      router.replace("/login");
      return;
    }

    if (storedRole !== "ADMIN") {
      alert("Akses ditolak! Halaman ini khusus Admin. 🛑");
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
    }
  }, [token]);

  // --- DITAMBAHKAN CACHE BUSTER AGAR MEJA SELALU UPDATE ---
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
      fetchTables();
    } catch (error) {
      alert("Gagal menambah meja.");
    } finally {
      setIsSubmittingTable(false);
    }
  };

  const handleDeleteTable = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus meja ini?")) return;
    try {
      await axios.delete(`${API_URL}/table/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTables();
    } catch (error) {
      alert("Gagal menghapus meja.");
    }
  };

  // --- DITAMBAHKAN CACHE BUSTER AGAR KATEGORI SELALU UPDATE ---
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
      fetchCategories();
    } catch (error) {
      alert("Gagal menambah kategori.");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus kategori ini?")) return;
    try {
      await axios.delete(`${API_URL}/category/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCategories();
    } catch (error) {
      alert("Gagal menghapus kategori.");
    }
  };

  // --- DITAMBAHKAN CACHE BUSTER AGAR MENU SELALU UPDATE BILA DIGANTI ---
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
      setMenus(response.data.data || response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitMenu = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingMenuId && !newMenuImage) {
      return alert("Gambar menu wajib diisi untuk menu baru!");
    }

    setIsSubmittingMenu(true);
    try {
      if (editingMenuId) {
        // JALUR 1: UPDATE
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
          // WAJIB MENGIRIM JSON DAN NUMBER AGAR DITERIMA DATABASE JIKA TANPA GAMBAR BARU
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
        alert("Menu berhasil diperbarui!");
      } else {
        // JALUR 2: TAMBAH BARU
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
        alert("Menu berhasil ditambahkan!");
      }

      resetMenuForm();
      fetchMenus();
    } catch (error: any) {
      console.error("Detail Error:", error.response?.data || error.message);
      alert(
        editingMenuId
          ? "Gagal memperbarui menu. Cek kembali form kamu."
          : "Gagal menambah menu. Pastikan harga berupa angka.",
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

  const handleDeleteMenu = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus menu ini?")) return;
    try {
      await axios.delete(`${API_URL}/menu/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMenus();
    } catch (error) {
      alert("Gagal menghapus menu.");
    }
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
    <div className="min-h-screen bg-[#F4F5F7] font-sans flex flex-col md:flex-row text-slate-900 selection:bg-emerald-200">
      <aside className="w-full md:w-72 bg-slate-900 text-slate-300 p-6 flex flex-col min-h-screen flex-shrink-0 shadow-2xl z-10">
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

      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
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
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `,
        }}
      />
    </div>
  );
}
