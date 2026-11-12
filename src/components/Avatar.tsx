import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { Stance } from '../engine/types';
import { accents, type AccentKey, font, palette } from '../theme';

/**
 * Личный знак жителя. Вместо случайного символа — эмблема позиции:
 * контроль (ромб), свобода (разомкнутый круг), трансформация (треугольник).
 * Такой знак гарантированно рисуется на любой платформе.
 */
export function Signet({
  accent = 'violet',
  stance = 'transcend',
  size = 54,
  bond,
  id,
}: {
  accent?: AccentKey;
  stance?: Stance;
  size?: number;
  bond?: number;
  id: string;
}) {
  const scheme = accents[accent];
  const center = size / 2;
  const radius = center - 4;
  const emblem = size * 0.16;
  const circumference = 2 * Math.PI * (radius - 4);
  const progress = bond === undefined ? 0 : Math.max(0.02, Math.min(1, bond / 100));
  const gradientId = `signet-${id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const stroke = scheme.hi;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={gradientId} cx="38%" cy="28%" r="78%">
            <Stop offset="0" stopColor={scheme.hi} stopOpacity="0.6" />
            <Stop offset="55%" stopColor={scheme.core} stopOpacity="0.24" />
            <Stop offset="100%" stopColor={palette.ink} stopOpacity="0.96" />
          </RadialGradient>
        </Defs>
        <Circle cx={center} cy={center} r={radius} fill={`url(#${gradientId})`} stroke={scheme.core + '66'} strokeWidth={1} />
        <Circle cx={center} cy={center} r={radius - 4} fill="none" stroke={palette.lineSoft} strokeWidth={2} />
        {bond !== undefined ? (
          <Circle
            cx={center}
            cy={center}
            r={radius - 4}
            fill="none"
            stroke={scheme.hi}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={`${circumference * progress} ${circumference}`}
            transform={`rotate(-90 ${center} ${center})`}
          />
        ) : null}
        {stance === 'control' ? (
          <Rect
            x={center - emblem * 0.72}
            y={center - emblem * 0.72}
            width={emblem * 1.44}
            height={emblem * 1.44}
            fill="none"
            stroke={stroke}
            strokeWidth={1.4}
            transform={`rotate(45 ${center} ${center})`}
          />
        ) : null}
        {stance === 'liberty' ? (
          <>
            <Circle
              cx={center}
              cy={center}
              r={emblem}
              fill="none"
              stroke={stroke}
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * emblem * 0.78} ${2 * Math.PI * emblem}`}
              transform={`rotate(-56 ${center} ${center})`}
            />
            <Circle cx={center + emblem * 0.9} cy={center - emblem * 0.55} r={1.6} fill={scheme.hi} />
          </>
        ) : null}
        {stance === 'transcend' ? (
          <Path
            d={`M${center} ${center - emblem} L${center + emblem * 0.92} ${center + emblem * 0.66} L${center - emblem * 0.92} ${center + emblem * 0.66} Z`}
            fill="none"
            stroke={stroke}
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
        ) : null}
        <Circle cx={center} cy={center} r={1.7} fill={scheme.hi} />
      </Svg>
    </View>
  );
}

export function Initials({ name, accent = 'violet', size = 34 }: { name: string; accent?: AccentKey; size?: number }) {
  const scheme = accents[accent];
  const parts = name.split(' ');
  const letters = `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: scheme.core + '2E',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: scheme.core + '66',
      }}
    >
      <Text style={{ fontFamily: font.bodySemi, fontSize: size * 0.34, letterSpacing: 0.5, color: scheme.text }}>{letters}</Text>
    </View>
  );
}
