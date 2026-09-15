import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomBar from './_BottomBar';

const INITIAL_INVENTORY = [
  { id: '1', code: 'ATR-001', name: 'Aethera Ring Size 8', category: 'Smart Ring', stock: 48, minStock: 15 },
  { id: '2', code: 'ATR-002', name: 'Aethera Ring Pro Size 10', category: 'Smart Ring', stock: 8, minStock: 10 },
  { id: '3', code: 'ACC-001', name: 'Charging Case Type-C', category: 'Accessory', stock: 75, minStock: 20 },
  { id: '4', code: 'ACC-002', name: 'Silicone Band Black', category: 'Accessory', stock: 120, minStock: 30 },
];

export default function InventoryScreen() {
  const [items, setItems] = useState(INITIAL_INVENTORY);
  const [search, setSearch] = useState('');

  const updateStock = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item))
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.subtitle}>Stock control & Reorder alerts</Text>
      </View>

      {/* Stock Summary Header */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Ionicons name="archive-outline" size={20} color="#A855F7" />
          <Text style={styles.summaryNum}>251</Text>
          <Text style={styles.summaryLabel}>Total Stock</Text>
        </View>
        <View style={styles.summaryBox}>
          <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
          <Text style={[styles.summaryNum, { color: '#EF4444' }]}>1 Item</Text>
          <Text style={styles.summaryLabel}>Low Stock Alert</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#6B7280" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by code or name..."
          placeholderTextColor="#6B7280"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Inventory Items List */}
      <FlatList
        data={items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        renderItem={({ item }) => {
          const isLowStock = item.stock <= item.minStock;
          return (
            <View style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemCode}>{item.code}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>

                {isLowStock ? (
                  <View style={styles.lowStockBadge}>
                    <Text style={styles.lowStockText}>Low Stock ({item.stock}/{item.minStock})</Text>
                  </View>
                ) : (
                  <Text style={styles.normalStockText}>In Stock: {item.stock}</Text>
                )}
              </View>

              {/* Adjust Quantity Buttons */}
              <View style={styles.stockActionRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateStock(item.id, -1)}>
                  <Ionicons name="remove" size={16} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.qtyCount}>{item.stock}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateStock(item.id, 1)}>
                  <Ionicons name="add" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080711' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  title: { color: '#F8FAFC', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  summaryContainer: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 14 },
  summaryBox: { flex: 1, backgroundColor: '#131224', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#242145' },
  summaryNum: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', marginTop: 6 },
  summaryLabel: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#131224', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#242145', marginHorizontal: 16, marginBottom: 14 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 13 },
  itemCard: { flexDirection: 'row', backgroundColor: '#131224', borderRadius: 14, borderWidth: 1, borderColor: '#242145', padding: 14, marginBottom: 10, alignItems: 'center' },
  itemCode: { color: '#818CF8', fontSize: 11, fontWeight: 'bold' },
  itemName: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  itemCategory: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  lowStockBadge: { backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
  lowStockText: { color: '#EF4444', fontSize: 10, fontWeight: 'bold' },
  normalStockText: { color: '#10B981', fontSize: 11, marginTop: 6, fontWeight: '500' },
  stockActionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1833', borderRadius: 10, padding: 4, borderWidth: 1, borderColor: '#242145' },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#312E81', justifyContent: 'center', alignItems: 'center' },
  qtyCount: { color: '#FFF', fontWeight: 'bold', paddingHorizontal: 10, fontSize: 13 },
});