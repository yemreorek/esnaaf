import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface LiveOfferCardProps {
  offerData: {
    id: string | number;
    price: number;
    description: string;
    provider: {
      id: string;
      name: string;
      rating: number;
    };
  };
  onAccept: () => void;
}

export default function LiveOfferCard({ offerData, onAccept }: LiveOfferCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.providerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🛠️</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.name}>{offerData.provider.name}</Text>
            <Text style={styles.rating}>
              ⭐ {offerData.provider.rating.toFixed(1)} Puan · Uzman Esnaf
            </Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{offerData.price} TL</Text>
        </View>
      </View>

      <Text style={styles.description}>
        &ldquo;{offerData.description}&rdquo;
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
          <Text style={styles.secondaryButtonText}>Profili Gör</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
          <Text style={styles.secondaryButtonText}>Mesaj Gönder</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={onAccept}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Kabul Et</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4F54E',
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
    width: '100%',
    shadowColor: '#D4F54E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 12,
    marginBottom: 10,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#232323',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 20,
  },
  textContainer: {
    flexDirection: 'column',
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#232323',
  },
  rating: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '600',
    marginTop: 2,
  },
  priceContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: '900',
    color: '#232323',
  },
  description: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 18,
    fontStyle: 'italic',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#232323',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#D4F54E',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4F54E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#232323',
  },
});
