import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Stop } from 'react-native-svg';
import { accents, type AccentKey, font, palette, radius } from '../theme';
import type { Location } from '../engine/types';
import { PressableScale, Overline } from './ui';
import { Icon } from './Icon';
import { LocationArt } from './Portraits';

type Props = {
  locations: Location[];
  accent?: AccentKey;
  activeId?: string | null;
  onSelect: (location: Location) => void;
  heightRatio?: number;
};

export function WorldMap({ locations, accent = 'violet', activeId, onSelect, heightRatio = 0.92 }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(screenWidth - 40, 460);
  const height = width * heightRatio;
  const scheme = accents[accent];

  const nodes = useMemo(
    () =>
      locations.map((location) => ({
        ...location,
        px: location.x * width,
        py: location.y * height,
      })),
    [locations, width, height],
  );

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 3200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const cx = width / 2;
  const cy = height * 0.46;
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="map-glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={scheme.core} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={scheme.core} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {[0.18, 0.32, 0.47, 0.62].map((scale) => (
          <Circle
            key={scale}
            cx={cx}
            cy={cy}
            r={width * scale * 0.5}
            fill="none"
            stroke={palette.lineSoft}
            strokeWidth={StyleSheet.hairlineWidth * 2}
            strokeDasharray={scale > 0.4 ? '2 7' : undefined}
          />
        ))}

        {[0.25, 0.5, 0.75].map((ratio) => (
          <React.Fragment key={ratio}>
            <Line x1={width * ratio} y1={0} x2={width * ratio} y2={height} stroke={palette.lineSoft} strokeWidth={StyleSheet.hairlineWidth} />
            <Line x1={0} y1={height * ratio} x2={width} y2={height * ratio} stroke={palette.lineSoft} strokeWidth={StyleSheet.hairlineWidth} />
          </React.Fragment>
        ))}

        <Circle cx={cx} cy={cy} r={width * 0.34} fill="url(#map-glow)" />

        {nodes.slice(1).map((node) => {
          if (!node.unlocked) return null;
          const midX = (cx + node.px) / 2 + (node.py > cy ? -18 : 18);
          const midY = (cy + node.py) / 2;
          return (
            <Path
              key={`link-${node.id}`}
              d={`M${cx} ${cy} Q${midX} ${midY} ${node.px} ${node.py}`}
              fill="none"
              stroke={scheme.core + '55'}
              strokeWidth={1}
              strokeDasharray="3 5"
            />
          );
        })}

        {nodes.map((node) => {
          const size = node.id === 'loc-0' ? 7 : 5;
          return (
            <React.Fragment key={`ring-${node.id}`}>
              <Circle
                cx={node.px}
                cy={node.py}
                r={size + 7}
                fill="none"
                stroke={node.unlocked ? accents[node.accent].core + '66' : palette.lineSoft}
                strokeWidth={1}
                strokeDasharray={node.unlocked ? undefined : '2 4'}
              />
              <Circle
                cx={node.px}
                cy={node.py}
                r={size}
                fill={node.unlocked ? accents[node.accent].core : 'rgba(255,255,255,0.12)'}
                opacity={node.unlocked ? 0.95 : 0.5}
              />
              <Circle cx={node.px} cy={node.py} r={size + 16} fill={accents[node.accent].core} opacity={node.unlocked ? 0.07 : 0.03} />
            </React.Fragment>
          );
        })}
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: cx - 26,
          top: cy - 26,
          width: 52,
          height: 52,
          borderRadius: 52,
          borderWidth: 1,
          borderColor: scheme.core,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.5] }) }],
        }}
      />

      {nodes.map((node) => {
        const isActive = node.id === activeId;
        return (
          <View key={`node-${node.id}`} style={{ position: 'absolute', left: node.px - 50, top: node.py - 22, width: 100, alignItems: 'center' }}>
            <PressableScale
              onPress={() => node.unlocked && onSelect(node)}
              disabled={!node.unlocked}
              hitSlop={12}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center', height: 44, width: 44 }}>
                {!node.unlocked ? <Icon name="lock" size={13} color={palette.faint} /> : null}
                {isActive ? (
                  <View
                    style={{
                      position: 'absolute',
                      width: 40,
                      height: 40,
                      borderRadius: 40,
                      borderWidth: 1,
                      borderColor: accents[node.accent].hi,
                    }}
                  />
                ) : null}
              </View>
            </PressableScale>
            <Text
              numberOfLines={2}
              style={{
                marginTop: 20,
                textAlign: 'center',
                fontFamily: font.bodySemi,
                fontSize: 12,
                lineHeight: 17,
                letterSpacing: 0.7,
                textTransform: 'uppercase',
                color: node.unlocked ? (isActive ? accents[node.accent].hi : palette.textSoft) : palette.faint,
              }}
            >
              {node.name}
            </Text>
          </View>
        );
      })}

      <View style={{ position: 'absolute', left: 2, bottom: 2 }}>
        <Overline style={{ fontSize: 11 }}>карта реальности · {locations.filter((item) => item.unlocked).length}/{locations.length}</Overline>
      </View>
      <View style={{ position: 'absolute', right: 2, bottom: 2 }}>
        <Text style={[styles.coords, { color: scheme.text }]}>51°N · 07°E</Text>
      </View>
    </View>
  );
}

export function MapSheet({
  location,
  accent = 'violet',
  onOpenCharacter,
  characterName,
  onExplore,
  explored,
  seed,
  renderArt,
}: {
  location: Location;
  accent?: AccentKey;
  onOpenCharacter?: () => void;
  characterName?: string;
  onExplore?: () => void;
  explored?: boolean;
  seed?: number;
  renderArt?: (fallback: React.ReactNode) => React.ReactNode;
}) {
  const scheme = accents[accent];
  const { width: screenWidth } = useWindowDimensions();
  const fallback = (
    <LocationArt
        name={location.name}
        seed={seed}
        accent={location.accent}
        width={Math.min(screenWidth - 72, 440)}
        height={92}
    />
  );
  return (
    <View style={[styles.sheet, { borderColor: scheme.core + '3D' }]}>
      {renderArt ? renderArt(fallback) : fallback}
      <View style={styles.sheetTop}>
        <View style={{ flex: 1, gap: 4 }}>
          <Overline color={scheme.text}>{location.kind}</Overline>
          <Text style={styles.sheetTitle}>{location.name}</Text>
        </View>
        <View style={[styles.sheetDot, { backgroundColor: scheme.core }]} />
      </View>
      <Text style={styles.sheetBlurb}>{location.blurb}</Text>
      <Text style={styles.sheetDetail}>{location.detail}</Text>
      {onExplore ? (
        <PressableScale onPress={onExplore} disabled={explored}>
          <View style={[styles.sheetAction, { borderColor: scheme.core + (explored ? '22' : '55'), opacity: explored ? 0.55 : 1 }]}>
            <Text style={[styles.sheetActionText, { color: scheme.text }]}>
              {explored ? 'Здесь уже смотрели на этом ходу' : 'Осмотреть место'}
            </Text>
            <Icon name="eye" size={13} color={scheme.text} />
          </View>
        </PressableScale>
      ) : null}
      {onOpenCharacter && characterName ? (
        <PressableScale onPress={onOpenCharacter}>
          <View style={[styles.sheetAction, { borderColor: scheme.core + '55' }]}>
            <Text style={[styles.sheetActionText, { color: scheme.text }]}>Здесь живёт {characterName}</Text>
            <Icon name="chevron" size={13} color={scheme.text} />
          </View>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  coords: { fontFamily: font.mono, fontSize: 11, letterSpacing: 1.2, opacity: 0.7 },
  sheet: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(16,13,32,0.82)',
    padding: 16,
    gap: 10,
  },
  sheetTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  sheetTitle: { fontFamily: font.displayBook, fontSize: 16, lineHeight: 25, color: palette.text, letterSpacing: -0.2 },
  sheetDot: { width: 7, height: 7, borderRadius: 7, marginTop: 4 },
  sheetBlurb: { fontFamily: font.bodySemi, fontSize: 14, lineHeight: 23, color: palette.textSoft },
  sheetDetail: { fontFamily: font.body, fontSize: 14, lineHeight: 24, color: palette.muted },
  sheetAction: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  sheetActionText: { fontFamily: font.bodySemi, fontSize: 13, letterSpacing: 0.4 },
});
