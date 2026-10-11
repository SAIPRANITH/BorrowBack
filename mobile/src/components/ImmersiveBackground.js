import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

export default function ImmersiveBackground({ children, style }) {
  return (
    <View style={[styles.container, style]}>
      <View pointerEvents="none" style={styles.atmosphere}>
        <LinearGradient
          colors={['rgba(255,73,62,0.055)', 'rgba(255,73,62,0.012)', 'rgba(8,8,8,0)']}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.warmGlow} />
        <View style={styles.grid}>
          <View style={styles.verticalLine} />
          <View style={styles.verticalLine} />
          <View style={styles.verticalLine} />
        </View>
        <View style={styles.horizon} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  warmGlow: {
    position: 'absolute',
    top: -180,
    right: -190,
    width: 430,
    height: 430,
    borderRadius: 215,
    backgroundColor: 'rgba(255,73,62,0.035)',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  verticalLine: {
    height: '100%',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.025)',
  },
  horizon: {
    position: 'absolute',
    top: '31%',
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.022)',
  },
});
