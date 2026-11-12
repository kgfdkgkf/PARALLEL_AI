import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'home'
  | 'spark'
  | 'archive'
  | 'profile'
  | 'back'
  | 'chevron'
  | 'map'
  | 'people'
  | 'timeline'
  | 'lock'
  | 'send'
  | 'sound'
  | 'reset'
  | 'close'
  | 'check'
  | 'clock'
  | 'branch'
  | 'eye'
  | 'plus'
  | 'compass';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
};

export function Icon({ name, size = 22, color = '#F6F3FF', strokeWidth = 1.5, filled = false }: Props) {
  const common = {
    stroke: color,
    strokeWidth,
    fill: 'none' as const,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && (
        <Path d="M4 10.6 12 4l8 6.6V20h-5.6v-5.4H9.6V20H4z" {...common} />
      )}
      {name === 'spark' && (
        <Path
          d="M12 2.4 13.7 9.6 21 11.4 13.7 13.2 12 20.4 10.3 13.2 3 11.4 10.3 9.6z"
          {...common}
          fill={filled ? color : 'none'}
        />
      )}
      {name === 'archive' && (
        <>
          <Rect x="3.5" y="5" width="17" height="4.4" rx="1.2" {...common} />
          <Path d="M5.2 9.4V19h13.6V9.4M9.6 13h4.8" {...common} />
        </>
      )}
      {name === 'profile' && (
        <>
          <Circle cx="12" cy="8.6" r="3.6" {...common} />
          <Path d="M4.8 20c.9-3.6 3.7-5.6 7.2-5.6s6.3 2 7.2 5.6" {...common} />
        </>
      )}
      {name === 'back' && <Path d="M14.6 5 7.6 12l7 7" {...common} />}
      {name === 'chevron' && <Path d="M9.4 5 16.4 12l-7 7" {...common} />}
      {name === 'map' && (
        <>
          <Path d="M9 4.6 3.6 6.6v12.8L9 17.4l6 2 5.4-2V4.6l-5.4 2z" {...common} />
          <Path d="M9 4.6v12.8M15 6.6v12.8" {...common} />
        </>
      )}
      {name === 'people' && (
        <>
          <Circle cx="9" cy="8.4" r="3" {...common} />
          <Path d="M3.8 19c.7-3 2.9-4.6 5.2-4.6S13.5 16 14.2 19" {...common} />
          <Path d="M15.4 6.2a2.7 2.7 0 0 1 0 5.2M17 14.8c1.9.5 3.1 2 3.5 4.2" {...common} />
        </>
      )}
      {name === 'timeline' && (
        <>
          <Path d="M3.5 12h17" {...common} />
          <Circle cx="7" cy="12" r="2" {...common} />
          <Circle cx="17" cy="12" r="2" {...common} />
          <Path d="M7 14v4M17 10V6" {...common} />
        </>
      )}
      {name === 'lock' && (
        <>
          <Rect x="5" y="10.4" width="14" height="9.4" rx="2" {...common} />
          <Path d="M8.4 10.4V8a3.6 3.6 0 0 1 7.2 0v2.4M12 14.2v2" {...common} />
        </>
      )}
      {name === 'send' && <Path d="M4 12 20 4l-5.2 16-3.2-6z" {...common} />}
      {name === 'sound' && (
        <>
          <Path d="M4.5 9.5v5h3l4 3.4V6.1l-4 3.4z" {...common} />
          <Path d="M15.6 9a4.4 4.4 0 0 1 0 6M18.2 6.6a7.8 7.8 0 0 1 0 10.8" {...common} />
        </>
      )}
      {name === 'reset' && (
        <>
          <Path d="M4.4 12a7.6 7.6 0 1 0 2.6-5.7" {...common} />
          <Path d="M4 4.6v4.2h4.2" {...common} />
        </>
      )}
      {name === 'close' && <Path d="M6 6l12 12M18 6 6 18" {...common} />}
      {name === 'check' && <Path d="M4.6 12.4 9.6 17.4 19.4 6.6" {...common} />}
      {name === 'clock' && (
        <>
          <Circle cx="12" cy="12" r="8.4" {...common} />
          <Path d="M12 7.4V12l3.4 2" {...common} />
        </>
      )}
      {name === 'branch' && (
        <>
          <Circle cx="6" cy="5.6" r="2.1" {...common} />
          <Circle cx="18" cy="12" r="2.1" {...common} />
          <Circle cx="6" cy="18.4" r="2.1" {...common} />
          <Path d="M6 7.7v8.6M6 12h6.4a3.5 3.5 0 0 0 3.4-2.6" {...common} />
        </>
      )}
      {name === 'eye' && (
        <>
          <Path d="M2.6 12S6 6.4 12 6.4 21.4 12 21.4 12 18 17.6 12 17.6 2.6 12 2.6 12z" {...common} />
          <Circle cx="12" cy="12" r="2.6" {...common} />
        </>
      )}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...common} />}
      {name === 'compass' && (
        <>
          <Circle cx="12" cy="12" r="8.4" {...common} />
          <Path d="M15.4 8.6 13.6 13.6 8.6 15.4l1.8-5z" {...common} />
        </>
      )}
    </Svg>
  );
}
