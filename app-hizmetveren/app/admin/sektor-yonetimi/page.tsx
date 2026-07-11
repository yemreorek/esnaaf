'use client';

import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, FileJson, Loader2 } from 'lucide-react';

export default function SectorManagementPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('accessToken');
      
      const res = await fetch('http://localhost:3005/api/admin/graph/upload-json', {
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
      } else {
        setMessage({ type: 'error', text: data.message || 'Yükleme başarısız oldu.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Sunucuya bağlanılamadı. Lütfen tekrar deneyin.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
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
      </div>
    </div>
  );
}
