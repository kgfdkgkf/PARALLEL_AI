import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Atmosphere } from './src/components/Atmosphere';
import { BrandMark } from './src/components/Cover';
import { Onboarding } from './src/components/Onboarding';
import { Mono } from './src/components/ui';
import { useParallel, type Screen } from './src/state/useParallel';
import { HomeScreen } from './src/screens/HomeScreen';
import { CreateScreen } from './src/screens/CreateScreen';
import { ForgeScreen } from './src/screens/ForgeScreen';
import { WorldScreen } from './src/screens/WorldScreen';
import { CharacterScreen } from './src/screens/CharacterScreen';
import { DecisionScreen } from './src/screens/DecisionScreen';
import { OutcomeScreen } from './src/screens/OutcomeScreen';
import { BranchesScreen } from './src/screens/BranchesScreen';
import { EndingScreen } from './src/screens/EndingScreen';
import { ArchiveScreen } from './src/screens/ArchiveScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { font, palette } from './src/theme';

function BootSplash() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={{ flex: 1 }}>
      <Atmosphere accent="violet" starCount={90} />
      <View style={styles.boot}>
        <Animated.View
          style={{
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] }) }],
          }}
        >
          <BrandMark size={64} />
        </Animated.View>
        <Text style={styles.bootTitle}>ПАРАЛЛЕЛЬ</Text>
        <Mono style={{ marginTop: 8 }}>инициализация реальности</Mono>
      </View>
    </View>
  );
}

function Scene({ screen, children }: { screen: Screen; children: React.ReactNode }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, screen]);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: progress,
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

function AppShell() {
  const store = useParallel();
  const [fontsLoaded, fontError] = useFonts({
    UnboundedLight: require('./assets/fonts/UnboundedLight.ttf'),
    Unbounded: require('./assets/fonts/Unbounded.ttf'),
    UnboundedSemi: require('./assets/fonts/UnboundedSemi.ttf'),
    Manrope: require('./assets/fonts/Manrope.ttf'),
    ManropeSemi: require('./assets/fonts/ManropeSemi.ttf'),
    ManropeBold: require('./assets/fonts/ManropeBold.ttf'),
  });

  const ready = store.hydrated && (fontsLoaded || fontError);

  const goBack = store.back;
  const back = useCallback(() => {
    goBack();
    return true;
  }, [goBack]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', back);
    return () => subscription.remove();
  }, [back]);

  if (!ready) return <BootSplash />;

  const screen = (() => {
    switch (store.screen) {
      case 'home':
        return <HomeScreen store={store} />;
      case 'create':
        return <CreateScreen store={store} />;
      case 'forge':
        return <ForgeScreen store={store} />;
      case 'world':
        return <WorldScreen store={store} />;
      case 'character':
        return <CharacterScreen store={store} />;
      case 'decision':
        return <DecisionScreen store={store} />;
      case 'outcome':
        return <OutcomeScreen store={store} />;
      case 'branches':
        return <BranchesScreen store={store} />;
      case 'ending':
        return <EndingScreen store={store} />;
      case 'archive':
        return <ArchiveScreen store={store} />;
      case 'profile':
        return <ProfileScreen store={store} />;
      default:
        return <HomeScreen store={store} />;
    }
  })();

  return (
    <View style={{ flex: 1, backgroundColor: palette.ink }}>
      <StatusBar barStyle="light-content" />
      <Scene screen={store.screen}>{screen}</Scene>
      <Onboarding />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppShell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  bootTitle: {
    fontFamily: font.displayBook,
    fontSize: 17,
    letterSpacing: 6,
    color: palette.text,
    marginTop: 10,
  },
});
