import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import { customFetch, startNewSession, getOrCreateSessionId } from '../src/lib/session';
import { getSocketUrl } from '../src/config';
import ChatBubble from '../src/components/ChatBubble';
import SummaryCard from '../src/components/SummaryCard';
import LiveOfferCard from '../src/components/LiveOfferCard';

const initializedSessions = new Set<string>();

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'offer';
  content: string;
  collected_data?: any;
  offerData?: any;
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialMsg = params.initialMsg as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('greeting');
  const [jobId, setJobId] = useState<string | null>(null);
  const [completionState, setCompletionState] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const socketRef = useRef<Socket | null>(null);
  const hasInitialized = useRef(false);

  // Initialize Sohbet
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeChat = async () => {
      const sessionId = await getOrCreateSessionId();
      if (initializedSessions.has(sessionId)) return;
      initializedSessions.add(sessionId);

      setIsLoading(true);
      try {
        // 1. Initialize anonymous session
        const startRes = await customFetch('/api/ortak/chat/anonim/baslat', { method: 'POST' });
        const startData = await startRes.json();
        
        if (initialMsg && initialMsg.trim() !== '') {
          setMessages([]);
          await sendMessage(initialMsg);
        } else {
          setMessages([
            {
              id: 'system-greet',
              role: 'assistant',
              content: startData.message || 'Merhaba! Esnaaf platformuna hoş geldiniz. Size bugün hangi konuda yardımcı olabilirim?',
            },
          ]);
        }
      } catch (err) {
        console.error('Chat init error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Socket Connection once request is registered
  useEffect(() => {
    if (!jobId) return;

    console.log(`[Socket.io Mobile] Connecting to gateway for Job: ${jobId}`);
    const socketUrl = getSocketUrl();
    const socket = io(`${socketUrl}/chat`, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[Socket.io Mobile] Connected successfully. ID: ${socket.id}`);
      socket.emit('join_job', { jobId });
    });

    socket.on('new_offer', (offer: any) => {
      console.log('[Socket.io Mobile] New offer received:', offer);
      setMessages((prev) => [
        ...prev,
        {
          id: `offer-${Date.now()}-${Math.random()}`,
          role: 'offer',
          content: `🔔 ${offer.provider.name} size teklif verdi.`,
          offerData: {
            id: offer.offerId,
            price: offer.price,
            description: offer.description,
            provider: offer.provider,
          },
        },
      ]);
    });

    // Simulatör completion declared by provider
    socket.on('job_completed_by_provider', (data: any) => {
      setCompletionState('pending_seeker');
      setMessages((prev) => [
        ...prev,
        {
          id: `completion-decl-${Date.now()}`,
          role: 'assistant',
          content: `🔔 Hizmet vereniniz ${data.providerName} işin tamamlandığını beyan etti. Beyan Edilen Ücret: ${data.price} TL.\n\nLütfen web arayüzünden veya kalite panelinden tutarı onaylayın/itiraz edin.`,
        },
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, [jobId]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: messageText,
      },
    ]);

    setIsLoading(true);
    setInputVal('');

    try {
      const response = await customFetch('/api/musteri/chat/mesaj', {
        method: 'POST',
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Mesaj iletilemedi.');
      }

      const data = await response.json();
      setCurrentStep(data.step);

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.responseMessage,
          collected_data: data.collected_data,
        },
      ]);

      // Detect if job is created
      if (data.step === 'completed' || data.responseMessage.includes('Talebiniz #')) {
        const match = data.responseMessage.match(/#([a-fA-C0-9-]{36})/i);
        if (match && match[1]) {
          setJobId(match[1]);
        } else {
          setJobId('mock-job-uuid-12345');
        }
      }
    } catch (err: any) {
      console.error('Message send error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: err.message || 'Sistemimiz yoğun, lütfen tekrar deneyiniz.',
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleSend = () => {
    if (!inputVal.trim()) return;
    sendMessage(inputVal);
  };

  const handleAcceptOffer = (offer: any) => {
    Alert.alert(
      'Teklif Kabul Edildi!',
      `${offer.provider.name} ile telefon numaralarınız karşılıklı olarak açılıyor.\n\nKabul Edilen Ücret: ${offer.price} TL`
    );
  };

  // Simulate provider job completion
  const handleSimulateProviderCompletion = async (price: number) => {
    if (!jobId) {
      Alert.alert('Simülasyon Hatası', 'Simülasyon için önce bir talep oluşturmalısınız!');
      return;
    }
    setIsLoading(true);
    try {
      const res = await customFetch(`/api/ortak/jobs/${jobId}/simulate-provider-complete`, {
        method: 'POST',
        body: JSON.stringify({ price }),
      });
      if (res.ok) {
        Alert.alert('Simülasyon Başarılı', `Usta iş tamamlama beyanı (${price} TL) tetiklendi!`);
      } else {
        throw new Error('Simülasyon başarısız.');
      }
    } catch (err: any) {
      Alert.alert('Simülasyon Hatası', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.logoText}>esnaaf<Text style={styles.logoDot}>.</Text></Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Canlı Sohbet</Text>
          </View>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {!!jobId && !completionState && (
        <View style={styles.simBar}>
          <Text style={styles.simLabel}>🛠️ SIM:</Text>
          <TouchableOpacity 
            style={styles.simButton} 
            onPress={() => handleSimulateProviderCompletion(850)}
          >
            <Text style={styles.simButtonText}>Beyan (850 TL)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.simButton} 
            onPress={() => handleSimulateProviderCompletion(1200)}
          >
            <Text style={styles.simButtonText}>Fark (1200 TL)</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, index) => {
            if (msg.role === 'offer' && msg.offerData) {
              return (
                <LiveOfferCard
                  key={msg.id}
                  offerData={msg.offerData}
                  onAccept={() => handleAcceptOffer(msg.offerData)}
                />
              );
            }

            return (
              <View key={msg.id}>
                <ChatBubble role={msg.role as 'user' | 'assistant' | 'system'} content={msg.content} />
                
                {msg.collected_data && currentStep === 'confirm_form' && index === messages.length - 1 && (
                  <SummaryCard
                    collectedData={msg.collected_data}
                    onAction={(action) => sendMessage(action)}
                  />
                )}
              </View>
            );
          })}

          {isLoading && (
            <View style={styles.typingContainer}>
              <View style={styles.typingAvatar}>
                <Text style={styles.typingAvatarText}>e.</Text>
              </View>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color="#888888" />
              </View>
            </View>
          )}

          {!!jobId && currentStep === 'completed' && !completionState && (
            <View style={styles.waitingContainer}>
              <ActivityIndicator size="large" color="#D4F54E" style={{ marginBottom: 8 }} />
              <Text style={styles.waitingTitle}>Teklifler Bekleniyor...</Text>
              <Text style={styles.waitingSubtitle}>
                Talebiniz bölgedeki en iyi esnaflara iletildi. Teklifler canlı olarak bu ekranda belirecek.
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Mesajınızı yazın..."
              placeholderTextColor="#888888"
              value={inputVal}
              onChangeText={setInputVal}
              editable={!isLoading && currentStep !== 'confirm_form' && currentStep !== 'completed'}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputVal.trim() || isLoading || currentStep === 'confirm_form' || currentStep === 'completed') && 
                styles.sendBtnDisabled
              ]}
              disabled={!inputVal.trim() || isLoading || currentStep === 'confirm_form' || currentStep === 'completed'}
              onPress={handleSend}
              activeOpacity={0.8}
            >
              <Text style={styles.sendIcon}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#232323',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#232323',
  },
  logoDot: {
    color: '#D4F54E',
  },
  badge: {
    backgroundColor: '#D4F54E',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#232323',
  },
  simBar: {
    height: 36,
    backgroundColor: '#232323',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  simLabel: {
    color: '#D4F54E',
    fontSize: 10,
    fontWeight: 'bold',
  },
  simButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  simButtonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  typingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#232323',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  typingAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  waitingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    marginVertical: 10,
  },
  waitingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#232323',
  },
  waitingSubtitle: {
    fontSize: 11,
    color: '#888888',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  inputWrapper: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#232323',
    fontWeight: '500',
    paddingVertical: 6,
  },
  sendBtn: {
    backgroundColor: '#D4F54E',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#C0C0C0',
  },
  sendIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232323',
  },
});
