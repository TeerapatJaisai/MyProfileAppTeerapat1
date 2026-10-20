import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  SafeAreaView,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Header from './_Header';
import BottomBar from './_BottomBar';

const API_URL = 'http://119.59.102.161:3084/api';
const PROMPTPAY_NUMBER = '0625613653'; // 👈 เบอร์ PromptPay สำหรับสร้าง QR Code

export default function CartScreen() {
  const router = useRouter();
  const { role: paramRole, userId, username, cartData } = useLocalSearchParams<{
    role?: string;
    userId?: string;
    username?: string;
    cartData?: string;
  }>();

  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [cart, setCart] = useState<any[]>(cartData ? JSON.parse(cartData) : []);
  
  const [address, setAddress] = useState('');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadInitData = async () => {
      let currentRole = paramRole?.toLowerCase();
      if (!currentRole) {
        const savedRole = await AsyncStorage.getItem('userRole');
        currentRole = savedRole?.toLowerCase();
      }
      if (currentRole === 'admin') setRole('admin');

      const savedCart = await AsyncStorage.getItem('cart_items');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    };
    loadInitData();
  }, [paramRole]);

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web') alert(`${title}: ${msg}`);
    else Alert.alert(title, msg);
  };

  const updateCartStorage = async (newCart: any[]) => {
    setCart(newCart);
    await AsyncStorage.setItem('cart_items', JSON.stringify(newCart));
  };

  const updateQuantity = (id: number, delta: number) => {
    const updatedCart = cart
      .map((item) => {
        if (item.id === id) {
          const newQty = (item.quantity || 1) + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean);

    updateCartStorage(updatedCart);
  };

  const removeItem = (id: number) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    updateCartStorage(updatedCart);
  };

  const parsePrice = (priceVal: any): number => {
    if (typeof priceVal === 'number') return priceVal;
    const cleanStr = String(priceVal || '0').replace(/[^0-9.]/g, '');
    return parseFloat(cleanStr) || 0;
  };

  const calculateTotal = (): number => {
    return cart.reduce((sum, item) => {
      const price = parsePrice(item.price);
      const qty = parseInt(item.quantity, 10) || 1;
      return sum + price * qty;
    }, 0);
  };

  const handleOpenCheckoutModal = () => {
    if (cart.length === 0) {
      showAlert('คำเตือน', 'ไม่มีสินค้าในตะกร้า');
      return;
    }
    if (!address.trim()) {
      showAlert('คำเตือน', 'กรุณากรอกที่อยู่จัดส่งสินค้าก่อนชำระเงิน');
      return;
    }
    setQrModalVisible(true);
  };

  // 🚀 ระบบจำลองสแกนจ่ายสำเร็จแล้วตัดยอดอัตโนมัติ
  const handleAutoPaymentSuccess = async () => {
    setIsProcessing(true);

    setTimeout(async () => {
      const totalAmount = calculateTotal();

      try {
        const orderData = {
          user_id: userId ? parseInt(userId, 10) : 1,
          total_amount: totalAmount,
          address: address,
          items: cart.map((item) => ({
            id: item.id,
            quantity: item.quantity || 1,
            price: parsePrice(item.price),
          })),
        };

        const response = await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });

        const result = await response.json();
        setIsProcessing(false);
        setQrModalVisible(false);

        if (response.ok && result.status === 'success') {
          showAlert('ชำระเงินสำเร็จ 🎉', `ระบบตรวจสอบการโอนเงินเรียบร้อย ยอด ฿${totalAmount.toLocaleString()}`);
          setCart([]);
          setAddress('');
          await AsyncStorage.removeItem('cart_items');
          router.push({
            pathname: '/products',
            params: { role, userId, username },
          });
        } else {
          showAlert('ข้อผิดพลาด', result.message || 'ไม่สามารถบันทึกคำสั่งซื้อได้');
        }
      } catch (error) {
        setIsProcessing(false);
        setQrModalVisible(false);
        console.error('Checkout error:', error);
        showAlert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อชำระเงินได้');
      }
    }, 2500);
  };

  const totalPrice = calculateTotal();

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Aethera" />

      <View style={styles.headerTitleContainer}>
        <Text style={styles.pageTitle}>Shopping Cart</Text>
        <Text style={styles.pageSubTitle}>รายการสินค้าและที่อยู่จัดส่ง</Text>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#4B5563" />
          <Text style={styles.emptyText}>ไม่มีสินค้าในตะกร้า</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push({ pathname: '/products', params: { role, userId, username } })}
          >
            <Text style={styles.shopBtnText}>ไปเลือกซื้อสินค้า</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
          {cart.map((item) => {
            const itemPrice = parsePrice(item.price);
            const qty = item.quantity || 1;

            return (
              <View key={item.id} style={styles.cartCard}>
                <Image
                  source={{ uri: item.image || 'https://via.placeholder.com/80' }}
                  style={styles.productImage}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemPrice}>฿ {itemPrice.toLocaleString()}</Text>

                  <View style={styles.qtyContainer}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, -1)}>
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{qty}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })}

          <View style={styles.addressSection}>
            <Text style={styles.sectionLabel}>📍 ที่อยู่สำหรับจัดส่งสินค้า (Shipping Address)</Text>
            <TextInput
              style={styles.addressInput}
              placeholder="กรอกบ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์..."
              placeholderTextColor="#6B7280"
              multiline
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <View style={styles.checkoutFooterCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>ราคารวมทั้งหมด</Text>
              <Text style={styles.totalAmount}>฿ {totalPrice.toLocaleString()}</Text>
            </View>

            <TouchableOpacity style={styles.checkoutBtn} onPress={handleOpenCheckoutModal}>
              <Text style={styles.checkoutBtnText}>สแกน PromptPay QR ชำระเงิน</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* 📲 MODAL แสดง PromptPay Dynamic QR Code */}
      <Modal visible={qrModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>PromptPay QR Code</Text>
            <Text style={styles.modalSubTitle}>ยอดชำระสุทธิ: ฿ {totalPrice.toLocaleString()}</Text>

            <View style={styles.qrBox}>
              <Image
                source={{
                  uri: `https://promptpay.io/${PROMPTPAY_NUMBER}/${totalPrice}.png`,
                }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.promptpayDetailText}>
              เบอร์พร้อมเพย์: {PROMPTPAY_NUMBER}
            </Text>

            {isProcessing ? (
              <View style={{ alignItems: 'center', marginVertical: 10 }}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={{ color: '#10B981', marginTop: 8, fontWeight: 'bold' }}>
                  กำลังตรวจสอบการชำระเงินอัตโนมัติ...
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.qrInstruction}>
                  (ระบบจำลอง) สแกนจ่ายด้วยแอปธนาคารแล้วกดปุ่มด้านล่างเพื่อยืนยัน
                </Text>

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#374151' }]}
                    onPress={() => setQrModalVisible(false)}
                  >
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>ยกเลิก</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#10B981' }]}
                    onPress={handleAutoPaymentSuccess}
                  >
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>📲 ยืนยันชำระเงินแล้ว</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <BottomBar cart={cart} role={role} userId={userId} username={username} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080711' },
  headerTitleContainer: { paddingHorizontal: 16, marginTop: 8, marginBottom: 12 },
  pageTitle: { color: '#F8FAFC', fontSize: 26, fontWeight: 'bold' },
  pageSubTitle: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 16, marginTop: 12, marginBottom: 20 },
  shopBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  shopBtnText: { color: '#FFF', fontWeight: 'bold' },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#131224',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242145',
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  productImage: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#1A1833' },
  itemDetails: { flex: 1, marginLeft: 12 },
  itemTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: 'bold' },
  itemPrice: { color: '#818CF8', fontSize: 14, fontWeight: '600', marginTop: 2 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  qtyBtn: { backgroundColor: '#242145', width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  qtyText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, paddingHorizontal: 4 },
  deleteBtn: { padding: 8 },
  addressSection: {
    backgroundColor: '#131224',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242145',
    padding: 14,
    marginBottom: 16,
  },
  sectionLabel: { color: '#C084FC', fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
  addressInput: {
    backgroundColor: '#080711',
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#242145',
    borderRadius: 8,
    padding: 10,
    height: 80,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  checkoutFooterCard: {
    backgroundColor: '#131224',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242145',
    padding: 16,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  totalLabel: { color: '#9CA3AF', fontSize: 14 },
  totalAmount: { color: '#10B981', fontSize: 18, fontWeight: 'bold' },
  checkoutBtn: { backgroundColor: '#7C3AED', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  checkoutBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#131224', padding: 24, borderRadius: 16, width: '85%', alignItems: 'center', borderWidth: 1, borderColor: '#242145' },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  modalSubTitle: { color: '#10B981', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  qrBox: { padding: 12, backgroundColor: '#FFF', borderRadius: 12, marginBottom: 8 },
  qrImage: { width: 180, height: 180 },
  promptpayDetailText: { color: '#9CA3AF', fontSize: 13, fontWeight: 'bold', marginBottom: 12 },
  qrInstruction: { color: '#6B7280', fontSize: 11, textAlign: 'center', marginBottom: 16 },
  modalBtnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  modalActionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
});