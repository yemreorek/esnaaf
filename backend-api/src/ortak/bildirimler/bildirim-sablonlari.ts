import { NotifChannel } from '@prisma/client';

export interface BildirimTemplate {
  title: string;
  body: string;
  channels: NotifChannel[];
}

export const BILDIRIM_SABLONLARI: Record<string, BildirimTemplate> = {
  // --- Hizmet Alan (HA) Bildirimleri ---
  'HA-01': {
    title: 'Talebiniz Başarıyla Oluşturuldu',
    body: 'Talebiniz başarıyla oluşturuldu. Teklifler gelmeye başladığında sizi bilgilendireceğiz.',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HA-02': {
    title: 'İlk Teklifiniz Geldi!',
    body: 'İlk teklifiniz geldi! Hemen inceleyin.',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HA-03': {
    title: 'Yeni Teklifleriniz Var',
    body: '3 yeni teklif daha geldi. Toplam {count} teklifiniz var.',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HA-04': {
    title: 'Teklif Kabul Edildi',
    body: 'Teklifi kabul ettiniz. {hv_name} ile iletişime geçebilirsiniz.',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HA-05': {
    title: 'Teklif Kabul Sınırı',
    body: 'Maksimum 3 teklif kabul hakkınızı kullandınız. Talep artık yeni teklif almayacak.',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HA-05b': {
    title: 'Yeni Mesaj',
    body: '{hv_name} size yeni bir mesaj gönderdi.',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HA-06': {
    title: 'Teklif Gelmedi',
    body: 'Talebinize henüz teklif gelmedi. Talep detaylarınızı güncellemek ister misiniz?',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HA-07': {
    title: 'Talebiniz Kapanmak Üzere',
    body: 'Talebiniz 48 saat içinde kapanacak. Gelen teklifleri değerlendirin.',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HA-08': {
    title: 'Hizmet Deneyiminizi Puanlayın',
    body: 'Hizmet deneyiminizi 0-10 arasında puanlayın.',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HA-09': {
    title: 'Deneyiminizi İyileştirmemize Yardımcı Olun',
    body: 'Deneyiminizi iyileştirmemize yardımcı olun. Neyi daha iyi yapabilirdik?',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HA-10': {
    title: 'Değerlendirme Daveti',
    body: '{hv_name} için değerlendirme yazın ve diğer kullanıcılara yardımcı olun.',
    channels: [NotifChannel.in_app, NotifChannel.push, NotifChannel.email],
  },
  'HA-11': {
    title: 'Şikâyet Durumu Güncellendi',
    body: 'Şikâyetinizin durumu güncellendi: {status}. Detaylar için tıklayın.',
    channels: [NotifChannel.in_app, NotifChannel.email],
  },
  'HA-12': {
    title: 'Hesap Silme Talebi',
    body: 'Hesap silme talebiniz alınmıştır. 30 gün içinde tüm verileriniz kalıcı olarak silinecektir.',
    channels: [NotifChannel.email],
  },
  'HA-RAN-YN': {
    title: 'Yeni Randevu Oluşturuldu',
    body: '{hv_name} firması sizinle {appointment_date} tarihi için randevu oluşturdu.',
    channels: [NotifChannel.in_app, NotifChannel.push, NotifChannel.sms],
  },
  'HA-RAN-GNC': {
    title: 'Randevu Tarihi Güncellendi',
    body: '{hv_name} firması randevu tarihini {appointment_date} olarak güncelledi.',
    channels: [NotifChannel.in_app, NotifChannel.push, NotifChannel.sms],
  },
  'HA-IS-IPT': {
    title: 'İş İptal Edildi',
    body: '{hv_name} firması anlaşmış olduğunuz işi iptal etti. Gerekçe: {reason}',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },


  // --- Hizmet Veren (HV) Bildirimleri ---
  'HV-01': {
    title: 'Yeni İş İlanı!',
    body: 'Yeni bir iş ilanı (eşleşen talep) geldi. Hemen detayları görün ve teklif verin.',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HV-02': {
    title: 'Teklifiniz Kabul Edildi!',
    body: 'Tebrikler! Teklifiniz kabul edildi. Müşteri bilgilerine hemen ulaşın.',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HV-02b': {
    title: 'Yeni Mesaj',
    body: '{ha_name} size yeni bir mesaj gönderdi.',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HV-03': {
    title: 'Teklif Reddedildi',
    body: 'Gönderdiğiniz teklif müşteri tarafından reddedildi.',
    channels: [NotifChannel.in_app],
  },
  'HV-04': {
    title: 'Kotanız Dolmak Üzere',
    body: 'Aylık teklif kotanızın %80\'ine ulaştınız. Teklif göndermeye devam etmek için paketinizi yükseltebilirsiniz.',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HV-05': {
    title: 'Kotanız Tamamen Doldu',
    body: 'Aylık teklif kotanız tamamen doldu. Yeni teklif göndermek için lütfen paketinizi yükseltin.',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HV-06': {
    title: 'Kotalar Sıfırlandı',
    body: 'Yeni fatura dönemiyle birlikte teklif kotanız sıfırlandı.',
    channels: [NotifChannel.in_app],
  },
  'HV-07': {
    title: 'Aboneliğiniz Yenilendi',
    body: 'Aboneliğiniz başarıyla yenilendi. Yeni döneminiz hayırlı olsun.',
    channels: [NotifChannel.email],
  },
  'HV-08': {
    title: 'Ödeme Başarısız',
    body: 'Abonelik ödemeniz başarısız oldu. Lütfen kayıtlı kart bilgilerinizi güncelleyin.',
    channels: [NotifChannel.in_app, NotifChannel.push, NotifChannel.email],
  },
  'HV-09': {
    title: 'Abonelik Ödemesi Tekrar Başarısız Oldu',
    body: 'Abonelik ödemeniz 2. kez başarısız oldu. Askıya alınmamak için kart bilgilerinizi güncelleyin.',
    channels: [NotifChannel.in_app, NotifChannel.push, NotifChannel.email],
  },
  'HV-10': {
    title: 'Aboneliğiniz Askıya Alındı',
    body: 'Başarısız ödeme denemeleri nedeniyle aboneliğiniz askıya alınmıştır. Tekrar aktif etmek için kartınızı güncelleyin.',
    channels: [NotifChannel.in_app, NotifChannel.push, NotifChannel.email],
  },
  'HV-11': {
    title: 'Yeni Değerlendirme Aldınız',
    body: 'Bir müşteriniz profiliniz için yeni bir değerlendirme yazdı.',
    channels: [NotifChannel.in_app, NotifChannel.email],
  },
  'HV-12': {
    title: 'Değerlendirme Moderasyon Sonucu',
    body: 'Değerlendirmeniz incelenmiş ve {status} edilmiştir.',
    channels: [NotifChannel.in_app, NotifChannel.email],
  },
  'HV-13': {
    title: 'Profilinize Şikâyet Açıldı',
    body: 'Müşteri tarafından profilinize şikâyet açılmıştır. İnceleme başlatılmıştır.',
    channels: [NotifChannel.in_app, NotifChannel.email],
  },
  'HV-14': {
    title: 'Profiliniz Onaylandı!',
    body: 'Tebrikler! Belgeleriniz onaylandı ve profiliniz yayına alındı.',
    channels: [NotifChannel.in_app, NotifChannel.push, NotifChannel.email],
  },
  'HV-15': {
    title: 'Profil Onay Talebiniz Reddedildi',
    body: 'Profil onay talebiniz reddedilmiştir. Red gerekçesi: {reason}',
    channels: [NotifChannel.email],
  },
  'HV-16': {
    title: 'Düşük Puan Uyarısı',
    body: 'Ortalama puanınız kritik eşik değerinin altına düşmüştür. Lütfen hizmet kalitenize özen gösterin.',
    channels: [NotifChannel.email],
  },
  'HV-17': {
    title: 'Kampanya Kodu Uygulandı',
    body: 'Kampanya kodunuz başarıyla uygulanmıştır. Detay: {discount}',
    channels: [NotifChannel.email],
  },
  'HV-18': {
    title: 'Ücretsiz Deneme Süreniz Bitiyor',
    body: 'Ücretsiz deneme süreniz dolmak üzere. Hizmet almaya devam etmek için lütfen ödeme yöntemi ekleyin.',
    channels: [NotifChannel.in_app, NotifChannel.push, NotifChannel.email],
  },
  'HV-19': {
    title: 'Deneme Süresi Tanımlandı',
    body: 'Yönetici tarafından hesabınıza deneme süresi tanımlanmıştır.',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HV-20': {
    title: 'Deneme Süresi İptal Edildi',
    body: 'Yönetici tarafından deneme süreniz iptal edilmiştir.',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },
  'HV-21': {
    title: 'Deneme Süreniz Bitiyor',
    body: 'Deneme sürenizin bitmesine 3 gün kalmıştır.',
    channels: [NotifChannel.in_app, NotifChannel.push],
  },

  // --- Yönetici (AD) Bildirimleri ---
  'AD-01': {
    title: 'Yeni Hizmet Veren Kaydı',
    body: 'Sisteme yeni bir Hizmet Veren kayıt olmuştur. Onay süreci beklemektedir.',
    channels: [NotifChannel.email],
  },
  'AD-02': {
    title: 'Bekleyen Değerlendirmeler Raporu',
    body: 'Moderasyon bekleyen değerlendirmelerin günlük özet raporu hazırlanmıştır.',
    channels: [NotifChannel.email],
  },
  'AD-03': {
    title: 'Yeni Şikâyet Kaydı',
    body: 'Sistemde yeni bir şikâyet açılmıştır. İlgili HV ID: {provider_id}',
    channels: [NotifChannel.email],
  },
  'AD-04': {
    title: 'Başarısız Ödemeler Raporu',
    body: 'Son 24 saatteki başarısız ödemelerin günlük raporu hazırlanmıştır.',
    channels: [NotifChannel.email],
  },
  'AD-05': {
    title: 'Kritik Puan Düşüşü',
    body: 'Hizmet Veren ({provider_name}) ortalama puanı kritik eşiğin altına düşmüştür.',
    channels: [NotifChannel.email],
  },
  'AD-06': {
    title: 'NPS Skoru Düşüş Uyarısı',
    body: 'Haftalık NPS ortalaması bir önceki haftaya göre düşüş göstermiştir.',
    channels: [NotifChannel.email],
  },
  'AD-07': {
    title: '[ACİL] Çoklu Detraktör Alarmı',
    body: 'Hizmet Veren ({provider_name}) son 30 günde 3+ detraktör puanı almıştır. Acil inceleme gereklidir!',
    channels: [NotifChannel.email],
  },
};

export function formatMessage(template: string, payload: Record<string, any> = {}): string {
  let result = template;
  for (const [key, value] of Object.entries(payload)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
  }
  return result;
}
