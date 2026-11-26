import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

function getWebOrigin() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:8081';
}

export async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getWebOrigin() },
    });
    if (error) throw error;
    return;
  }

  // Mobile: usa a URL do Expo Go (exp://...)
  const redirectTo = Linking.createURL('/');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error('URL de autenticação não disponível.');

  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    redirectTo,
    { showInRecents: true }
  );

  if (result.type === 'cancel') throw new Error('Login cancelado.');
  if (result.type !== 'success') throw new Error('Login falhou.');

  const url = result.url;

  // Tenta hash primeiro, depois query params
  let params: Record<string, string> = {};
  
  const hash = new URL(url).hash.substring(1);
  if (hash) {
    params = hash.split('&').reduce((acc: Record<string, string>, part) => {
      const [key, value] = part.split('=');
      if (key && value) acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
  }
  
  if (!params['access_token']) {
    const searchParams = new URL(url).searchParams;
    searchParams.forEach((value, key) => { params[key] = value; });
  }

  const access_token = params['access_token'];
  const refresh_token = params['refresh_token'];
  if (!access_token) throw new Error('Token de acesso não recebido.');

  const { error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (sessionError) throw sessionError;
}