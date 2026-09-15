import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Header from './_Header';
import BottomBar from './_BottomBar';

const API_URL = 'http://119.59.102.161:3084/api';

export default function ProductsScreen() {
  const { role: paramRole, userId, username, cartData } = useLocalSearchParams<{
    role?: string;
    userId?: string;
    username?: string;
    cartData?: string;
  }>();

  // จัดการ Role: เช็คเฉพาะ admin หรือ user เท่านั้น
  const [role, setRole] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    const initRole = async () => {
      let currentRole = paramRole?.toLowerCase();
      
      // ถ้าไม่มีส่งมาใน Params ให้ไปดึงจาก AsyncStorage
      if (!currentRole) {
        const savedRole = await AsyncStorage.getItem('userRole');
        currentRole = savedRole?.toLowerCase();
      } else {
        await AsyncStorage.setItem('userRole', currentRole);
      }

      // บังคับจำกัดแค่ 2 สิทธิ์: 'admin' หรือ 'user'
      if (currentRole === 'admin') {
        setRole('admin');
      } else {
        setRole('user');
      }
    };

    initRole();
  }, [paramRole]);

  // ตัวแปรเช็คสิทธิ์แบบตรงไปตรงมา
  const isAdmin = role === 'admin';

  const [cart, setCart] = useState<any[]>(cartData ? JSON.parse(cartData) : []);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('50');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [uploading, setUploading] = useState(false);

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web') alert(`${title}: ${msg}`);
    else Alert.alert(title, msg);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, prodRes] = await Promise.all([
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/products?search=${searchQuery}&category_id=${selectedCategory || ''}`),
      ]);

      const catJson = await catRes.json();
      const prodJson = await prodRes.json();

      if (catJson.status === 'success' || Array.isArray(catJson)) {
        setCategories(catJson.data || catJson);
      }
      if (prodJson.status === 'success' || Array.isArray(prodJson)) {
        setProducts(prodJson.data || prodJson);
      }

      const savedCart = await AsyncStorage.getItem('cart_items');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, selectedCategory]);

  const addToCart = async (product: any) => {
    try {
      const existingCartStr = await AsyncStorage.getItem('cart_items');
      let currentCart = existingCartStr ? JSON.parse(existingCartStr) : cart;

      const existingIndex = currentCart.findIndex((item: any) => item.id === product.id);
      let updatedCart;

      if (existingIndex > -1) {
        updatedCart = [...currentCart];
        updatedCart[existingIndex].quantity = (updatedCart[existingIndex].quantity || 1) + 1;
      } else {
        updatedCart = [...currentCart, { ...product, quantity: 1 }];
      }

      setCart(updatedCart);
      await AsyncStorage.setItem('cart_items', JSON.stringify(updatedCart));
      showAlert('สำเร็จ', `เพิ่ม "${product.name}" ลงในตะกร้าแล้ว`);
    } catch (error) {
      showAlert('ข้อผิดพลาด', 'ไม่สามารถเพิ่มสินค้าลงตะกร้าได้');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setUploading(true);
      const uri = result.assets[0].uri;
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('image', blob, 'upload.jpg');
      } else {
        formData.append('image', {
          uri,
          name: 'upload.jpg',
          type: 'image/jpeg',
        } as any);
      }

      try {
        const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
        const json = await res.json();
        if (json.status === 'success') setImage(json.url);
      } catch (err) {
        showAlert('ข้อผิดพลาด', 'อัปโหลดรูปไม่สำเร็จ');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSaveProduct = async () => {
    if (!name || !price) return showAlert('คำเตือน', 'กรุณากรอกชื่อและราคา');
    try {
      const endpoint = editingProduct ? `${API_URL}/products/${editingProduct.id}` : `${API_URL}/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const formattedPrice = price.startsWith('$') ? price : `฿${price.trim()}`;

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          price: formattedPrice,
          image,
          category_id: parseInt(categoryId, 10) || 1,
          stock: parseInt(stock, 10) || 0,
          description,
        }),
      });

      if (res.ok) {
        showAlert('สำเร็จ', editingProduct ? 'แก้ไขสินค้าสำเร็จ' : 'เพิ่มสินค้าสำเร็จ');
        setModalVisible(false);
        resetForm();
        fetchData();
      } else {
        showAlert('ข้อผิดพลาด', 'บันทึกข้อมูลไม่สำเร็จ');
      }
    } catch (err) {
      showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const doDelete = async () => {
      try {
        const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showAlert('สำเร็จ', 'ลบสินค้าเรียบร้อย');
          setModalVisible(false);
          resetForm();
          fetchData();
        }
      } catch (err) {
        showAlert('ข้อผิดพลาด', 'ไม่สามารถลบสินค้าได้');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('คุณต้องการลบสินค้านี้ใช่หรือไม่?')) doDelete();
    } else {
      Alert.alert('ยืนยันการลบ', 'คุณต้องการลบสินค้านี้ใช่หรือไม่?', [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ลบสินค้า', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setProductCode('');
    setPrice('');
    setImage('');
    setCategoryId('1');
    setStock('50');
    setDescription('');
  };

  const openEditModal = (item: any) => {
    setEditingProduct(item);
    setName(item.name || '');
    setProductCode(item.code || `ATR-00${item.id}`);
    setPrice(String(item.price || '').replace('$', '').replace('฿', '').trim());
    setImage(item.image || '');
    setCategoryId(String(item.category_id || 1));
    setStock(String(item.stock ?? 0));
    setDescription(item.description || '');
    setModalVisible(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Aethera" />

      {/* Top Bar Header */}
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.pageTitle}>Products</Text>
            <Text style={styles.pageSubTitle}>
              {isAdmin ? 'Mode: Admin (แก้ไขจัดการสินค้า)' : 'Mode: User (เลือกซื้อสินค้า)'}
            </Text>
          </View>

          {/* ปุ่มเพิ่มสินค้า: ขึ้นเฉพาะ Admin */}
          {isAdmin && (
            <TouchableOpacity style={styles.addBtnHeader} onPress={openAddModal}>
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={styles.addBtnHeaderText}>เพิ่มสินค้า</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          style={styles.searchBar}
          placeholder="🔍 Search products..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <View style={{ height: 40, marginBottom: 12 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: 'All Products' }, ...categories]}
          keyExtractor={(item, index) => String(item.id || index)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catChip, selectedCategory === item.id && styles.activeCatChip]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text style={[styles.catText, selectedCategory === item.id && styles.activeCatText]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>

      {/* Product List */}
      {loading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor="#8B5CF6" />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: item.image || 'https://via.placeholder.com/100' }}
                  style={styles.productImage}
                />
              </View>

              <View style={styles.productInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.productTitle} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.badgePill}>
                    <Text style={styles.badgeText}>
                      {categories.find((c) => c.id === item.category_id)?.name || 'ทั่วไป'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.productDescription} numberOfLines={2}>
                  {item.description || 'ไม่มีรายละเอียดสินค้าเพิ่มเติม'}
                </Text>

                <View style={styles.priceRow}>
                  <Text style={styles.productPrice}>฿ {String(item.price).replace('$', '').replace('฿', '')}</Text>
                  <View style={styles.stockStatus}>
                    <View style={styles.greenDot} />
                    <Text style={styles.stockText}>In Stock ({item.stock ?? 0})</Text>
                  </View>
                </View>

                {/* แยกตาม Role ชัดเจน: Admin = ปุ่มแก้ไข / User = ปุ่มซื้อ */}
                <View style={styles.cardFooter}>
                  {isAdmin ? (
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                      <Ionicons name="create-outline" size={14} color="#FFF" />
                      <Text style={styles.editBtnText}>แก้ไขสินค้า</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.buyBtn}
                      activeOpacity={0.8}
                      onPress={() => addToCart(item)}
                    >
                      <Ionicons name="cart" size={15} color="#FFFFFF" />
                      <Text style={styles.buyBtnText}>ซื้อ</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* MODAL เพิ่ม / แก้ไขสินค้า */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.backBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitleText}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
            {editingProduct && (
              <View style={styles.previewCard}>
                <View style={styles.previewImageContainer}>
                  <Image
                    source={{ uri: image || editingProduct.image || 'https://via.placeholder.com/100' }}
                    style={styles.previewImage}
                  />
                  <TouchableOpacity style={styles.cameraBadge} onPress={pickImage}>
                    <Text style={{ fontSize: 10 }}>📷</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text style={styles.previewTitle}>{name || editingProduct.name}</Text>
                  <Text style={styles.previewPrice}>฿ {price || editingProduct.price}</Text>
                </View>
              </View>
            )}

            {!editingProduct && (
              <TouchableOpacity style={styles.dottedUploadBox} onPress={pickImage} disabled={uploading}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadMainText}>
                  {uploading ? 'Uploading...' : image ? '✅ Image Uploaded' : 'Tap to upload image'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="ชื่อสินค้า"
                placeholderTextColor="#6B7280"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Price (฿)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="ราคา"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Stock</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="จำนวนสต็อก"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="รายละเอียดสินค้า..."
                placeholderTextColor="#6B7280"
                multiline
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={{ marginVertical: 20, gap: 12 }}>
              <TouchableOpacity style={styles.primaryGradientBtn} onPress={handleSaveProduct}>
                <Text style={styles.primaryBtnText}>
                  {editingProduct ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
                </Text>
              </TouchableOpacity>

              {editingProduct && (
                <TouchableOpacity
                  style={styles.dangerOutlineBtn}
                  onPress={() => handleDeleteProduct(editingProduct.id)}
                >
                  <Text style={styles.dangerBtnText}>🗑 ลบสินค้านี้</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <BottomBar cart={cart} role={role} userId={userId} username={username} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080711' },
  topHeader: { paddingHorizontal: 16, marginTop: 8, marginBottom: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { color: '#F8FAFC', fontSize: 26, fontWeight: 'bold' },
  pageSubTitle: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  addBtnHeader: {
    flexDirection: 'row',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
  },
  addBtnHeaderText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  searchBar: {
    backgroundColor: '#131224',
    color: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242145',
    marginTop: 12,
    fontSize: 13,
  },
  catChip: {
    backgroundColor: '#131224',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#242145',
  },
  activeCatChip: { backgroundColor: '#7C3AED', borderColor: '#8B5CF6' },
  catText: { color: '#9CA3AF', fontSize: 12, fontWeight: '500' },
  activeCatText: { color: '#FFF', fontWeight: 'bold' },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#131224',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242145',
    padding: 12,
    marginBottom: 12,
  },
  imageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#1A1833',
    overflow: 'hidden',
  },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  productInfo: { flex: 1, marginLeft: 12 },
  productTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: 'bold', flex: 1 },
  badgePill: {
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#312E81',
  },
  badgeText: { color: '#818CF8', fontSize: 10, fontWeight: '600' },
  productDescription: { color: '#9CA3AF', fontSize: 12, marginTop: 4, marginBottom: 6 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold' },
  stockStatus: { flexDirection: 'row', alignItems: 'center' },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
  stockText: { color: '#10B981', fontSize: 11 },
  cardFooter: { flexDirection: 'row', marginTop: 8 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  buyBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: '#080711' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backBtnText: { color: '#F8FAFC', fontSize: 28 },
  modalTitleText: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold' },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: '#131224',
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  previewImageContainer: { position: 'relative', width: 60, height: 60 },
  previewImage: { width: 60, height: 60, borderRadius: 12 },
  cameraBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#242145',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  previewPrice: { color: '#FFF', fontSize: 14 },
  dottedUploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3730A3',
    borderRadius: 16,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadIcon: { fontSize: 24, marginBottom: 4 },
  uploadMainText: { color: '#9CA3AF', fontSize: 13 },
  inputGroup: {
    backgroundColor: '#131224',
    borderWidth: 1,
    borderColor: '#242145',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
  },
  inputLabel: { color: '#6B7280', fontSize: 11 },
  textInput: { color: '#F8FAFC', fontSize: 14, marginTop: 2, padding: 0 },
  primaryGradientBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  dangerOutlineBtn: {
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerBtnText: { color: '#EF4444', fontWeight: 'bold', fontSize: 14 },
});