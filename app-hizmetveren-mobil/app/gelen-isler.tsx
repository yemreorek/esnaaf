import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import { customFetch } from '../src/lib/auth';
import { getSocketUrl } from '../src/config';
import JobCard from '../src/components/JobCard';
import OfferModal from '../src/components/OfferModal';

interface Job {
  id: string;
  category: {
    name: string;
    slug: string;
  };
  form_data: any;
  viewerCount?: number;
  created_at?: string;
}

export default function GelenIslerScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Offer modal states
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchIncomingJobs();
    setupWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchIncomingJobs = async () => {
    setIsLoading(true);
    try {
      const res = await customFetch('/api/hizmetveren/gelen-isler');
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      } else {
        // Fallback mock jobs for development/preview of Phase 2categories
        setJobs([
          {
            id: 'job-mock-1',
            category: { name: 'Ev Temizliği', slug: 'ev-temizligi' },
            form_data: { district: 'Kadıköy', daireTipi: '3+1', tarih: 'Bugün 14:00', details: 'Detaylı genel ev temizliği yapılacak.' },
            viewerCount: 2
          },
          {
            id: 'job-mock-2',
            category: { name: 'Boya Badana', slug: 'boya-badana' },
            form_data: { district: 'Beşiktaş', metrekare: '120 m²', tur: 'İç mekan', renkTip: 'Beyaz Saten', details: 'Salon ve 2 oda boyanacak.' },
            viewerCount: 4
          },
          {
            id: 'job-mock-3',
            category: { name: 'Su Tesisatı', slug: 'su-tesisati' },
            form_data: { district: 'Şişli', sorunTuru: 'su sızıntısı', aciliyet: 'Acil (bugün)', details: 'Mutfak bataryasının altından su kaçırıyor.' },
            viewerCount: 1
          }
        ]);
      }
    } catch (err) {
      console.error('Fetch gelen isler error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const setupWebSocket = () => {
    console.log('[Socket.io Partner] Connecting to ws for provider jobs...');
    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[Socket.io Partner] Socket connected. ID: ${socket.id}`);
      // Join global provider feed or usta specific room
      socket.emit('join_job', { jobId: 'global_provider_feed' });
    });

    // Listen for new matching job offers
    socket.on('new_request_distributed', (newJob: any) => {
      console.log('[Socket.io Partner] Real-time job distributed:', newJob);
      // Prepend new job to the list
      setJobs((prev) => [newJob, ...prev]);
    });
  };

  const handleOfferSubmit = async (price: number, description: string) => {
    if (!selectedJob) return;
    setIsLoading(true);
    setShowOfferModal(false);

    try {
      const res = await customFetch('/api/hizmetveren/teklifler', {
        method: 'POST',
        body: JSON.stringify({
          jobId: selectedJob.id,
          price,
          description
        })
      });

      if (res.ok) {
        Alert.alert(
          'Teklif Gönderildi!',
          'Teklifiniz başarıyla müşteriye iletildi. Müşteri kabul ettiğinde anlık olarak haberdar edileceksiniz.'
        );
        // Remove job from unmatched list since offer is submitted
        setJobs((prev) => prev.filter((j) => j.id !== selectedJob.id));
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Teklif verilemedi.');
      }
    } catch (err: any) {
      console.error('Submit offer error:', err);
      Alert.alert('Hata', err.message || 'Bir sorun oluştu.');
    } finally {
      setIsLoading(false);
      setSelectedJob(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Dağıtılan Aktif İşler</Text>
        <TouchableOpacity onPress={fetchIncomingJobs} style={styles.refreshButton}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Main Jobs Feed */}
      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#D4F54E" />
        </View>
      )}

      {!isLoading && (
        <ScrollView contentContainerStyle={styles.scroll}>
          {jobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>☕ Şu an sizinle eşleşen aktif bir talep bulunmuyor.</Text>
              <Text style={styles.emptySubtext}>Yeni talepler düştüğünde canlı olarak burada listelenecektir.</Text>
            </View>
          ) : (
            jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onOfferPress={() => {
                  setSelectedJob(job);
                  setShowOfferModal(true);
                }}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Offer Modal popup */}
      {selectedJob && (
        <OfferModal
          visible={showOfferModal}
          categoryName={selectedJob.category.name}
          onClose={() => {
            setShowOfferModal(false);
            setSelectedJob(null);
          }}
          onSubmit={handleOfferSubmit}
        />
      )}

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
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#232323',
  },
  refreshButton: {
    padding: 8,
  },
  refreshText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#232323',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#232323',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
  },
});
