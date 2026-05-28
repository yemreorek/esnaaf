import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SummaryCardProps {
  collectedData: {
    categorySlug?: string;
    name?: string;
    phone?: string;
    district?: string;
    destinationDistrict?: string;
    daireTipi?: string;
    siflik?: string;
    sıklık?: string;
    tarih?: string;
    metrekare?: string;
    tur?: string;
    renkTip?: string;
    sorunTuru?: string;
    isTuru?: string;
    aciliyet?: string;
    kapsam?: string;
    butce?: string;
    katAsansor?: string;
    details?: string;
  };
  onAction: (action: 'Düzelt' | 'Onayla') => void;
}

export default function SummaryCard({ collectedData, onAction }: SummaryCardProps) {
  const slug = collectedData.categorySlug || 'ev-temizligi';

  const getCategoryName = (cSlug: string) => {
    switch (cSlug) {
      case 'ev-temizligi': return 'Ev Temizliği';
      case 'boya-badana': return 'Boya Badana';
      case 'su-tesisati': return 'Su Tesisatı';
      case 'elektrik-tesisati': return 'Elektrik Tesisatı';
      case 'ev-tadilat': return 'Ev Tadilatı';
      case 'nakliyat': return 'Nakliyat / Taşıma';
      default: return 'Genel Esnaf Hizmeti';
    }
  };

  const generateHizmetOzeti = () => {
    const parts: string[] = [];
    if (collectedData.district) {
      parts.push(`Konum: ${collectedData.district}${collectedData.destinationDistrict ? ' -> ' + collectedData.destinationDistrict : ''}`);
    }
    if (collectedData.daireTipi) parts.push(`Daire: ${collectedData.daireTipi}`);
    if (collectedData.siflik || collectedData.sıklık) parts.push(`Sıklık: ${collectedData.siflik || collectedData.sıklık}`);
    if (collectedData.tarih) parts.push(`Tarih: ${collectedData.tarih}`);
    if (collectedData.metrekare) parts.push(`Metrekare: ${collectedData.metrekare}`);
    if (collectedData.tur) parts.push(`Tür: ${collectedData.tur}`);
    if (collectedData.renkTip) parts.push(`Renk/Boya: ${collectedData.renkTip}`);
    if (collectedData.sorunTuru || collectedData.isTuru) parts.push(`Arıza/İş: ${collectedData.sorunTuru || collectedData.isTuru}`);
    if (collectedData.aciliyet) parts.push(`Aciliyet: ${collectedData.aciliyet}`);
    if (collectedData.kapsam) parts.push(`Kapsam: ${collectedData.kapsam}`);
    if (collectedData.butce) parts.push(`Bütçe: ${collectedData.butce}`);
    if (collectedData.katAsansor) parts.push(`Kat/Asansör: ${collectedData.katAsansor}`);
    if (collectedData.details && collectedData.details !== 'Detay girilmedi.' && collectedData.details !== 'Standart Hizmet') {
      parts.push(`Detaylar: ${collectedData.details}`);
    }
    return parts.join(', ') || 'Standart Hizmet';
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📋 Talep Bilgileri</Text>
      
      <View style={styles.detailsContainer}>
        <View style={styles.row}>
          <Text style={styles.label}>HİZMET TÜRÜ:</Text>
          <Text style={styles.value}>{getCategoryName(slug)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>İSİM - SOYİSİM:</Text>
          <Text style={styles.value}>{collectedData.name || 'Belirtilmedi'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>TELEFON:</Text>
          <Text style={styles.value}>{collectedData.phone || 'Belirtilmedi'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>HİZMET ÖZETİ:</Text>
          <Text style={styles.value} numberOfLines={4}>
            {generateHizmetOzeti()}
          </Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => onAction('Düzelt')}
          activeOpacity={0.8}
        >
          <Text style={styles.editText}>✏️ Düzelt</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.approveButton} 
          onPress={() => onAction('Onayla')}
          activeOpacity={0.8}
        >
          <Text style={styles.approveText}>✅ Onayla</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    width: '100%',
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
    marginBottom: 10,
  },
  detailsContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555555',
    flex: 1,
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#232323',
    flex: 2,
    textAlign: 'right',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#232323',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#D4F54E',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4F54E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  approveText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#232323',
  },
});
