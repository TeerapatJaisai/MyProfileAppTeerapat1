import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  title?: string;
}

export default function Header({ title = 'Aethera' }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        // ลบข้อมูลเซสชันล็อกอินและสินค้าในตะกร้า
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('cart_items');

        // นำผู้ใช้กลับไปยังหน้าเข้าสู่ระบบ
        router.replace('/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    };

    const confirmMsg = 'คุณต้องการออกจากระบบใช่หรือไม่?';

    // รองรับทั้งระบบ Web และ Mobile App
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        await doLogout();
      }
    } else {
      Alert.alert('ออกจากระบบ', confirmMsg, [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ออกจากระบบ', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>{title}</Text>

      <TouchableOpacity
        style={styles.logoutBtn}
        activeOpacity={0.7}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={16} color="#F87171" style={{ marginRight: 4 }} />
        <Text style={styles.logoutText}>ออกจากระบบ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#080711',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1D36',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A1824',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  logoutText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '600',
  },
});