import React from 'react';
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import BorrowBackMark from './BorrowBackMark';
import { theme } from '../theme';

export function withImmersiveBackground(ScreenComponent, { showBackButton = true } = {}) {
  function ScreenWithImmersiveBackground(props) {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const canGoBack = navigation.canGoBack();
    const showBack = canGoBack && showBackButton;

    return (
      <ImmersiveBackground>
        {showBack ? (
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 8 }]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={21} color={theme.colors.text} />
          </TouchableOpacity>
        ) : null}
        <View style={[styles.screenFrame, { paddingTop: showBack ? insets.top + 54 : insets.top }]}>
          <ScreenComponent {...props} />
        </View>
      </ImmersiveBackground>
    );
  }

  ScreenWithImmersiveBackground.displayName = `WithImmersiveBackground(${
    ScreenComponent.displayName || ScreenComponent.name || 'Screen'
  })`;
  return ScreenWithImmersiveBackground;
}

export default function ImmersiveBackground({ children, onTouchStartCapture, style }) {
  const { width, height } = useWindowDimensions();
  const dots = [];
  const orbits = [
    { x: 0.12, y: 0.64, radius: 0.22, color: 'rgba(255,125,108,0.38)' },
    { x: 0.12, y: 0.64, radius: 0.31, color: 'rgba(255,255,255,0.14)' },
    { x: 0.9, y: 0.28, radius: 0.24, color: 'rgba(255,125,108,0.32)' },
    { x: 0.9, y: 0.28, radius: 0.36, color: 'rgba(255,255,255,0.11)' },
    { x: 0.72, y: 0.92, radius: 0.34, color: 'rgba(255,125,108,0.22)' },
  ];

  for (let y = 24; y < height; y += 48) {
    for (let x = 24; x < width; x += 48) {
      const accent = (Math.round(x / 48) + Math.round(y / 48)) % 5 === 0;
      dots.push(
        <Circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={accent ? 1.35 : 0.85}
          fill={accent ? '#ff9a8d' : '#f4f4f5'}
          opacity={accent ? 0.5 : 0.2}
        />
      );
    }
  }

  const orbitRadius = Math.min(width, height);

  return (
    <View style={[styles.container, style]} onTouchStartCapture={onTouchStartCapture}>
      <View pointerEvents="none" collapsable={false} style={styles.atmosphere}>
        <LinearGradient
          colors={['#1a1312', '#101416', '#0b1013']}
          locations={[0, 0.52, 1]}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(255,112,96,0.23)', 'rgba(255,73,62,0.12)', 'transparent']}
          locations={[0, 0.38, 1]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0.9 }}
          style={styles.ambientGlow}
        />
        <LinearGradient
          colors={['transparent', 'rgba(255,151,112,0.09)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.2 }}
          style={styles.lowerGlow}
        />
        {orbits.map(({ x, y, radius, color }, index) => {
          const diameter = orbitRadius * radius * 2;
          return (
            <View
              key={`orbit-${index}`}
              style={[
                styles.orbit,
                {
                  left: width * x - diameter / 2,
                  top: height * y - diameter / 2,
                  width: diameter,
                  height: diameter,
                  borderRadius: diameter / 2,
                  borderColor: color,
                },
              ]}
            />
          );
        })}
        <Svg width={width} height={height} style={styles.motif}>
          {Array.from({ length: Math.ceil(width / 280) }, (_, index) => {
            const x = 280 * (index + 1);
            return (
              <Line
                key={`vertical-${x}`}
                x1={x}
                y1="0"
                x2={x}
                y2={height}
                stroke="rgba(255,255,255,0.035)"
                strokeWidth={1}
              />
            );
          })}
          {Array.from({ length: Math.ceil(height / 220) }, (_, index) => {
            const y = 220 * (index + 1);
            return (
              <Line
                key={`horizontal-${y}`}
                x1="0"
                y1={y}
                x2={width}
                y2={y}
                stroke="rgba(255,255,255,0.028)"
                strokeWidth={1}
              />
            );
          })}
          {dots}
        </Svg>
        <View style={styles.heroMark}>
          <BorrowBackMark size={Math.min(width * 0.78, 320)} />
        </View>
        <View style={styles.smallMark}>
          <BorrowBackMark size={46} />
        </View>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    position: 'relative',
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    right: '-12%',
    width: '112%',
    height: '82%',
  },
  lowerGlow: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    height: '46%',
  },
  motif: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  orbit: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroMark: {
    position: 'absolute',
    top: '33%',
    right: '-27%',
    opacity: 0.13,
  },
  smallMark: {
    position: 'absolute',
    top: '17%',
    left: '11%',
    opacity: 0.29,
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  screenFrame: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 2,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(17,17,17,0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
});
