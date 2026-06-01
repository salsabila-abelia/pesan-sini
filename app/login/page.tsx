"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CASHIER"); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const payload = {
        username: username, 
        password: password,
      };

      const endpoint = `${API_URL}/auth/login`; 

      const response = await axios.post(endpoint, payload);
      
      const token = response.data.access_token;

      if (token) {
        
        // 1. CARI TAHU JABATAN ASLI DARI BACKEND ATAU DARI DALAM TOKEN
        let realRole = response.data.role || response.data.user?.role;
        
        // Jika backend tidak mengirim role secara langsung, bongkar token JWT-nya!
        if (!realRole) {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const decoded = JSON.parse(jsonPayload);
            
            realRole = decoded.role; // Ambil role dari dalam token
          } catch (err) {
            console.warn("Gagal membongkar token", err);
          }
        }

        // 2. VALIDASI SIKAT HABIS: Cocokkan jabatan asli dengan pilihan Dropdown
        if (realRole && realRole !== role) {
          // Jika ketahuan tidak cocok, tendang dan batalkan login!
          setErrorMsg(`Akses ditolak! Akun ini terdaftar sebagai ${realRole}, bukan ${role}.`);
          setIsLoading(false);
          return; 
        }

        // 3. JIKA LOLOS VALIDASI, BARU SIMPAN KE BROWSER
        localStorage.setItem("token", token);
        localStorage.setItem("role", realRole || role);

        if ((realRole || role) === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/cashier");
        }
        
      } else {
        setErrorMsg("Login berhasil, tapi Token tidak ditemukan dari response server.");
      }

    } catch (error: any) {
      console.error("Login gagal:", error);
      
      if (error.response && error.response.data) {
        const message = error.response.data.message;
        setErrorMsg(Array.isArray(message) ? message.join(', ') : message);
      } else {
        setErrorMsg("Terjadi kesalahan jaringan atau server mati.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4 font-sans selection:bg-emerald-200">
      
      <div className="bg-white max-w-md w-full rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 overflow-hidden flex flex-col relative">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full pointer-events-none opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-50 rounded-tr-full pointer-events-none opacity-60"></div>

        <div className="pt-10 pb-6 px-8 text-center relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1.5">
            Pesan<span className="text-emerald-600">Sini.</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium tracking-wide">
            PORTAL INTERNAL PEGAWAI
          </p>
        </div>

        <div className="px-8 pb-10 relative z-10">
          <h2 className="text-lg font-bold text-slate-800 mb-6 text-center">Silakan masuk ke akun Anda</h2>
          
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-4 rounded-[1.25rem] text-sm mb-6 border border-red-100 text-center font-medium shadow-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Login Sebagai</label>
              <div className="relative">
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border-2 border-slate-100 rounded-xl pl-4 pr-10 py-3.5 text-sm font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-0 focus:border-slate-900 outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="CASHIER">Kasir (Cashier)</option>
                  <option value="ADMIN">Admin (Pemilik/Manajer)</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Username</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border-2 border-slate-100 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white focus:ring-0 focus:border-slate-900 outline-none transition-colors" 
                placeholder="Masukkan username..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-slate-100 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white focus:ring-0 focus:border-slate-900 outline-none transition-colors tracking-widest" 
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-emerald-600 disabled:bg-slate-300 disabled:text-slate-500 transition-all shadow-lg shadow-slate-900/20 disabled:shadow-none flex justify-center items-center mt-6 active:scale-95"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}