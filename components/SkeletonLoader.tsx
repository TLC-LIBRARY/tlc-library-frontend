import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Card Skeleton
export const CardSkeleton: React.FC = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <SkeletonLoader height={24} width="60%" style={{ marginBottom: 12 }} />
      <SkeletonLoader height={16} width="100%" style={{ marginBottom: 8 }} />
      <SkeletonLoader height={16} width="80%" style={{ marginBottom: 16 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <SkeletonLoader height={14} width="40%" />
        <SkeletonLoader height={14} width="30%" />
      </View>
    </View>
  );
};

// List Skeleton
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
});
