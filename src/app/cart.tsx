import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Header from './_Header';
import BottomBar from './_BottomBar';

const API_URL = 'http://119.59.102.161:3084/api';

// ฟังก์ชันแปลงราคาเป็นตัวเลขอย่างปลอดภัย (ป้องกัน NaN)
const parsePrice = (price: any): number => {
  if (typeof price === 'number') return price;
  if (!price) return 0;
  const cleaned = String(price).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูลตะกร้าสินค้าจาก AsyncStorage
  const loadCart = async () => {
    try {
      const data = await AsyncStorage.getItem('cart_items');
      if (data) {
        setCartItems(JSON.parse(data));
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Failed to load cart items:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [])
  );

  // บันทึกข้อมูลตะกร้าใหม่ลง AsyncStorage
  const saveCart = async (newCart: any[]) => {
    try {
      setCartItems(newCart);
      await AsyncStorage.setItem('cart_items', JSON.stringify(newCart));
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  };

  // ปรับเพิ่ม / ลด จำนวนสินค้า
  const updateQuantity = (id: any, change: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.id === id) {
          const newQty = (item.quantity || 1) + change;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean);

    saveCart(updated);
  };

  // ลบสินค้าออกจากตะกร้า
  const removeItem = (id: any) => {
    const updated = cartItems.filter((item) => item.id !== id);
    saveCart(updated);
  };

  // คำนวณราคารวมทั้งหมด
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + parsePrice(item.price) * (item.quantity || 1),
    0
  );

  // ชำระเงิน + ยิง API ไปตัดสต๊อกในฐานข้อมูล
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    const message = `ยืนยันการชำระเงิน ยอดรวม ฿${totalPrice.toLocaleString()} บาท`;

    const processCheckout = async () => {
      try {
        setLoading(true);

        // วนลูปยิง API อัปเดตลดสต๊อกสินค้าทีละรายการใน Database
        for (const item of cartItems) {
          const currentStock = Number(item.stock ?? 0);
          const qty = Number(item.quantity ?? 1);
          const updatedStock = Math.max(0, currentStock - qty);

          await fetch(`${API_URL}/products/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: item.name,
              price: item.price,
              image: item.image,
              category_id: item.category_id,
              description: item.description,
              stock: updatedStock, // อัปเดตสต็อกใหม่ที่ลบแล้ว
            }),
          });
        }

        // เคลียร์ตะกร้าสินค้าในเครื่องเมื่อตัดสต๊อกเรียบร้อย
        await AsyncStorage.removeItem('cart_items');
        setCartItems([]);

        if (Platform.OS === 'web') {
          alert('ชำระเงินสำเร็จ และตัดสต๊อกสินค้าเรียบร้อยแล้ว!');
        } else {
          Alert.alert('สำเร็จ', 'ชำระเงินสำเร็จ และตัดสต๊อกสินค้าเรียบร้อยแล้ว!');
        }
      } catch (error) {
        console.error('Checkout error:', error);
        if (Platform.OS === 'web') alert('เกิดข้อผิดพลาดในการตัดสต๊อกสินค้า');
        else Alert.alert('ข้อผิดพลาด', 'ไม่สามารถตัดสต๊อกสินค้าได้');
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        await processCheckout();
      }
    } else {
      Alert.alert('ยืนยันการสั่งซื้อ', message, [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ชำระเงิน', onPress: processCheckout },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Aethera" />

      {/* Header Title */}
      <View style={styles.topHeader}>
        <Text style={styles.pageTitle}>Shopping Cart</Text>
        <Text style={styles.pageSubTitle}>รายการสินค้าที่คุณเลือกไว้</Text>
      </View>

      {/* Cart List */}
      {loading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 40 }} />
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#4B5563" />
          <Text style={styles.emptyText}>ไม่มีสินค้าในตะกร้า</Text>
        </View>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item, index) => String(item.id || index)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.cartCard}>
              <Image
                source={{ uri: item.image || item.image_url || 'https://via.placeholder.com/100' }}
                style={styles.cartImage}
              />

              <View style={styles.cartInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>฿ {parsePrice(item.price).toLocaleString()}</Text>

                {/* ปุ่มเพิ่ม-ลดจำนวน */}
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, -1)}
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>

                  <Text style={styles.qtyText}>{item.quantity || 1}</Text>

                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, 1)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ปุ่มลบรายการ */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => removeItem(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Footer ยอดรวม & ปุ่มสั่งซื้อ */}
      {cartItems.length > 0 && (
        <View style={styles.footerContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>ราคารวมทั้งหมด</Text>
            <Text style={styles.totalAmount}>฿ {totalPrice.toLocaleString()}</Text>
          </View>

          <TouchableOpacity
            style={styles.checkoutBtn}
            activeOpacity={0.8}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutBtnText}>ชำระเงิน</Text>
          </TouchableOpacity>
        </View>
      )}

      <BottomBar cart={cartItems} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080711' },
  topHeader: { paddingHorizontal: 16, marginTop: 8, marginBottom: 12 },
  pageTitle: { color: '#F8FAFC', fontSize: 26, fontWeight: 'bold' },
  pageSubTitle: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6B7280', fontSize: 16, marginTop: 12 },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#131224',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242145',
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  cartImage: { width: 75, height: 75, borderRadius: 12, backgroundColor: '#1A1833' },
  cartInfo: { flex: 1, marginLeft: 12 },
  itemTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: 'bold' },
  itemPrice: { color: '#818CF8', fontSize: 14, fontWeight: '600', marginVertical: 4 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  qtyBtn: {
    backgroundColor: '#242145',
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  qtyText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  deleteBtn: { padding: 8 },
  footerContainer: {
    backgroundColor: '#131224',
    borderTopWidth: 1,
    borderColor: '#242145',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  totalLabel: { color: '#9CA3AF', fontSize: 14 },
  totalAmount: { color: '#10B981', fontSize: 20, fontWeight: 'bold' },
  checkoutBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});