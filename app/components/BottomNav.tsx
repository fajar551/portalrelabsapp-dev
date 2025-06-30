import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BottomNav = ({activeTab, navigateTo}: {activeTab: string, navigateTo: (tab: string) => void}) => (
  <View style={styles.navBar}>
    <NavItem
      icon="receipt"
      label="Tagihan"
      active={activeTab === 'Tagihan'}
      onPress={() => navigateTo('Tagihan')}
    />
    <NavItem
      icon="person"
      label="Akun"
      active={activeTab === 'Akun'}
      onPress={() => navigateTo('Akun')}
    />
    <NavItem
      icon="description"
      label="Invoice"
      active={activeTab === 'InvoiceDetail'}
      onPress={() => navigateTo('InvoiceDetail')}
    />
    <NavItem
      icon="payment"
      label="Pembayaran"
      active={activeTab === 'PayInstructions'}
      onPress={() => navigateTo('PayInstructions')}
    />
    <NavItem
      icon="help-outline"
      label="Bantuan"
      active={activeTab === 'Bantuan'}
      onPress={() => navigateTo('Bantuan')}
    />
  </View>
);

const NavItem = ({icon, label, active, onPress}: any) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <Icon name={icon} size={26} color={active ? '#F26522' : '#888'} />
    <Text style={[styles.label, active && {color: '#F26522'}]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingVertical: 6,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8,
  },
  item: {alignItems: 'center', flex: 1},
  label: {fontSize: 12, color: '#888', marginTop: 2, fontWeight: 'bold'},
});

export default BottomNav;