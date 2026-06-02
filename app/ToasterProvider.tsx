"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        style: {
          padding: '16px 20px',
          color: '#0f172a',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
          borderRadius: '1.25rem',
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: 'inherit',
          border: '1px solid #f1f5f9',
        },
        success: {
          style: {
            background: '#ecfdf5', // bg-emerald-50
            color: '#059669', // text-emerald-600
            border: '1px solid #d1fae5', // border-emerald-100
          },
          iconTheme: {
            primary: '#059669',
            secondary: '#ecfdf5',
          },
        },
        error: {
          style: {
            background: '#fef2f2', // bg-red-50
            color: '#dc2626', // text-red-600
            border: '1px solid #fee2e2', // border-red-100
          },
          iconTheme: {
            primary: '#dc2626',
            secondary: '#fef2f2',
          },
        },
        loading: {
          style: {
            background: '#f8fafc', // bg-slate-50
            color: '#334155', // text-slate-700
            border: '1px solid #f1f5f9', // border-slate-100
          },
        },
      }}
    />
  );
}
