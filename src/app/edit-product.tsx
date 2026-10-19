import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://119.59.102.161:3084/api';

export default function EditProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [id, setId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('1');

  const [loading, setLoading] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    if (!isInitialized && params) {
      setId(params.id ? String(params.id) : '');
      setName(params.name ? String(params.name) : '');

      // ตัดเครื่องหมาย $ ออกเพื่อให้อยู่ในรูปแบบตัวเลขที่แก้ไขง่าย
      const rawPrice = params.price ? String(params.price) : '0';
      const cleanPrice = rawPrice.replace('$', '').trim();
      setPrice(cleanPrice);

      setStock(params.stock ? String(params.stock) : '0');
      setImage(params.image ? String(params.image) : '');
      setCategoryId(params.category_id ? String(params.category_id) : '1');

      setIsInitialized(true);
    }
  }, [params, isInitialized]);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/products');
    }
  };

  // บันทึกแก้ไขลง Database ตามโครงสร้างตาราง products
  const handleUpdate = async () => {
    if (!id || !name || !price) {
      const msg = 'กรุณากรอกชื่อสินค้าและราคาสินค้า';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('เตือน', msg);
      return;
    }

    try {
      setLoading(true);

      // จัดรูปแบบข้อมูลให้ตรงตาม Column ใน Database
      // price ใส่ $ นำหน้าตามรูปแบบเดิมใน Database
      const formattedPrice = price.startsWith('$') ? price : `$${price.trim()}`;

      const payload = {
        name: name.trim(),
        price: formattedPrice, // VARCHAR(50)
        stock: parseInt(stock, 10) || 0, // INT
        image: image.trim(), // TEXT
        category_id: parseInt(categoryId, 10) || 1, // INT
      };

      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const msg = 'บันทึกการแก้ไขลง Database เรียบร้อยแล้ว';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('สำเร็จ', msg);
        handleGoBack();
      } else {
        const msg = `บันทึกไม่สำเร็จ: ${data.message || data.error || 'Server Error'}`;
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('ข้อผิดพลาด', msg);
      }
    } catch (error: any) {
      const msg = `เชื่อมต่อผิดพลาด: ${error?.message || error}`;
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('ข้อผิดพลาด', msg);
    } finally {
      setLoading(false);
    }
  };

  // ลบสินค้า
  const handleDelete = async () => {
    if (!id) return;

    const doDelete = async () => {
      try {
        setDeleting(true);
        const response = await fetch(`${API_URL}/products/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const msg = 'ลบสินค้าเรียบร้อยแล้ว';
          if (Platform.OS === 'web') alert(msg);
          else Alert.alert('สำเร็จ', msg);
          handleGoBack();
        } else {
          const msg = 'ไม่สามารถลบสินค้าได้';
          if (Platform.OS === 'web') alert(msg);
          else Alert.alert('ข้อผิดพลาด', msg);
        }
      } catch (error: any) {
        console.error(error);
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('คุณต้องการลบสินค้านี้ใช่หรือไม่?')) doDelete();
    } else {
      Alert.alert('ยืนยันการลบ', 'คุณต้องการลบสินค้านี้ใช่หรือไม่?', [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ลบ', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>แก้ไขสินค้า (ID: {id})</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        {image ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: image }} style={styles.imagePreview} />
          </View>
        ) : null}

        <Text style={styles.label}>URL รูปภาพ (image)</Text>
        <TextInput
          style={styles.input}
          placeholder="http://119.59.102.161:3084/uploads/..."
          placeholderTextColor="#6B7280"
          value={image}
          onChangeText={setImage}
        />

        <Text style={styles.label}>ชื่อสินค้า (name)</Text>
        <TextInput
          style={styles.input}
          placeholder="กรอกชื่อสินค้า"
          placeholderTextColor="#6B7280"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>ราคาสินค้า (price)</Text>
        <View style={styles.priceInputContainer}>
          <Text style={styles.currencyPrefix}>$</Text>
          <TextInput
            style={[styles.input, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
            placeholder="10"
            placeholderTextColor="#6B7280"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
        </View>

        <Text style={styles.label}>จำนวนในสต็อก (stock)</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor="#6B7280"
          keyboardType="numeric"
          value={stock}
          onChangeText={setStock}
        />

        <Text style={styles.label}>หมวดหมู่ (category_id)</Text>
        <TextInput
          style={styles.input}
          placeholder="1"
          placeholderTextColor="#6B7280"
          keyboardType="numeric"
          value={categoryId}
          onChangeText={setCategoryId}
        />

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleUpdate}
          disabled={loading || deleting}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>บันทึกการแก้ไขเข้า Database</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          disabled={loading || deleting}
        >
          {deleting ? (
            <ActivityIndicator color="#EF4444" />
          ) : (
            <Text style={styles.deleteBtnText}>ลบสินค้านี้</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080711' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#1E1B3A',
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  formContainer: { padding: 20 },
  previewContainer: { alignItems: 'center', marginBottom: 16 },
  imagePreview: { width: 110, height: 110, borderRadius: 10, borderWidth: 1, borderColor: '#242145' },
  label: { color: '#9CA3AF', fontSize: 14, marginBottom: 6, marginTop: 12, fontWeight: '500' },
  input: {
    backgroundColor: '#131224',
    color: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242145',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    backgroundColor: '#1E1B3A',
    color: '#A78BFA',
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: 'bold',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 1,
    borderColor: '#242145',
  },
  saveBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 28,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  deleteBtnText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
});