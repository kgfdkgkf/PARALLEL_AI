import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Polygon, Stop } from 'react-native-svg';
import { accents, type AccentKey, font, palette, radius } from '../theme';
import type { MetricKey, Metrics } from '../engine/types';

export const METRIC_META: { key: MetricKey; label: string; short: string; accent: AccentKey }[] = [
  { key: 'order', label: 'Порядок', short: 'ПОР', accent: 'gold' },
  { key: 'freedom', label: 'Свобода', short: 'СВО', accent: 'green' },
  { key: 'trust', label: 'Доверие', short: 'ДОВ', accent: 'violet' },
  { key: 'tech', label: 'Технологии', short: 'ТЕХ', accent: 'cyan' },
];

const ANGLES: Record<MetricKey, number> = {
  order: -90,
  freedom: 0,
  trust: 90,
  tech: 180,
};

function point(cx: number, cy: number, radius: number, angle: number, value: number) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: cx + Math.cos(rad) * radius * value,
    y: cy + Math.sin(rad) * radius * value,
  };
}

export function MetricRadar({ metrics, accent = 'violet', size = 168 }: { metrics: Metrics; accent?: AccentKey; size?: number }) {
  const scheme = accents[accent];
  const c = size / 2;
  const r = size * 0.38;
  const polygonFor = (scale: number) =>
    METRIC_META.map((meta) => {
      const p = point(c, c, r, ANGLES[meta.key], scale);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');

  const valuePolygon = METRIC_META.map((meta) => {
    const p = point(c, c, r, ANGLES[meta.key], Math.max(0.06, metrics[meta.key] / 100));
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <SvgLinearGradient id="radar-fill" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={scheme.hi} stopOpacity="0.42" />
          <Stop offset="1" stopColor={scheme.core} stopOpacity="0.08" />
        </SvgLinearGradient>
      </Defs>
      {[0.33, 0.66, 1].map((scale) => (
        <Polygon
          key={scale}
          points={polygonFor(scale)}
          fill="none"
          stroke={palette.lineSoft}
          strokeWidth={StyleSheet.hairlineWidth * 2}
        />
      ))}
      {METRIC_META.map((meta) => {
        const p = point(c, c, r, ANGLES[meta.key], 1);
        return <Path key={meta.key} d={`M${c} ${c} L${p.x} ${p.y}`} stroke={palette.lineSoft} strokeWidth={StyleSheet.hairlineWidth * 2} />;
      })}
      <Polygon points={valuePolygon} fill="url(#radar-fill)" stroke={scheme.hi} strokeWidth={1.4} />
      {METRIC_META.map((meta) => {
        const p = point(c, c, r, ANGLES[meta.key], Math.max(0.06, metrics[meta.key] / 100));
        return <Circle key={meta.key} cx={p.x} cy={p.y} r={2.6} fill={scheme.hi} />;
      })}
      <Circle cx={c} cy={c} r={1.6} fill={palette.textSoft} opacity={0.5} />
    </Svg>
  );
}

export function MetricBars({
  metrics,
  before,
  accent = 'violet',
  compact = false,
}: {
  metrics: Metrics;
  before?: Metrics;
  accent?: AccentKey;
  compact?: boolean;
}) {
  const scheme = accents[accent];
  return (
    <View style={{ gap: compact ? 12 : 16 }}>
      {METRIC_META.map((meta) => {
        const value = metrics[meta.key];
        const delta = before ? value - before[meta.key] : 0;
        return (
          <View key={meta.key} style={{ gap: 7 }}>
            <View style={styles.row}>
              <Text style={styles.barLabel}>{meta.label.toUpperCase()}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {delta !== 0 ? (
                  <Text style={[styles.delta, { color: delta > 0 ? palette.green : palette.rose }]}>
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </Text>
                ) : null}
                <Text style={[styles.barValue, { color: scheme.text }]}>{value}</Text>
              </View>
            </View>
            <View style={styles.track}>
              <View style={[styles.trackFill, { width: `${Math.max(2, value)}%`, backgroundColor: scheme.core }]} />
              {before ? (
                <View
                  style={[
                    styles.marker,
                    { left: `${Math.max(1, Math.min(99, before[meta.key]))}%`, backgroundColor: palette.textSoft },
                  ]}
                />
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function MetricChips({ metrics, accent = 'violet' }: { metrics: Metrics; accent?: AccentKey }) {
  return (
    <View style={styles.chips}>
      {METRIC_META.map((meta) => (
        <View key={meta.key} style={styles.chip}>
          <View style={[styles.chipDot, { backgroundColor: accents[meta.accent].core }]} />
          <Text style={styles.chipLabel}>{meta.short}</Text>
          <Text style={[styles.chipValue, { color: accents[accent].text }]}>{metrics[meta.key]}</Text>
        </View>
      ))}
    </View>
  );
}

export function describeMetrics(metrics: Metrics): string {
  const entries = METRIC_META.map((meta) => ({ ...meta, value: metrics[meta.key] })).sort((a, b) => b.value - a.value);
  const top = entries[0];
  const bottom = entries[entries.length - 1];
  const words: Record<MetricKey, string> = {
    order: 'порядок держится крепче, чем люди готовы признать',
    freedom: 'свободы больше, чем кто-либо ожидал',
    trust: 'доверие стало главной валютой',
    tech: 'технологии обгоняют язык',
  };
  const weak: Record<MetricKey, string> = {
    order: 'порядок едва держится',
    freedom: 'свободы почти не осталось',
    trust: 'доверие на исходе',
    tech: 'технологии отстают от задач',
  };
  return `В этом мире ${words[top.key]}, а ${weak[bottom.key]}.`;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLabel: { fontFamily: font.bodySemi, fontSize: 12, letterSpacing: 1.6, color: palette.muted },
  barValue: { fontFamily: font.displayBook, fontSize: 13.5, letterSpacing: 0.4 },
  delta: { fontFamily: font.bodySemi, fontSize: 12.5, letterSpacing: 0.4 },
  track: {
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'visible',
  },
  trackFill: { height: 3, borderRadius: 3 },
  marker: { position: 'absolute', top: -2.5, width: 1.5, height: 8, borderRadius: 2, opacity: 0.7 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.lineSoft,
  },
  chipDot: { width: 4, height: 4, borderRadius: 4 },
  chipLabel: { fontFamily: font.bodySemi, fontSize: 11, letterSpacing: 1, color: palette.faint },
  chipValue: { fontFamily: font.bodySemi, fontSize: 12.5 },
});
