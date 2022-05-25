import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  LayoutAnimation,
  NativeModules,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { useDarkMode } from 'react-native-dark-mode';
import { ThemeProvider } from 'styled-components';
import { getTheme, saveTheme } from '../handlers/localstorage/theme';
import { darkModeThemeColors, lightModeThemeColors } from '../styles/colors';
import currentColors from './currentColors';
import { DesignSystemProvider } from '@rainbow-me/design-system';
import { StyleThingThemeProvider } from '@rainbow-me/styled-components';

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system',
};

type Scheme = keyof typeof THEMES;

export const ThemeContext = createContext({
  colors: lightModeThemeColors,
  isDarkMode: false,
  setTheme: (_scheme: Scheme) => {},
});

const { RNThemeModule } = NativeModules;

export const MainThemeProvider = ({ children }: { children: ReactNode }) => {
  const [colorScheme, setColorScheme] = useState<Scheme>();

  // looks like one works on Android and another one on iOS. good.
  const isSystemDarkModeIOS = useDarkMode();
  const isSystemDarkModeAndroid = useColorScheme() === 'dark';
  const isSystemDarkMode = ios ? isSystemDarkModeIOS : isSystemDarkModeAndroid;

  const colorSchemeSystemAdjusted =
    colorScheme === THEMES.SYSTEM
      ? isSystemDarkMode
        ? 'dark'
        : 'light'
      : colorScheme;
  useEffect(() => {
    setTimeout(() => RNThemeModule?.setMode(colorSchemeSystemAdjusted), 400);
  }, [colorSchemeSystemAdjusted]);

  // Override default with user preferences
  useEffect(() => {
    const loadUserPref = async () => {
      const userPref = (await getTheme()) || THEMES.LIGHT;
      const userPrefSystemAdjusted =
        userPref === THEMES.SYSTEM
          ? isSystemDarkMode
            ? 'dark'
            : 'light'
          : userPref;
      StatusBar.setBarStyle(
        userPrefSystemAdjusted === THEMES.DARK
          ? 'light-content'
          : 'dark-content',
        true
      );
      currentColors.theme = userPrefSystemAdjusted;
      (currentColors as any).themedColors =
        userPrefSystemAdjusted === THEMES.DARK
          ? darkModeThemeColors
          : lightModeThemeColors;
      setColorScheme(userPref);
    };
    loadUserPref();
  }, [isSystemDarkMode]);

  // Listening to changes of device appearance while in run-time
  useEffect(() => {
    if (colorScheme) {
      //setIsDarkMode(colorScheme === THEMES.DARK);
      saveTheme(colorScheme);
    }
  }, [colorScheme]);

  const currentTheme = useMemo(
    () => ({
      colors:
        colorSchemeSystemAdjusted === 'dark'
          ? darkModeThemeColors
          : lightModeThemeColors,
      colorScheme,
      darkScheme: darkModeThemeColors,
      isDarkMode: colorSchemeSystemAdjusted === 'dark',
      lightScheme: lightModeThemeColors,
      // Overrides the isDarkMode value will cause re-render inside the context.
      setTheme: (scheme: Scheme) => {
        const schemeSystemAdjusted =
          scheme === THEMES.SYSTEM
            ? isSystemDarkMode
              ? 'dark'
              : 'light'
            : scheme;
        currentColors.theme = schemeSystemAdjusted;
        StatusBar.setBarStyle(
          schemeSystemAdjusted === THEMES.DARK
            ? 'light-content'
            : 'dark-content',
          true
        );
        (currentColors as any).themedColors =
          schemeSystemAdjusted === THEMES.DARK
            ? darkModeThemeColors
            : lightModeThemeColors;
        setColorScheme(scheme);
        LayoutAnimation.configureNext(
          LayoutAnimation.create(1000, 'easeInEaseOut', 'opacity')
        );
      },
    }),
    [colorScheme, colorSchemeSystemAdjusted, isSystemDarkMode]
  );

  if (!colorScheme) {
    return null;
  }

  return (
    <StyleThingThemeProvider value={currentTheme}>
      <ThemeProvider theme={currentTheme}>
        <ThemeContext.Provider value={currentTheme}>
          <DesignSystemProvider
            colorMode={currentTheme.isDarkMode ? 'dark' : 'light'}
          >
            {children}
          </DesignSystemProvider>
        </ThemeContext.Provider>
      </ThemeProvider>
    </StyleThingThemeProvider>
  );
};

// Custom hook to get the theme object returns {isDarkMode, colors, setTheme}
export const useTheme = () => useContext(ThemeContext);

export type ThemeType = ReturnType<typeof useTheme>;

type ComponentType = new (...args: any[]) => React.Component<any, any>;

export function withThemeContext(Component: ComponentType) {
  return function WrapperComponent(props: any) {
    return (
      <ThemeContext.Consumer>
        {state => <Component {...props} {...state} />}
      </ThemeContext.Consumer>
    );
  };
}
