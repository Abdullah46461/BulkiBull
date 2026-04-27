import { computed, ref } from 'vue';

export type ThemePreference = 'system' | 'light' | 'dark';

type ResolvedTheme = Exclude<ThemePreference, 'system'>;

const THEME_PREFERENCE_STORAGE_KEY = 'bulki-bull-theme-preference';
const IONIC_DARK_CLASS = 'ion-palette-dark';
const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)';
const THEME_COLOR_META_NAME = 'theme-color';

const themePreference = ref<ThemePreference>('system');
const systemTheme = ref<ResolvedTheme>('light');

const resolvedTheme = computed<ResolvedTheme>(() =>
  themePreference.value === 'system' ? systemTheme.value : themePreference.value,
);

let isInitialized = false;
let removeSystemThemeListener: (() => void) | null = null;

const isThemePreference = (value: string | null): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

const readStoredThemePreference = (): ThemePreference => {
  if (typeof window === 'undefined') {
    return 'system';
  }

  const storedPreference = window.localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);
  return isThemePreference(storedPreference) ? storedPreference : 'system';
};

const updateThemeColorMeta = (theme: ResolvedTheme): void => {
  const themeColorMeta = document.querySelector<HTMLMetaElement>(
    `meta[name="${THEME_COLOR_META_NAME}"]`,
  );

  themeColorMeta?.setAttribute('content', theme === 'dark' ? '#101613' : '#f5f7f3');
};

const applyTheme = (): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const rootElement = document.documentElement;
  const nextResolvedTheme = resolvedTheme.value;

  rootElement.classList.toggle(IONIC_DARK_CLASS, nextResolvedTheme === 'dark');
  rootElement.dataset.themePreference = themePreference.value;
  rootElement.dataset.theme = nextResolvedTheme;
  rootElement.style.colorScheme = nextResolvedTheme;

  updateThemeColorMeta(nextResolvedTheme);
};

const setSystemTheme = (matchesDark: boolean): void => {
  systemTheme.value = matchesDark ? 'dark' : 'light';
  applyTheme();
};

const watchSystemTheme = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const mediaQueryList = window.matchMedia(DARK_MODE_MEDIA_QUERY);
  setSystemTheme(mediaQueryList.matches);

  const handleSystemThemeChange = (event: MediaQueryListEvent): void => {
    setSystemTheme(event.matches);
  };

  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', handleSystemThemeChange);
    removeSystemThemeListener = () =>
      mediaQueryList.removeEventListener('change', handleSystemThemeChange);
    return;
  }

  mediaQueryList.addListener(handleSystemThemeChange);
  removeSystemThemeListener = () => mediaQueryList.removeListener(handleSystemThemeChange);
};

export const initializeTheme = (): void => {
  if (isInitialized) {
    applyTheme();
    return;
  }

  themePreference.value = readStoredThemePreference();
  watchSystemTheme();
  applyTheme();
  isInitialized = true;
};

export const setThemePreference = (preference: ThemePreference): void => {
  themePreference.value = preference;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, preference);
  }

  applyTheme();
};

export const toggleThemePreference = (): void => {
  setThemePreference(resolvedTheme.value === 'dark' ? 'light' : 'dark');
};

export const disposeTheme = (): void => {
  removeSystemThemeListener?.();
  removeSystemThemeListener = null;
  isInitialized = false;
};

export const useTheme = () => ({
  resolvedTheme,
  themePreference,
  setThemePreference,
  toggleThemePreference,
});
