'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, FileJson, Loader2, Clock } from 'lucide-react';

export default function SectorManagementPage({ token }: { token?: string | null }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchLogs = async () => {
    if (!token) return;
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/graph/upload-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Lütfen bir JSON dosyası seçin.' });
      return;
    }
    
    if (!token) {
      setMessage({ type: 'error', text: 'Oturum tokeni bulunamadı. Lütfen tekrar giriş yapın.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/graph/upload-json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Sektör şeması başarıyla yüklendi ve sisteme entegre edildi!' });
        setFile(null);
        fetchLogs(); // Yüklemeden sonra geçmişi güncelle
      } else {
        const errorMessage = data?.error?.message || data?.message || 'Yükleme başarısız oldu.';
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Sunucuya bağlanılamadı. Lütfen tekrar deneyin.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Sektör ve Soru Yönetimi</h1>
        <p className="text-gray-600 mb-8">
          Sonsuz seviyeli karar ağacı altyapısına yeni hizmet akışları ekleyin veya mevcutları güncelleyin.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileJson className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Yeni Sektör Şeması Yükle (.json)</h2>
              <p className="text-sm text-gray-500">Hazırlanan JSON şemasını yükleyerek yapay zeka ve form motorunu güncelleyin.</p>
            </div>
          </div>

          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
          >
            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileChange} 
              className="hidden" 
              id="json-upload"
            />
            <label 
              htmlFor="json-upload" 
              className="cursor-pointer flex flex-col items-center justify-center gap-4"
            >
              {file ? (
                <>
                  <div className="p-4 bg-white rounded-full shadow-sm text-blue-600">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-white rounded-full shadow-sm text-gray-500">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Dosya seçmek için tıklayın</p>
                    <p className="text-sm text-gray-500 mt-1">Sadece .json dosyaları kabul edilir</p>
                  </div>
                </>
              )}
            </label>
          </div>

          {message && (
            <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <p className="font-medium">{message.text}</p>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                !file || uploading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5" />
                  Sisteme Yükle
                </>
              )}
            </button>
          </div>
        </div>

        {/* Geçmiş JSON Yüklemeleri Tablosu */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-8 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Geçmiş JSON Yüklemeleri</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm">
                <tr>
                  <th className="py-4 px-6 font-medium">Dosya Adı</th>
                  <th className="py-4 px-6 font-medium">Kategori Slug</th>
                  <th className="py-4 px-6 font-medium">Yüklenme Tarihi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingLogs ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Yükleniyor...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      Henüz hiç JSON dosyası yüklenmemiş.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-800 font-medium">
                          <FileJson className="w-4 h-4 text-blue-500" />
                          {log.file_name}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium">
                          {log.category_slug}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-sm">
                        {new Date(log.uploaded_at).toLocaleString('tr-TR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
