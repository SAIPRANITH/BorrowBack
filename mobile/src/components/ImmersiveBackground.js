import React from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line } from 'react-native-svg';
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

export default function ImmersiveBackground({ children, onTouchStartCapture, style }) {
  const { width, height } = useWindowDimensions();
  const dots = [];

  for (let y = 24; y < height; y += 48) {
    for (let x = 24; x < width; x += 48) {
      const accent = (Math.round(x / 48) + Math.round(y / 48)) % 5 === 0;
      dots.push(
        <Circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={accent ? 1.5 : 1}
          fill={accent ? '#ff8b7d' : '#f4f4f5'}
          opacity={accent ? 0.42 : 0.2}
        />
      );
    }
  }

  const orbitRadius = Math.min(width, height);
  const orbits = [
    { x: 0.18, y: 0.59, radius: 0.2, color: 'rgba(255,105,91,0.24)' },
    { x: 0.18, y: 0.59, radius: 0.275, color: 'rgba(255,255,255,0.08)' },
    { x: 0.34, y: 0.39, radius: 0.31, color: 'rgba(255,105,91,0.22)' },
    { x: 0.34, y: 0.39, radius: 0.41, color: 'rgba(255,255,255,0.07)' },
    { x: 0.63, y: 0.82, radius: 0.43, color: 'rgba(255,105,91,0.19)' },
  ];
  const accentPoints = [
    [0.3, 0.25], [0.39, 0.39], [0.51, 0.22], [0.42, 0.73],
    [0.69, 0.67], [0.86, 0.32], [0.2, 0.27], [0.57, 0.43],
    [0.77, 0.56], [0.25, 0.83], [0.92, 0.71], [0.55, 0.91],
  ];

  return (
    <View
      style={[styles.container, style]}
      onTouchStartCapture={onTouchStartCapture}
    >
      <View pointerEvents="none" style={styles.atmosphere}>
        <LinearGradient
          colors={['rgba(255,73,62,0.2)', 'rgba(255,73,62,0.075)', 'rgba(8,8,8,0)']}
          locations={[0, 0.48, 1]}
          start={{ x: 0.85, y: 0.1 }}
          end={{ x: 0.18, y: 0.95 }}
          style={StyleSheet.absoluteFill}
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
        <View
          style={[
            styles.glow,
            {
              top: height * 0.02,
              right: -width * 0.4,
              width: width * 0.9,
              height: width * 0.9,
              borderRadius: width * 0.45,
            },
          ]}
        />
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
                stroke="rgba(255,255,255,0.016)"
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
                stroke="rgba(255,255,255,0.012)"
                strokeWidth={1}
              />
            );
          })}
          {accentPoints.map(([x, y], index) => (
            <Circle
              key={`accent-${index}`}
              cx={width * x}
              cy={height * y}
              r={1.2}
              fill="#ff8b7d"
              opacity={0.2}
            />
          ))}
          {dots}
        </Svg>
        <View style={styles.grid}>
          <View style={styles.verticalLine} />
          <View style={styles.verticalLine} />
          <View style={styles.verticalLine} />
        </View>
        <View style={styles.horizon} />
        <RotatingMark size={250} duration={78000} style={styles.markHero} />
        <RotatingMark size={42} duration={42000} style={styles.markOne} />
        <RotatingMark size={34} duration={54000} style={styles.markTwo} />
        <RotatingMark size={32} duration={60000} style={styles.markThree} />
        <RotatingMark size={28} duration={66000} style={styles.markFour} />
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
  orbit: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(255,73,62,0.12)',
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
    top: '32%',
    right: '-32%',
    opacity: 0.15,
  },
  markOne: {
    top: '19%',
    left: '29%',
    opacity: 0.22,
  },
  markTwo: {
    top: '62%',
    left: '51%',
    opacity: 0.19,
  },
  markThree: {
    top: '31%',
    right: '9%',
    opacity: 0.18,
  },
  markFour: {
    bottom: '13%',
    left: '34%',
    opacity: 0.16,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  verticalLine: {
    height: '100%',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.03)',
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
