import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { customFetch, setAuthToken, removeAuthToken, getAuthToken } from '../src/lib/auth';

interface TestUsta {
  name: string;
  phone: string;
  package: string;
  rating: number;
}

const TEST_USTAS: TestUsta[] = [
  { name: 'Ahmet Temizlik (VIP Usta)', phone: '05321112233', package: 'VIP', rating: 4.9 },
  { name: 'Mehmet Boyacı (Premium Usta)', phone: '05332223344', package: 'Premium', rating: 4.7 },
  { name: 'Ayşe Tesisatçı (Standart Usta)', phone: '05343334455', package: 'Standart', rating: 4.5 },
  { name: 'Fatma Usta (Basic Usta)', phone: '05354445566', package: 'Basic', rating: 4.2 },
];

export default function IndexScreen() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [kota, setKota] = useState<any | null>(null);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIdentity, setUploadingIdentity] = useState(false);
  const [uploadingTaxPlate, setUploadingTaxPlate] = useState(false);

  const handleMobileDocumentUpload = async (type: 'identity' | 'tax') => {
    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'],
        copyToCacheDirectory: true
      });

      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        return;
      }

      const fileAsset = pickerResult.assets[0];
      const fileName = fileAsset.name;
      const fileUri = fileAsset.uri;
      const contentType = fileAsset.mimeType || 'image/jpeg';

      if (type === 'identity') setUploadingIdentity(true);
      else setUploadingTaxPlate(true);

      const presignedRes = await customFetch('/api/ortak/upload/presigned-url', {
        method: 'POST',
        body: JSON.stringify({
          fileName,
          contentType
        })
      });

      const presignedData = await presignedRes.json();
      if (!presignedRes.ok) {
        throw new Error(presignedData.message || 'Presigned URL oluşturulamadı.');
      }

      const response = await fetch(fileUri);
      const blob = await response.blob();

      const uploadRes = await fetch(presignedData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType
        },
        body: blob
      });

      if (!uploadRes.ok) {
        throw new Error('Dosya sunucuya yüklenemedi.');
      }

      const updatePayload = type === 'identity' 
        ? { identityDocument: presignedData.fileUrl } 
        : { taxPlateDocument: presignedData.fileUrl };

      const updateRes = await customFetch('/api/hizmetveren/profil/belgeler', {
        method: 'PUT',
        body: JSON.stringify(updatePayload)
      });

      const updateData = await updateRes.json();
      if (!updateRes.ok) {
        throw new Error(updateData.message || 'Belgeler profilinizle ilişkilendirilemedi.');
      }

      Alert.alert('Başarılı', `${type === 'identity' ? 'Kimlik belgesi' : 'Vergi levhası'} başarıyla yüklendi.`);
      fetchProfileAndKota();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Yükleme Hatası', err.message || 'Belge yüklenirken bir hata oluştu.');
    } finally {
      if (type === 'identity') setUploadingIdentity(false);
      else setUploadingTaxPlate(false);
    }
  };

  const registerFcmToken = async () => {
    try {
      console.log('[FCM Provider] Requesting notification permission...');
      const mockToken = 'mock-fcm-token-provider-' + Math.random().toString(36).substring(7);
      console.log('[FCM Provider] Mock token generated:', mockToken);
      
      const res = await customFetch('/api/ortak/bildirimler/fcm-token', {
        method: 'POST',
        body: JSON.stringify({ token: mockToken }),
      });
      if (res.ok) {
        console.log('[FCM Provider] FCM Token successfully registered on backend.');
      } else {
        console.warn('[FCM Provider] Failed to register FCM token on backend:', res.status);
      }
    } catch (err) {
      console.error('[FCM Provider] Error registering token:', err);
    }
  };

  // Check login state on mount
  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const token = await getAuthToken();
    if (token) {
      setIsLoggedIn(true);
      fetchProfileAndKota();
      registerFcmToken();
    } else {
      setIsLoggedIn(false);
    }
  };

  const fetchProfileAndKota = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch usta actual profile
      const profRes = await customFetch('/api/hizmetveren/profil');
      let profData = { name: 'Ahmet Usta (Seeded)', rating: 4.8, totalJobs: 12, city: 'Adana', serviceDistricts: [] as string[] };
      if (profRes.ok) {
        profData = await profRes.json();
      }
      
      setProfile(profData);
      setSelectedDistricts(profData.serviceDistricts || []);
      
      // 2. Fetch usta kota details
      const kotaRes = await customFetch('/api/hizmetveren/kota');
      if (kotaRes.ok) {
        const kData = await kotaRes.json();
        setKota(kData);
      } else {
        // Fallback mock kota for UI representation if API returns unapproved usta
        setKota({
          packageName: 'Premium Paket',
          acceptedCount: 4,
          limit: 15,
          remaining: 11
        });
      }
    } catch (err) {
      console.error('Fetch profile stats error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLocations = async () => {
    setIsSaving(true);
    try {
      const res = await customFetch('/api/hizmetveren/profil', {
        method: 'PUT',
        body: JSON.stringify({
          city: 'Adana',
          serviceDistricts: selectedDistricts
        })
      });
      if (res.ok) {
        Alert.alert('Başarılı', 'Hizmet verdiğiniz bölgeler başarıyla güncellendi.');
        fetchProfileAndKota();
      } else {
        throw new Error('Konumlar güncellenemedi.');
      }
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDistrict = (district: string) => {
    setSelectedDistricts(prev => {
      if (prev.includes(district)) {
        return prev.filter(d => d !== district);
      } else {
        return [...prev, district];
      }
    });
  };

  const handleQuickLogin = async (usta: TestUsta) => {
    setIsLoading(true);
    try {
      // 1. Trigger simulated OTP send
      const sendRes = await customFetch('/api/ortak/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phone: usta.phone })
      });

      if (!sendRes.ok) {
        throw new Error('OTP gönderimi başarısız oldu.');
      }

      const sendData = await sendRes.json();
      const code = sendData.devOtpCode; // developer bypass code from payload!

      if (!code) {
        throw new Error('Simüle kod alınamadı.');
      }

      // 2. Verify OTP code
      const verifyRes = await customFetch('/api/ortak/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone: usta.phone, code })
      });

      if (!verifyRes.ok) {
        throw new Error('OTP doğrulaması başarısız oldu.');
      }

      const verifyData = await verifyRes.json();
      const token = verifyData.accessToken;

      if (!token) {
        throw new Error('JWT token alınamadı.');
      }

      // 3. Save auth token and update state
      await setAuthToken(token);
      setIsLoggedIn(true);
      fetchProfileAndKota();
      await registerFcmToken();

      Alert.alert('Giriş Başarılı', `${usta.name} olarak başarıyla giriş yapıldı.`);
    } catch (err: any) {
      console.error('Quick login error:', err);
      Alert.alert('Giriş Başarısız', err.message || 'OTP doğrulanırken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await removeAuthToken();
    setIsLoggedIn(false);
    setProfile(null);
    setKota(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Logo */}
        <View style={styles.header}>
          <Text style={styles.logoText}>esnaaf<Text style={styles.logoDot}>.</Text>partner</Text>
          <Text style={styles.subtitle}>Usta Kontrol ve Teklif Paneli</Text>
        </View>

        {isLoading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#D4F54E" />
          </View>
        )}

        {!isLoading && !isLoggedIn && (
          <View style={styles.loginSection}>
            <Text style={styles.sectionTitle}>Hızlı Test Girişi (Developer)</Text>
            <Text style={styles.infoText}>
              Geliştirme amacıyla aşağıdaki seeded usta hesaplarından biriyle tek tıkla simüle OTP doğrulaması yaparak giriş yapabilirsiniz:
            </Text>

            <View style={styles.ustaList}>
              {TEST_USTAS.map((usta) => (
                <TouchableOpacity
                  key={usta.phone}
                  style={styles.ustaButton}
                  onPress={() => handleQuickLogin(usta)}
                  activeOpacity={0.8}
                >
                  <View style={styles.ustaButtonHeader}>
                    <Text style={styles.ustaName}>{usta.name}</Text>
                    <Text style={styles.ustaRating}>⭐ {usta.rating.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.ustaPhone}>Tel: {usta.phone} · Paket: {usta.package}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!isLoading && isLoggedIn && profile && !profile.isApproved && (
          <View style={styles.onboardingSection}>
            <View style={styles.alertCard}>
              <Text style={styles.alertEmoji}>⚠️</Text>
              <View style={styles.alertDetails}>
                <Text style={styles.alertTitle}>Onay Bekleniyor</Text>
                <Text style={styles.alertMessage}>
                  Hizmet vermeye başlayabilmek için lütfen kimlik belgenizi ve vergi levhanızı yükleyin. Belgeleriniz onaylandıktan sonra paneliniz açılacaktır.
                </Text>
              </View>
            </View>

            {/* Kimlik Belgesi Yükleme */}
            <View style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <Text style={styles.documentTitle}>Kimlik Belgesi Görseli</Text>
                <Text style={[styles.statusBadge, profile.identityDocument ? styles.statusUploaded : styles.statusPending]}>
                  {profile.identityDocument ? 'YÜKLENDİ' : 'EKSİK'}
                </Text>
              </View>
              <Text style={styles.documentDesc}>
                Kimlik veya ehliyetinizin ön yüzünün fotoğrafını (PNG, JPG veya PDF) yükleyin.
              </Text>
              <TouchableOpacity
                style={[styles.uploadButton, uploadingIdentity && styles.uploadButtonDisabled]}
                onPress={() => handleMobileDocumentUpload('identity')}
                disabled={uploadingIdentity}
                activeOpacity={0.8}
              >
                <Text style={styles.uploadButtonText}>
                  {uploadingIdentity ? 'Yükleniyor...' : profile.identityDocument ? '🔄 Belgeyi Değiştir' : '➕ Belge Seç ve Yükle'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Vergi Levhası Yükleme */}
            <View style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <Text style={styles.documentTitle}>Vergi Levhası (Maliye)</Text>
                <Text style={[styles.statusBadge, profile.taxPlateDocument ? styles.statusUploaded : styles.statusPending]}>
                  {profile.taxPlateDocument ? 'YÜKLENDİ' : 'EKSİK'}
                </Text>
              </View>
              <Text style={styles.documentDesc}>
                Güncel vergi levhası görselini veya PDF dokümanını seçerek yükleyin.
              </Text>
              <TouchableOpacity
                style={[styles.uploadButton, uploadingTaxPlate && styles.uploadButtonDisabled]}
                onPress={() => handleMobileDocumentUpload('tax')}
                disabled={uploadingTaxPlate}
                activeOpacity={0.8}
              >
                <Text style={styles.uploadButtonText}>
                  {uploadingTaxPlate ? 'Yükleniyor...' : profile.taxPlateDocument ? '🔄 Belgeyi Değiştir' : '➕ Belge Seç ve Yükle'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Logout button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutText}>Oturumu Kapat</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && isLoggedIn && profile && profile.isApproved && (
          <View style={styles.profileSection}>
            {/* Profile Info */}
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>👷</Text>
              </View>
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>{profile?.name || 'Seeded Usta'}</Text>
                <Text style={styles.profileRating}>
                  ⭐ {profile?.rating || '4.8'} Puan · Ortalama Reyting
                </Text>
              </View>
            </View>

            {/* Health Score Card */}
            {profile && profile.healthScore !== undefined && (
              <View style={styles.healthCard}>
                <View style={styles.healthHeader}>
                  <Text style={styles.healthTitle}>Usta Sağlık Skoru</Text>
                  <View 
                    style={[
                      styles.healthBadge, 
                      profile.healthScore >= 85 
                        ? styles.healthBadgeExcellent 
                        : profile.healthScore >= 70 
                        ? styles.healthBadgeGood 
                        : styles.healthBadgePoor
                    ]}
                  >
                    <Text style={styles.healthBadgeText}>
                      {profile.healthScore >= 85 ? 'Mükemmel' : profile.healthScore >= 70 ? 'İyi' : 'Düşük'}
                    </Text>
                  </View>
                </View>

                <View style={styles.healthScoreRow}>
                  <Text style={styles.healthScorePercent}>%{profile.healthScore}</Text>
                  <Text style={styles.healthScoreText}>
                    Sağlık skorunuz tamamladığınız iş adedi, NPS puanı, uyuşmazlıklar ve cevap hızınıza göre dinamik olarak belirlenir.
                  </Text>
                </View>
                
                <Text style={styles.healthScoreInfo}>
                  💡 Yüksek sağlık skoru, iş dağıtımlarında sizi diğer ustaların önüne geçirir.
                </Text>
              </View>
            )}

            {/* Quota Limits usage bar */}
            {kota && (
              <View style={styles.kotaCard}>
                <View style={styles.kotaHeader}>
                  <Text style={styles.kotaTitle}>Aylık Teklif Kabul Kotası</Text>
                  <Text style={styles.kotaBadge}>{kota.packageName || 'Premium'}</Text>
                </View>
                
                <View style={styles.progressBarBg}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${Math.min(100, (kota.acceptedCount / kota.limit) * 100)}%` }
                    ]} 
                  />
                </View>

                <View style={styles.kotaDetails}>
                  <Text style={styles.quotaText}>
                    Kullanılan: <Text style={styles.boldText}>{kota.acceptedCount}</Text> / {kota.limit}
                  </Text>
                  <Text style={styles.quotaText}>
                    Kalan: <Text style={styles.boldText}>{kota.remaining}</Text> Hak
                  </Text>
                </View>
              </View>
            )}

            {/* Service Coverage Editor Panel */}
            <View style={styles.coverageCard}>
              <Text style={styles.coverageTitle}>📍 Hizmet Verdiğim Bölgeler (Adana)</Text>
              <Text style={styles.coverageSubtitle}>
                Sadece seçtiğiniz ilçelerden gelen müşteri talepleri size ulaştırılır.
              </Text>
              
              <View style={styles.districtsList}>
                {['Çukurova', 'Yüreğir', 'Sarıçam', 'Ceyhan', 'Seyhan'].map((district) => {
                  const isSelected = selectedDistricts.includes(district);
                  return (
                    <TouchableOpacity
                      key={district}
                      style={[styles.districtRow, isSelected && styles.districtRowSelected]}
                      onPress={() => handleToggleDistrict(district)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                      <Text style={[styles.districtLabel, isSelected && styles.districtLabelSelected]}>
                        {district}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.saveCoverageButton, isSaving && styles.saveCoverageButtonDisabled]}
                onPress={handleUpdateLocations}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#232323" />
                ) : (
                  <Text style={styles.saveCoverageText}>💾 Bölgeleri Güncelle</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Actions CTA */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.jobsButton}
                onPress={() => router.push('/gelen-isler')}
                activeOpacity={0.8}
              >
                <Text style={styles.jobsButtonText}>⚡ Dağıtılan Canlı İşleri Gör</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutText}>Çıkış Yap</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#232323',
    letterSpacing: -1,
  },
  logoDot: {
    color: '#D4F54E',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  loader: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loginSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 20,
    fontWeight: '500',
  },
  ustaList: {
    flexDirection: 'column',
    gap: 12,
  },
  ustaButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 16,
    padding: 14,
  },
  ustaButtonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ustaName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#232323',
  },
  ustaRating: {
    fontSize: 12,
    fontWeight: '900',
    color: '#232323',
  },
  ustaPhone: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '600',
  },
  profileSection: {
    flexDirection: 'column',
    gap: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#232323',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
  },
  profileDetails: {
    flexDirection: 'column',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#232323',
  },
  profileRating: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '600',
    marginTop: 2,
  },
  kotaCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    padding: 16,
  },
  kotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kotaTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#232323',
  },
  kotaBadge: {
    backgroundColor: '#F7FCD4',
    borderWidth: 1,
    borderColor: '#D4F54E',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#232323',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D4F54E',
    borderRadius: 5,
  },
  kotaDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotaText: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '600',
  },
  boldText: {
    color: '#232323',
    fontWeight: 'bold',
  },
  healthCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    padding: 16,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  healthTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#232323',
  },
  healthBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  healthBadgeExcellent: {
    backgroundColor: '#E6F9F0',
    borderColor: '#A7F3D0',
  },
  healthBadgeGood: {
    backgroundColor: '#FFF9E6',
    borderColor: '#FFE599',
  },
  healthBadgePoor: {
    backgroundColor: '#FDE8E8',
    borderColor: '#FBD5D5',
  },
  healthBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#232323',
  },
  healthScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  healthScorePercent: {
    fontSize: 28,
    fontWeight: '900',
    color: '#232323',
  },
  healthScoreText: {
    flex: 1,
    fontSize: 11,
    color: '#666666',
    lineHeight: 16,
    fontWeight: '500',
  },
  healthScoreInfo: {
    fontSize: 10,
    color: '#888888',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'column',
    gap: 12,
  },
  jobsButton: {
    backgroundColor: '#D4F54E',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4F54E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  jobsButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#232323',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  coverageCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    padding: 16,
  },
  coverageTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#232323',
    marginBottom: 4,
  },
  coverageSubtitle: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 16,
  },
  districtsList: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  districtRowSelected: {
    borderColor: '#D4F54E',
    backgroundColor: '#F7FCD4',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C0C0C0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    borderColor: '#232323',
    backgroundColor: '#232323',
  },
  checkMark: {
    color: '#D4F54E',
    fontSize: 12,
    fontWeight: 'bold',
  },
  districtLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  districtLabelSelected: {
    color: '#232323',
    fontWeight: 'bold',
  },
  saveCoverageButton: {
    backgroundColor: '#232323',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveCoverageButtonDisabled: {
    backgroundColor: '#888888',
  },
  saveCoverageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  onboardingSection: {
    flexDirection: 'column',
    gap: 20,
  },
  alertCard: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFE599',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertEmoji: {
    fontSize: 20,
  },
  alertDetails: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8A6D00',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 12,
    color: '#B08F00',
    lineHeight: 18,
    fontWeight: '500',
  },
  documentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'column',
    gap: 10,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#232323',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusUploaded: {
    backgroundColor: '#E6F9F0',
    color: '#10B981',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusPending: {
    backgroundColor: '#F5F5F5',
    color: '#6B7280',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  documentDesc: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: '#D4F54E',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  uploadButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#232323',
  },
});
