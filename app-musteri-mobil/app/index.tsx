import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { startNewSession } from '../src/lib/session';

const { width } = Dimensions.get('window');

interface Category {
  slug: string;
  name: string;
  icon: string;
  color: string;
}

const PRIMARY_CHIPS: Category[] = [
  { slug: 'ev-temizligi', name: 'Ev Temizliği', icon: '🏠', color: '#F7FCD4' },
  { slug: 'boya-badana', name: 'Boya Badana', icon: '🎨', color: '#F7FCD4' },
  { slug: 'su-tesisati', name: 'Su Tesisatı', icon: '🔧', color: '#F7FCD4' },
  { slug: 'elektrik-tesisati', name: 'Elektrik Tesisatı', icon: '⚡', color: '#F7FCD4' },
  { slug: 'ev-tadilat', name: 'Ev Tadilatı', icon: '🔨', color: '#F7FCD4' },
  { slug: 'nakliyat', name: 'Nakliyat', icon: '📦', color: '#F7FCD4' },
];

const ALL_CATEGORIES: Category[] = [
  ...PRIMARY_CHIPS,
  { slug: 'temizlik-hizmetleri', name: 'Ofis Temizliği', icon: '🏢', color: '#FFFFFF' },
  { slug: 'dezenfeksiyon', name: 'Dezenfeksiyon', icon: '🧴', color: '#FFFFFF' },
  { slug: 'koltuk-yikama', name: 'Koltuk Yıkama', icon: '🛋️', color: '#FFFFFF' },
  { slug: 'hali-yikama', name: 'Halı Yıkama', icon: '🧹', color: '#FFFFFF' },
  { slug: 'ilaclama', name: 'İlaçlama', icon: '🐜', color: '#FFFFFF' },
  { slug: 'marangoz', name: 'Marangoz', icon: '🪵', color: '#FFFFFF' },
  { slug: 'mobilya-montaj', name: 'Mobilya Montajı', icon: '🪛', color: '#FFFFFF' },
  { slug: 'alcipan', name: 'Alçıpan & Boya', icon: '🧱', color: '#FFFFFF' },
  { slug: 'fayans-döseme', name: 'Fayans Döşeme', icon: '🟫', color: '#FFFFFF' },
  { slug: 'parke-döseme', name: 'Parke Döşeme', icon: '🪵', color: '#FFFFFF' },
  { slug: 'kombi-bakimi', name: 'Kombi Bakımı', icon: '🔥', color: '#FFFFFF' },
  { slug: 'klima-servisi', name: 'Klima Servisi', icon: '❄️', color: '#FFFFFF' },
  { slug: 'anahtarcı', name: 'Çilingir', icon: '🔑', color: '#FFFFFF' },
  { slug: 'bahce-bakimi', name: 'Bahçe Bakımı', icon: '🏡', color: '#FFFFFF' },
];

export default function IndexScreen() {
  const router = useRouter();
  const [inputVal, setInputVal] = useState('');
  const [showMoreModal, setShowMoreModal] = useState(false);

  const handleStartChat = async (message: string) => {
    if (!message.trim()) return;
    await startNewSession();
    router.push({
      pathname: '/chat',
      params: { initialMsg: message.trim() }
    });
    setInputVal('');
  };

  const handleChipClick = (catName: string) => {
    setInputVal(`${catName} hizmetine ihtiyacım var.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* Logo & Subtitle */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <Text style={styles.logoText}>esnaaf<Text style={styles.logoDot}>.</Text></Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>CANLI SOHBET</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              İhtiyacınız olan hizmeti doğal dilde yazın, en iyi esnaflardan canlı teklifler alın!
            </Text>
          </View>

          {/* Prompt Area */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textarea}
              placeholder="Size bugün hangi konuda yardımcı olabilirim? (Örn: Beşiktaş'ta acil su sızıntısı var musluk arızası...)"
              placeholderTextColor="#888888"
              multiline
              value={inputVal}
              onChangeText={setInputVal}
            />
            
            <View style={styles.inputActions}>
              <TouchableOpacity 
                style={[styles.sendButton, !inputVal.trim() && styles.sendButtonDisabled]}
                disabled={!inputVal.trim()}
                onPress={() => handleStartChat(inputVal)}
                activeOpacity={0.8}
              >
                <Text style={styles.sendButtonText}>→</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Categories chips */}
          <View style={styles.chipsSection}>
            <Text style={styles.sectionTitle}>Hızlı Seçim</Text>
            <View style={styles.chipsGrid}>
              {PRIMARY_CHIPS.map((cat) => (
                <TouchableOpacity
                  key={cat.slug}
                  style={[styles.chip, { backgroundColor: cat.color }]}
                  onPress={() => handleChipClick(cat.name)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chipText}>{cat.icon} {cat.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.chip, styles.moreChip]}
                onPress={() => setShowMoreModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.moreChipText}>➕ Tümünü Gör</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>

        {/* 20 Categories Bottom-Sheet Modal */}
        <Modal
          visible={showMoreModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowMoreModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tüm Kategoriler</Text>
                <TouchableOpacity 
                  onPress={() => setShowMoreModal(false)}
                  style={styles.closeModalButton}
                >
                  <Text style={styles.closeModalText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalGrid}>
                {ALL_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.slug}
                    style={styles.modalCategoryCard}
                    onPress={() => {
                      handleChipClick(cat.name);
                      setShowMoreModal(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalIcon}>{cat.icon}</Text>
                    <Text style={styles.modalCategoryName}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#232323',
    letterSpacing: -1,
  },
  logoDot: {
    color: '#D4F54E',
  },
  badge: {
    backgroundColor: '#D4F54E',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#232323',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: width - 80,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
    minHeight: 140,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 32,
  },
  textarea: {
    flex: 1,
    fontSize: 14,
    color: '#232323',
    fontWeight: '500',
    textAlignVertical: 'top',
    padding: 0,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  sendButton: {
    backgroundColor: '#D4F54E',
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4F54E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#C0C0C0',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#232323',
  },
  chipsSection: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4F54E',
  },
  chipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#232323',
  },
  moreChip: {
    backgroundColor: '#232323',
    borderColor: 'transparent',
  },
  moreChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 16,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#232323',
  },
  closeModalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888888',
  },
  modalScroll: {
    marginBottom: 16,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  modalCategoryCard: {
    width: (width - 60) / 2,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  modalIcon: {
    fontSize: 28,
  },
  modalCategoryName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#232323',
  },
});
