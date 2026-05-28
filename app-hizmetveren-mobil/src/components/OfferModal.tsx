import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';

interface OfferModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (price: number, description: string) => void;
  categoryName: string;
}

export default function OfferModal({ visible, onClose, onSubmit, categoryName }: OfferModalProps) {
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      Alert.alert('Geçersiz Fiyat', 'Lütfen geçerli bir teklif tutarı girin.');
      return;
    }
    if (description.trim().length < 10) {
      Alert.alert('Çok Kısa Açıklama', 'Teklif notunuzun en az 10 karakter olması gerekmektedir.');
      return;
    }
    onSubmit(numPrice, description.trim());
    setPrice('');
    setDescription('');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>⚡ Teklif Ver: {categoryName}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Inputs */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Teklif Fiyatı (TL):</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Örn: 850"
                  placeholderTextColor="#888888"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Müşteriye Not / Açıklama:</Text>
                <TextInput
                  style={styles.textarea}
                  placeholder="Malzemeler dahil mi, ne zaman gelebilirsiniz? En az 10 karakter yazın..."
                  placeholderTextColor="#888888"
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Submit CTA */}
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>Teklifi Gönder</Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#232323',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888888',
  },
  form: {
    flexDirection: 'column',
    gap: 16,
  },
  inputGroup: {
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888888',
  },
  priceInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontWeight: '900',
    color: '#232323',
  },
  textarea: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#232323',
    fontWeight: '500',
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#D4F54E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4F54E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#232323',
  },
});
