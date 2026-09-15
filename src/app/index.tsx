import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://119.59.102.161:3084/api';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ถ้าเคย Login ไว้แล้ว ให้เด้งไปหน้าสินค้าทันที
  useEffect(() => {
    const checkSession = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        router.replace('/products');
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      const msg = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('เตือน', msg);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const userInfo = data.user || data;
        const userRole = String(userInfo.role || data.role || 'user').toLowerCase();

        await AsyncStorage.setItem('user', JSON.stringify(userInfo));
        await AsyncStorage.setItem('user_role', userRole);

        // เข้าสู่ระบบสำเร็จ เด้งไปหน้า Products ทันที
        router.replace('/products');
      } else {
        const errorMsg = data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
        if (Platform.OS === 'web') alert(errorMsg);
        else Alert.alert('เข้าสู่ระบบไม่สำเร็จ', errorMsg);
      }
    } catch (error) {
      console.error('Login error:', error);
      const msg = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('ข้อผิดพลาด', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Aethera</Text>
        <Text style={styles.subtitle}>เข้าสู่ระบบเพื่อใช้งาน</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#6B7280"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6B7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/register')}
        >
          <Text style={styles.linkText}>
            ยังไม่มีบัญชีผู้ใช้? <Text style={styles.linkHighlight}>สมัครสมาชิก</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080711', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#131224', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#242145' },
  title: { color: '#F8FAFC', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginBottom: 24, marginTop: 4 },
  input: {
    backgroundColor: '#1A1833',
    color: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#242145',
    marginBottom: 16,
  },
  button: { backgroundColor: '#7C3AED', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#9CA3AF', fontSize: 14 },
  linkHighlight: { color: '#818CF8', fontWeight: 'bold' },
});