import React, { useId } from 'react';
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Line, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
  const gradientPrefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const coralGlowId = `coral-glow-${gradientPrefix}`;
  const warmGlowId = `warm-glow-${gradientPrefix}`;

  return (
    <View style={[styles.container, style]} onTouchStartCapture={onTouchStartCapture}>
      <View pointerEvents="none" collapsable={false} style={styles.atmosphere}>
        <Svg width={width} height={height} style={styles.motif}>
          <Defs>
            <RadialGradient id={coralGlowId} cx="76%" cy="20%" r="45%">
              <Stop offset="0%" stopColor="#f45d52" stopOpacity="0.11" />
              <Stop offset="100%" stopColor="#f45d52" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id={warmGlowId} cx="32%" cy="86%" r="52%">
              <Stop offset="0%" stopColor="#ffa672" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#ffa672" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width={width} height={height} fill="#090b0d" />
          <Rect width={width} height={height} fill={`url(#${coralGlowId})`} />
          <Rect width={width} height={height} fill={`url(#${warmGlowId})`} />
          {Array.from({ length: Math.ceil(width / 280) }, (_, index) => {
            const x = 280 * (index + 1);
            return (
              <Line
                key={`vertical-${x}`}
                x1={x}
                y1="0"
                x2={x}
                y2={height}
                stroke="rgba(255,255,255,0.012)"
                strokeWidth={1}
              />
            );
          })}
        </Svg>
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
  motif: {
    position: 'absolute',
    left: 0,
    top: 0,
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
