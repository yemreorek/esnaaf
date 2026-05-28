import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface JobCardProps {
  job: {
    id: string;
    category: {
      name: string;
      slug: string;
    };
    form_data: {
      district?: string;
      destinationDistrict?: string;
      daireTipi?: string;
      metrekare?: string;
      aciliyet?: string;
      kapsam?: string;
      butce?: string;
      katAsansor?: string;
      tarih?: string;
      details?: string;
      tur?: string;
      sorunTuru?: string;
      isTuru?: string;
    };
    viewerCount?: number;
    created_at?: string;
    isFavoriteCustomer?: boolean;
  };
  onOfferPress: () => void;
}

export default function JobCard({ job, onOfferPress }: JobCardProps) {
  const slug = job.category.slug;
  const formData = job.form_data;

  return (
    <View style={styles.card}>
      {/* Category header */}
      <View style={styles.header}>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryIcon}>
            {slug === 'ev-temizligi' ? '🏠' : 
             slug === 'boya-badana' ? '🎨' : 
             slug === 'su-tesisati' ? '🔧' : 
             slug === 'elektrik-tesisati' ? '⚡' : 
             slug === 'ev-tadilat' ? '🔨' : 
             slug === 'nakliyat' ? '📦' : '🛠️'}
          </Text>
          <Text style={styles.categoryName}>{job.category.name}</Text>
          {job.isFavoriteCustomer && (
            <View style={styles.favoriteBadge}>
              <Text style={styles.favoriteText}>❤️ Eski Müşteri</Text>
            </View>
          )}
        </View>
        <View style={styles.viewerBadge}>
          <Text style={styles.viewerText}>👁️ {job.viewerCount || 1} Usta Gördü</Text>
        </View>
      </View>

      {/* Main parameters grid */}
      <View style={styles.details}>
        {slug === 'nakliyat' ? (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Çıkış:</Text>
              <Text style={styles.value}>{formData.district}, İstanbul</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Varış:</Text>
              <Text style={styles.value}>{formData.destinationDistrict}, İstanbul</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Daire:</Text>
              <Text style={styles.value}>{formData.daireTipi}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Kat/Asansör:</Text>
              <Text style={styles.value}>{formData.katAsansor}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tarih:</Text>
              <Text style={styles.value}>{formData.tarih}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Konum:</Text>
              <Text style={styles.value}>{formData.district || 'Belirtilmedi'}, İstanbul</Text>
            </View>

            {slug === 'ev-temizligi' && (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Daire Tipi:</Text>
                  <Text style={styles.value}>{formData.daireTipi}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Tarih:</Text>
                  <Text style={styles.value}>{formData.tarih}</Text>
                </View>
              </>
            )}

            {slug === 'boya-badana' && (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Metrekare:</Text>
                  <Text style={styles.value}>{formData.metrekare}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Uygulama Alanı:</Text>
                  <Text style={styles.value}>{formData.tur}</Text>
                </View>
              </>
            )}

            {(slug === 'su-tesisati' || slug === 'elektrik-tesisati') && (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>İş Türü:</Text>
                  <Text style={styles.value}>{formData.sorunTuru || formData.isTuru}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Aciliyet:</Text>
                  <Text style={styles.value}>{formData.aciliyet}</Text>
                </View>
              </>
            )}

            {slug === 'ev-tadilat' && (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Kapsam:</Text>
                  <Text style={styles.value}>{formData.kapsam}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Metrekare:</Text>
                  <Text style={styles.value}>{formData.metrekare}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Bütçe Aralığı:</Text>
                  <Text style={styles.value}>{formData.butce}</Text>
                </View>
              </>
            )}
          </>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>Detaylar:</Text>
          <Text style={styles.value} numberOfLines={2}>
            {formData.details || 'Açıklama belirtilmemiş.'}
          </Text>
        </View>
      </View>

      {/* Action button */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={onOfferPress}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>⚡ Teklif Ver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 10,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#232323',
  },
  viewerBadge: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  viewerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#888888',
  },
  details: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '600',
    flex: 1,
  },
  value: {
    fontSize: 12,
    color: '#232323',
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#D4F54E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4F54E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#232323',
  },
  favoriteBadge: {
    backgroundColor: '#F7FCD4',
    borderColor: '#D4F54E',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  favoriteText: {
    color: '#232323',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
