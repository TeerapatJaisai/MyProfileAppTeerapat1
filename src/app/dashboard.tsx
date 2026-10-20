import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from './_Header';
import BottomBar from './_BottomBar';

const API_URL = 'http://119.59.102.161:3084/api';

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
  const [loading, setLoading] = useState<boolean>(true);

  const [stats, setStats] = useState<DashboardStats>({
    total_sales: '0.00',
    total_orders: 0,
    total_products: 0,
    total_users: 0,
  });

  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: { data: number[] }[];
  }>({
    labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0] }],
  });

  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [statsRes, chartRes, lowStockRes, topProductsRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`),
        fetch(`${API_URL}/admin/monthly-sales`),
        fetch(`${API_URL}/admin/low-stock-products`),
        fetch(`${API_URL}/admin/top-products`),
      ]);

      const statsContentType = statsRes.headers.get("content-type");
      if (statsContentType && statsContentType.includes("application/json")) {
        const statsJson = await statsRes.json();
        if (statsJson.status === 'success') setStats(statsJson.data);
      }

      const chartContentType = chartRes.headers.get("content-type");
      if (chartContentType && chartContentType.includes("application/json")) {
        const chartJson = await chartRes.json();
        if (chartJson.status === 'success' && chartJson.data) setChartData(chartJson.data);
      }

      const lowStockContentType = lowStockRes.headers.get("content-type");
      if (lowStockContentType && lowStockContentType.includes("application/json")) {
        const lowStockJson = await lowStockRes.json();
        if (lowStockJson.status === 'success') setLowStockProducts(lowStockJson.data);
      }

      const topProductsContentType = topProductsRes.headers.get("content-type");
      if (topProductsContentType && topProductsContentType.includes("application/json")) {
        const topProductsJson = await topProductsRes.json();
        if (topProductsJson.status === 'success') setTopProducts(topProductsJson.data);
      }

    } catch (err) {
      console.error('Fetch Dashboard Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

      fetchDashboardData();
    };

    loadInitData();
  }, [paramRole]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const salesArray = chartData.datasets[0]?.data || [0];
  const maxAmount = Math.max(...salesArray, 1);

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
          <Text style={styles.headerSubtitle}>ภาพรวมระบบ ยอดขาย สินค้าใกล้หมด และสินค้าขายดี</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={{ marginVertical: 40 }} />
        ) : (
          <>
            {/* Grid การ์ดสถิติ */}
            <View style={styles.statsContainer}>
              <View style={[styles.card, { borderLeftColor: '#10B981' }]}>
                <Text style={styles.cardLabel}>💰 ยอดขายรวม (Total Sales)</Text>
                <Text style={styles.cardValue}>฿{stats.total_sales}</Text>
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

            {/* 🏆 สินค้าขายดี (Top Selling Products) */}
            <View style={styles.chartContainer}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>🏆 สินค้าขายดี (Top Selling)</Text>
                <Text style={{ color: '#10B981', fontSize: 12, fontWeight: 'bold' }}>
                  {topProducts.length} อันดับยอดฮิต
                </Text>
              </View>

              {topProducts.length === 0 ? (
                <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
                  🛒 ยังไม่มีประวัติการขายสินค้าในระบบ
                </Text>
              ) : (
                topProducts.map((item, index) => (
                  <View key={item.id} style={styles.listItem}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>
                    <Image
                      source={{ uri: item.image || 'https://via.placeholder.com/40' }}
                      style={styles.listImage}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.listName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.listPrice}>{item.price}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: '#065F46', borderColor: '#047857' }]}>
                      <Text style={[styles.badgeText, { color: '#6EE7B7' }]}>ขายแล้ว {item.total_sold} ชิ้น</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* ⚠️ สินค้าใกล้หมดสต็อก (Low Stock Alert) */}
            <View style={styles.chartContainer}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>⚠️ สินค้าใกล้หมดสต็อก (Low Stock)</Text>
                <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: 'bold' }}>
                  {lowStockProducts.length} รายการ
                </Text>
              </View>

              {lowStockProducts.length === 0 ? (
                <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
                  🎉 ยอดเยี่ยม! ไม่มีสินค้าใกล้หมดในขณะนี้
                </Text>
              ) : (
                lowStockProducts.map((item) => (
                  <View key={item.id} style={styles.listItem}>
                    <Image
                      source={{ uri: item.image || 'https://via.placeholder.com/40' }}
                      style={styles.listImage}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.listName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.listPrice}>{item.price}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: '#7F1D1D', borderColor: '#991B1B' }]}>
                      <Text style={[styles.badgeText, { color: '#FCA5A5' }]}>เหลือ {item.stock} ชิ้น</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* 📈 กราฟแท่งแสดงข้อมูลยอดขายจริง */}
            <View style={styles.chartContainer}>
              <Text style={styles.sectionTitle}>📈 สถิติยอดขายจริง (Sales Overview)</Text>
              <View style={styles.barChartWrapper}>
                {chartData.labels.map((label, index) => {
                  const val = salesArray[index] || 0;
                  const heightPercent = (val / maxAmount) * 100;

                  return (
                    <View key={index} style={styles.barColumn}>
                      <Text style={styles.barValueText}>{val}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { height: `${Math.max(heightPercent, 10)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabelText}>{label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* เมนูด่วน */}
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
          </>
        )}
      </ScrollView>

      <BottomBar cart={cart} role={role} userId={userId} username={username} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080711' },
  content: { flex: 1, padding: 16 },
  header: { marginBottom: 20, marginTop: 10 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  statsContainer: { gap: 12, marginBottom: 24 },
  card: {
    backgroundColor: '#131224',
    borderRadius: 12,
    padding: 18,
    borderLeftWidth: 6,
    borderWidth: 1,
    borderColor: '#242145',
  },
  cardLabel: { fontSize: 14, color: '#9CA3AF', marginBottom: 6, fontWeight: '500' },
  cardValue: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF' },
  chartContainer: {
    marginBottom: 24,
    backgroundColor: '#131224',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242145',
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#E5E7EB', marginBottom: 12 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1833',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2D2950',
  },
  listImage: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#080711' },
  listName: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold' },
  listPrice: { color: '#818CF8', fontSize: 11, marginTop: 2 },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rankText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  barChartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 20,
    paddingHorizontal: 8,
  },
  barColumn: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barValueText: { color: '#A78BFA', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  barTrack: {
    width: 22,
    height: 100,
    backgroundColor: '#1E1B4B',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', backgroundColor: '#7C3AED', borderRadius: 6 },
  barLabelText: { color: '#9CA3AF', fontSize: 12, marginTop: 6 },
  quickActionsContainer: { marginBottom: 30 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
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
  actionText: { fontSize: 14, fontWeight: '600', color: '#C084FC' },
});