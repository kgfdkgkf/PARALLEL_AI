import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient as SvgLinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { accents, type AccentKey } from '../theme';
import { hashString, mulberry32 } from '../engine/hash';
import type { Stance } from '../engine/types';

/**
 * Процедурный портрет жителя.
 *
 * Детерминированно строится из имени: палитра, наклон силуэта, орбиты,
 * плотность «пыли». Никаких сетевых запросов и лимитов — и при этом
 * у каждого персонажа своя картинка.
 */
export function CharacterPortrait({
  name,
  accent = 'violet',
  stance = 'transcend',
  width = 96,
  height = 124,
  style,
  detailed = false,
}: {
  name: string;
  accent?: AccentKey;
  stance?: Stance;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  detailed?: boolean;
}) {
  const scheme = accents[accent];
  const seed = useMemo(() => hashString(`portrait:${name}`), [name]);
  const random = useMemo(() => mulberry32(seed), [seed]);
  const data = useMemo(() => {
    const rnd = mulberry32(seed);
    return {
      tilt: (rnd() - 0.5) * 14,
      headX: width * (0.46 + rnd() * 0.1),
      headY: height * (0.34 + rnd() * 0.06),
      headR: Math.min(width, height) * (0.19 + rnd() * 0.04),
      shoulderW: width * (0.72 + rnd() * 0.2),
      dots: Array.from({ length: detailed ? 26 : 14 }, () => ({
        x: rnd() * width,
        y: rnd() * height,
        r: 0.5 + rnd() * 1.4,
        o: 0.15 + rnd() * 0.5,
      })),
      rings: 2 + Math.floor(rnd() * 2),
    };
  }, [seed, width, height, detailed]);

  const id = `pt${seed.toString(36)}`;
  const second = accent === 'violet' ? 'cyan' : accent === 'cyan' ? 'violet' : accent === 'gold' ? 'rose' : 'cyan';
  const secondScheme = accents[second];

  return (
    <View style={[{ width, height, borderRadius: 16, overflow: 'hidden' }, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id={`${id}a`} cx="30%" cy="22%" r="80%">
            <Stop offset="0" stopColor={scheme.hi} stopOpacity="0.5" />
            <Stop offset="55%" stopColor={scheme.core} stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#05050C" stopOpacity="1" />
          </RadialGradient>
          <RadialGradient id={`${id}b`} cx="80%" cy="80%" r="70%">
            <Stop offset="0" stopColor={secondScheme.core} stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#05050C" stopOpacity="0" />
          </RadialGradient>
          <SvgLinearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={scheme.core} stopOpacity="0.0" />
            <Stop offset="100%" stopColor="#05050C" stopOpacity="0.9" />
          </SvgLinearGradient>
        </Defs>

        <Rect width={width} height={height} fill={`url(#${id}a)`} />
        <Rect width={width} height={height} fill={`url(#${id}b)`} />

        {data.rings !== 0
          ? Array.from({ length: data.rings }, (_, index) => (
              <Circle
                key={index}
                cx={data.headX}
                cy={data.headY}
                r={data.headR * (1.7 + index * 0.55)}
                fill="none"
                stroke={scheme.hi}
                strokeOpacity={0.22 - index * 0.05}
                strokeWidth={1}
              />
            ))
          : null}

        <G transform={`rotate(${data.tilt} ${width / 2} ${height / 2})`}>
          <Ellipse
            cx={width / 2}
            cy={height * 1.02}
            rx={data.shoulderW / 2}
            ry={height * 0.34}
            fill="#05050C"
            fillOpacity={0.82}
          />
          <Circle cx={data.headX} cy={data.headY} r={data.headR} fill="#05050C" fillOpacity={0.9} />
          <Circle
            cx={data.headX}
            cy={data.headY}
            r={data.headR}
            fill="none"
            stroke={scheme.hi}
            strokeOpacity={0.5}
            strokeWidth={1}
          />
        </G>

        {data.dots.map((dot, index) => (
          <Circle key={index} cx={dot.x} cy={dot.y} r={dot.r} fill={scheme.hi} opacity={dot.o} />
        ))}

        <Rect width={width} height={height} fill={`url(#${id}c)`} />

        {stance === 'control' ? (
          <Path
            d={`M${width * 0.5} ${height * 0.86} l6 -6 6 6 -6 6z`}
            fill="none"
            stroke={scheme.hi}
            strokeOpacity={0.85}
            strokeWidth={1.2}
          />
        ) : null}
        {stance === 'liberty' ? (
          <Circle cx={width * 0.5} cy={height * 0.86} r={6} fill="none" stroke={scheme.hi} strokeOpacity={0.85} strokeWidth={1.2} strokeDasharray="28 12" />
        ) : null}
        {stance === 'transcend' ? (
          <Path
            d={`M${width * 0.5} ${height * 0.8} l7 12 h-14z`}
            fill="none"
            stroke={scheme.hi}
            strokeOpacity={0.85}
            strokeWidth={1.2}
          />
        ) : null}

        <Line x1={width * 0.12} y1={height * 0.9} x2={width * 0.88} y2={height * 0.9} stroke={scheme.core} strokeOpacity={0.35} strokeWidth={1} />
      </Svg>
    </View>
  );
}

/** Пейзаж-постер места: небо, светило и слои рельефа из seed названия. */
export function LocationArt({
  name,
  accent = 'violet',
  width: widthProp,
  height = 108,
  style,
}: {
  name: string;
  accent?: AccentKey;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const width = widthProp ?? Math.min(screenWidth - 80, 460);
  const scheme = accents[accent];
  const seed = useMemo(() => hashString(`place:${name}`), [name]);
  const layers = useMemo(() => {
    const rnd = mulberry32(seed);
    return {
      sunX: width * (0.2 + rnd() * 0.6),
      sunY: height * (0.3 + rnd() * 0.18),
      sunR: height * (0.18 + rnd() * 0.14),
      ridges: Array.from({ length: 4 }, (_, index) => {
        const points: string[] = [`M0 ${height}`];
        const steps = 6;
        for (let step = 0; step <= steps; step += 1) {
          const x = (width / steps) * step;
          const base = height * (0.5 + index * 0.11);
          const y = base + (rnd() - 0.5) * height * 0.16;
          points.push(`L${x.toFixed(1)} ${y.toFixed(1)}`);
        }
        points.push(`L${width} ${height} Z`);
        return { d: points.join(' '), opacity: 0.22 + index * 0.18 };
      }),
      stars: Array.from({ length: 18 }, () => ({ x: rnd() * width, y: rnd() * height * 0.5, r: 0.4 + rnd() * 1.1, o: 0.2 + rnd() * 0.5 })),
    };
  }, [seed, width, height]);

  const id = `pl${seed.toString(36)}`;

  return (
    <View style={[{ width, height, borderRadius: 12, overflow: 'hidden' }, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#05050C" stopOpacity="1" />
            <Stop offset="65%" stopColor={scheme.core} stopOpacity="0.28" />
            <Stop offset="100%" stopColor={scheme.core} stopOpacity="0.06" />
          </SvgLinearGradient>
          <RadialGradient id={`${id}sun`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={scheme.hi} stopOpacity="0.95" />
            <Stop offset="70%" stopColor={scheme.core} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={scheme.core} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill={`url(#${id}sky)`} />
        <Circle cx={layers.sunX} cy={layers.sunY} r={layers.sunR * 2.2} fill={`url(#${id}sun)`} />
        <Circle cx={layers.sunX} cy={layers.sunY} r={layers.sunR} fill={scheme.hi} opacity={0.85} />
        {layers.stars.map((star, index) => (
          <Circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#F6F3FF" opacity={star.o} />
        ))}
        {layers.ridges.map((ridge, index) => (
          <Path key={index} d={ridge.d} fill="#05050C" opacity={ridge.opacity} stroke={scheme.core} strokeOpacity={0.18} strokeWidth={1} />
        ))}
      </Svg>
    </View>
  );
}

export const portraitStyles = StyleSheet.create({
  frame: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(196,180,255,0.2)' },
});
