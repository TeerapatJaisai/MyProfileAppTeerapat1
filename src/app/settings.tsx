import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomBar from './_BottomBar';

export default function SettingsScreen() {
  const settingsOptions = [
    { icon: 'person-outline', title: 'Account Profile', sub: 'Admin credentials & permissions' },
    { icon: 'bluetooth-outline', title: 'Device Pairing', sub: 'Aethera Ring hardware sync' },
    { icon: 'notifications-outline', title: 'Notification Alerts', sub: 'Push & order alerts' },
    { icon: 'shield-checkmark-outline', title: 'Security & Privacy', sub: '2FA & biometric login' },
    { icon: 'color-palette-outline', title: 'App Theme', sub: 'Dark Purple (Active)' },
    { icon: 'help-circle-outline', title: 'Help & Support', sub: 'Documentation & API guide' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>System preferences & device setup</Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View style={{ marginLeft: 14 }}>
            <Text style={styles.profileName}>Aethera Administrator</Text>
            <Text style={styles.profileRole}>admin@aethera-ecosystem.io</Text>
          </View>
        </View>

        {/* Menu Options */}
        {settingsOptions.map((opt, idx) => (
          <TouchableOpacity key={idx} style={styles.menuRow} activeOpacity={0.7}>
            <View style={styles.menuIconBox}>
              <Ionicons name={opt.icon as any} size={20} color="#818CF8" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.menuTitle}>{opt.title}</Text>
              <Text style={styles.menuSub}>{opt.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#4B5563" />
          </TouchableOpacity>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080711' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  title: { color: '#F8FAFC', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#131224', borderRadius: 16, borderWidth: 1, borderColor: '#242145', padding: 14, marginVertical: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  profileName: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold' },
  profileRole: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#131224', borderRadius: 14, borderWidth: 1, borderColor: '#242145', padding: 12, marginBottom: 8 },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1A1833', justifyContent: 'center', alignItems: 'center' },
  menuTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  menuSub: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: '#EF4444', borderRadius: 14, paddingVertical: 14, marginTop: 16, marginBottom: 20 },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 14 },
});