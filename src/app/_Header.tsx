import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HeaderProps {
  title?: string;
}

export default function Header({ title = 'Aethera' }: HeaderProps) {
  const router = useRouter();
  const { role: paramRole } = useLocalSearchParams<{ role?: string }>();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      let currentRole = paramRole?.toLowerCase();
      if (!currentRole) {
        currentRole = (await AsyncStorage.getItem('userRole'))?.toLowerCase();
      }
      setIsAdmin(currentRole === 'admin');
    };
    checkRole();
  }, [paramRole]);

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('userRole');
        await AsyncStorage.removeItem('cart_items');
        router.replace('/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    };

    const confirmMsg = 'คุณต้องการออกจากระบบใช่หรือไม่?';

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) await doLogout();
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

      <View style={styles.rightActionGroup}>
        {/* 📊 ปุ่ม Dashboard แสดงเฉพาะ Admin เท่านั้น */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.dashboardBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/dashboard')}
          >
            <Ionicons name="stats-chart-outline" size={16} color="#38BDF8" style={{ marginRight: 4 }} />
            <Text style={styles.dashboardText}>Dashboard</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={16} color="#F87171" style={{ marginRight: 4 }} />
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </View>
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
  rightActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#082F49',
    borderWidth: 1,
    borderColor: '#0369A1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dashboardText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
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