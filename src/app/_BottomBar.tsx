import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface BottomBarProps {
  cart?: any[];
  role?: string;
  userId?: string;
  username?: string;
}

export default function BottomBar({ cart = [], role, userId, username }: BottomBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigateTo = (path: string) => {
    router.push({
      pathname: path as any,
      params: { role, userId, username }, // ✅ แนบ Role ไปด้วยทุกครั้งที่เปลี่ยนหน้า
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => navigateTo('/products')}
      >
        <Ionicons name="cube-outline" size={22} color={pathname.includes('products') ? '#7C3AED' : '#6B7280'} />
        <Text style={[styles.label, pathname.includes('products') && styles.activeLabel]}>Products</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => navigateTo('/cart')}
      >
        <Ionicons name="cart-outline" size={22} color={pathname.includes('cart') ? '#7C3AED' : '#6B7280'} />
        <Text style={[styles.label, pathname.includes('cart') && styles.activeLabel]}>Cart ({cart.length})</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#131224',
    borderTopWidth: 1,
    borderTopColor: '#242145',
  },
  tab: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  activeLabel: { color: '#7C3AED', fontWeight: 'bold' }
});