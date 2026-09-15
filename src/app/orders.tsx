import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomBar from './_BottomBar';

// เปลี่ยน URL เป็น IP หรือ Domain ของ Server คุณ
const API_URL = 'http://nindam.sytes.net/api/orders.php';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const fetchOrders = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'All') return true;
    return o.status?.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.subtitle}>Customer transactions & fulfillment</Text>
      </View>

      {/* Tabs Filter */}
      <View style={styles.tabRow}>
        {['All', 'Processing', 'Shipped', 'Delivered'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading Indicator */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#A855F7" />
          <Text style={styles.loadingText}>Loading database orders...</Text>
        </View>
      ) : (
        /* Orders List */
        <FlatList
          data={filteredOrders}
          keyExtractor={(item, index) => String(item.order_id || index)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />
          }
          renderItem={({ item }) => {
            const rawStatus = item.status || 'processing';
            const statusUpper = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
            
            const isShipped = rawStatus.toLowerCase() === 'shipped';
            const isProcessing = rawStatus.toLowerCase() === 'processing' || rawStatus.toLowerCase() === 'paid';

            return (
              <View style={styles.orderCard}>
                <View style={styles.orderCardHeader}>
                  <View>
                    <Text style={styles.orderId}>{item.order_number || `ORD-${item.order_id}`}</Text>
                    <Text style={styles.customerName}>{item.customer_name || 'Customer'}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isShipped
                        ? styles.shippedPill
                        : isProcessing
                        ? styles.procPill
                        : styles.delivPill,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isShipped
                          ? { color: '#3B82F6' }
                          : isProcessing
                          ? { color: '#F59E0B' }
                          : { color: '#10B981' },
                      ]}
                    >
                      {statusUpper}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemDetails}>{item.item_details || 'No items listed'}</Text>

                <View style={styles.orderFooter}>
                  <Text style={styles.orderDate}>{item.formatted_date || item.created_at || 'Recent'}</Text>
                  <Text style={styles.orderTotal}>฿ {Number(item.total_amount || 0).toLocaleString()}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080711' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  title: { color: '#F8FAFC', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 14 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#131224', borderWidth: 1, borderColor: '#242145' },
  activeTabBtn: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  tabText: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  activeTabText: { color: '#FFF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6B7280', marginTop: 10, fontSize: 13 },
  orderCard: { backgroundColor: '#131224', borderRadius: 14, borderWidth: 1, borderColor: '#242145', padding: 14, marginBottom: 10 },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { color: '#818CF8', fontSize: 12, fontWeight: 'bold' },
  customerName: { color: '#F8FAFC', fontSize: 15, fontWeight: 'bold', marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  shippedPill: { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
  procPill: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  delivPill: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  itemDetails: { color: '#9CA3AF', fontSize: 12, marginVertical: 8 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1A1833', paddingTop: 8 },
  orderDate: { color: '#6B7280', fontSize: 11 },
  orderTotal: { color: '#F8FAFC', fontSize: 15, fontWeight: 'bold' },
});