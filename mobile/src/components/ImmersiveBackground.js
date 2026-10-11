import React from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import BorrowBackMark from './BorrowBackMark';
import { theme } from '../theme';

function RotatingMark({ size, style, duration }) {
  const rotation = React.useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  React.useEffect(() => {
    if (reduceMotion) {
      rotation.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();
    return () => animation.stop();
  }, [duration, reduceMotion, rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.emblem, style, { width: size, height: size, transform: [{ rotate }] }]}
    >
      <BorrowBackMark size={size} />
    </Animated.View>
  );
}

export default function ImmersiveBackground({ children, style }) {
  const { width, height } = useWindowDimensions();
  const dots = [];

  for (let y = 36; y < height; y += 72) {
    for (let x = 32; x < width; x += 64) {
      const accent = (Math.round(x / 64) + Math.round(y / 72)) % 5 === 0;
      dots.push(
        <Circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={accent ? 2 : 1.4}
          fill={accent ? '#ff8b7d' : '#f4f4f5'}
          opacity={accent ? 0.32 : 0.15}
        />
      );
    }
  }

  const orbitRadius = Math.min(width, height);

  return (
    <View style={[styles.container, style]}>
      <View pointerEvents="none" style={styles.atmosphere}>
        <Svg width={width} height={height} style={styles.motif}>
          <Circle
            cx={width * 0.31}
            cy={height * 0.34}
            r={orbitRadius * 0.2}
            fill="none"
            stroke="rgba(255,105,91,0.2)"
            strokeWidth={1.5}
          />
          <Circle
            cx={width * 0.31}
            cy={height * 0.34}
            r={orbitRadius * 0.27}
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth={1}
          />
          <Circle
            cx={width * 0.72}
            cy={height * 0.76}
            r={orbitRadius * 0.22}
            fill="none"
            stroke="rgba(255,105,91,0.15)"
            strokeWidth={1.5}
          />
          {dots}
        </Svg>
        <LinearGradient
          colors={['rgba(255,73,62,0.09)', 'rgba(255,73,62,0.025)', 'rgba(8,8,8,0)']}
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
        <RotatingMark size={250} duration={78000} style={styles.markHero} />
        <RotatingMark size={82} duration={42000} style={styles.markOne} />
        <RotatingMark size={68} duration={54000} style={styles.markTwo} />
        <RotatingMark size={56} duration={60000} style={styles.markThree} />
      </View>
      <View style={styles.content}>{children}</View>
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
    zIndex: 0,
  },
  motif: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  emblem: {
    position: 'absolute',
    opacity: 0.42,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  markHero: {
    top: '35%',
    right: '-18%',
    opacity: 0.11,
  },
  markOne: {
    top: '18%',
    left: '13%',
  },
  markTwo: {
    top: '54%',
    right: '9%',
    opacity: 0.3,
  },
  markThree: {
    bottom: '12%',
    left: '37%',
    opacity: 0.24,
  },
  warmGlow: {
    position: 'absolute',
    top: -180,
    right: -190,
    width: 430,
    height: 430,
    borderRadius: 215,
    backgroundColor: 'rgba(255,73,62,0.065)',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  verticalLine: {
    height: '100%',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.045)',
  },
  horizon: {
    position: 'absolute',
    top: '31%',
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
});
