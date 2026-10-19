import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './_Header';
import BottomBar from './_BottomBar';

interface DashboardStats {
  total_sales: string;
  total_orders: number;
  total_products: number;
  total_users: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { role: paramRole, userId, username, cartData } = useLocalSearchParams<{
    role?: string;
    userId?: string;
    username?: string;
    cartData?: string;
  }>();

  const [role, setRole] = useState<'admin' | 'user'>('admin');
  const [cart, setCart] = useState<any[]>(cartData ? JSON.parse(cartData) : []);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const loadInitData = async () => {
      let currentRole = paramRole?.toLowerCase();
      if (!currentRole) {
        const savedRole = await AsyncStorage.getItem('userRole');
        currentRole = savedRole?.toLowerCase();
      }
      if (currentRole === 'admin') setRole('admin');

      const savedCart = await AsyncStorage.getItem('cart_items');
      if (savedCart) setCart(JSON.parse(savedCart));
    };
    loadInitData();
  }, [paramRole]);

  const [stats] = useState<DashboardStats>({
    total_sales: '2540.00',
    total_orders: 8,
    total_products: 12,
    total_users: 4,
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Aethera" />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📊 Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>ภาพรวมระบบและสถิติการใช้งานภายในร้าน</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.card, { borderLeftColor: '#10B981' }]}>
            <Text style={styles.cardLabel}>💰 ยอดขายรวม (Total Sales)</Text>
            <Text style={styles.cardValue}>${stats.total_sales}</Text>
          </View>

          <View style={[styles.card, { borderLeftColor: '#3B82F6' }]}>
            <Text style={styles.cardLabel}>📦 คำสั่งซื้อทั้งหมด (Orders)</Text>
            <Text style={styles.cardValue}>{stats.total_orders}</Text>
          </View>

          <View style={[styles.card, { borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.cardLabel}>🏷️ จำนวนสินค้าในระบบ (Products)</Text>
            <Text style={styles.cardValue}>{stats.total_products}</Text>
          </View>

          <View style={[styles.card, { borderLeftColor: '#8B5CF6' }]}>
            <Text style={styles.cardLabel}>👥 ผู้ใช้งานทั้งหมด (Users)</Text>
            <Text style={styles.cardValue}>{stats.total_users}</Text>
          </View>
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>⚡ เมนูด่วน (Quick Actions)</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/products')}
            >
              <Text style={styles.actionText}>📦 จัดการสินค้า</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/cart')}
            >
              <Text style={styles.actionText}>🛒 ตะกร้าสินค้า</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <BottomBar cart={cart} role={role} userId={userId} username={username} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080711',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#131224',
    borderRadius: 12,
    padding: 18,
    borderLeftWidth: 6,
    borderWidth: 1,
    borderColor: '#242145',
  },
  cardLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 6,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quickActionsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E5E7EB',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#131224',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#242145',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C084FC',
  },
});