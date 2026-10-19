import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://119.59.102.161:3084/api';

export default function AuthScreen() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false); // สลับสถานะ Login / Register
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web') alert(`${title}: ${msg}`);
    else Alert.alert(title, msg);
  };

  const handleAuth = async () => {
    if (!username.trim() || !password.trim()) {
      showAlert('เตือน', 'กรุณากรอก Username และ Password ให้ครบ');
      return;
    }

    if (isRegister && password !== confirmPassword) {
      showAlert('เตือน', 'รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }

    try {
      setLoading(true);
      const endpoint = isRegister ? `${API_URL}/register` : `${API_URL}/login`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && (data.status === 'success' || data.success || data.user || data.id)) {
        const userData = data.user || (Array.isArray(data) ? data[0] : data);
        
        // ถ้าเป็น Register ให้สิทธิ์เริ่มต้นเป็น user ถ้า Login ให้ดึงจาก DB
        const userRole = userData?.role 
          ? String(userData.role).toLowerCase() 
          : (isRegister ? 'user' : 'admin');

        const userId = String(userData?.id || '');
        const userName = String(userData?.username || username.trim());

        // บันทึกสิทธิ์ลงเครื่อง
        await AsyncStorage.setItem('userRole', userRole);
        await AsyncStorage.setItem('userId', userId);
        await AsyncStorage.setItem('username', userName);

        showAlert('สำเร็จ', isRegister ? 'สมัครสมาชิกเรียบร้อยแล้ว' : 'เข้าสู่ระบบเรียบร้อย');

        // นาวิกเกตไปหน้า /products
        router.replace({
          pathname: '/products',
          params: {
            role: userRole,
            userId: userId,
            username: userName,
          },
        });
      } else {
        showAlert(
          isRegister ? 'สมัครสมาชิกไม่สำเร็จ' : 'เข้าสู่ระบบไม่สำเร็จ',
          data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
        );
      }
    } catch (err) {
      console.error(err);
      showAlert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Aethera</Text>
        <Text style={styles.subtitle}>
          {isRegister ? 'Create a new account' : 'Sign in to your account'}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter username"
            placeholderTextColor="#6B7280"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* แสดงช่อง Confirm Password เมื่ออยู่ในโหมด Register */}
        {isRegister && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#6B7280"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleAuth}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              {isRegister ? 'Sign Up' : 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>

        {/* ปุ่มสลับโหมด Sign In / Sign Up */}
        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => {
            setIsRegister(!isRegister);
            setConfirmPassword('');
          }}
        >
          <Text style={styles.switchText}>
            {isRegister
              ? 'Already have an account? '
              : "Don't have an account? "}
            <Text style={styles.switchTextBold}>
              {isRegister ? 'Sign In' : 'Sign Up'}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080711',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#131224',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#242145',
    padding: 24,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#080711',
    color: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242145',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  switchBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  switchTextBold: {
    color: '#7C3AED',
    fontWeight: 'bold',
  },
});