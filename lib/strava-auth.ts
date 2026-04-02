import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const STRAVA_STATE_KEY = "movara.strava.oauth_state";
const STRAVA_WEB_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_MOBILE_AUTHORIZE_URL = "https://www.strava.com/oauth/mobile/authorize";

export const STRAVA_SCOPE = "activity:read_all,profile:read_all";

export function createStravaRedirectUri() {
  return AuthSession.makeRedirectUri({
    scheme: "movara",
    path: "strava/callback",
  });
}

export function createStravaOauthState() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildStravaAuthorizationUrl(args: {
  clientId: string;
  redirectUri: string;
  state: string;
}) {
  const authorizeUrl = Platform.OS === "web" ? STRAVA_WEB_AUTHORIZE_URL : STRAVA_MOBILE_AUTHORIZE_URL;
  const search = new URLSearchParams({
    client_id: args.clientId,
    redirect_uri: args.redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: STRAVA_SCOPE,
    state: args.state,
  });

  return `${authorizeUrl}?${search.toString()}`;
}

export async function saveStravaOauthState(state: string) {
  if (Platform.OS === "web") {
    sessionStorage.setItem(STRAVA_STATE_KEY, state);
    return;
  }

  await SecureStore.setItemAsync(STRAVA_STATE_KEY, state);
}

export async function consumeStravaOauthState() {
  if (Platform.OS === "web") {
    const state = sessionStorage.getItem(STRAVA_STATE_KEY);
    sessionStorage.removeItem(STRAVA_STATE_KEY);
    return state;
  }

  const state = await SecureStore.getItemAsync(STRAVA_STATE_KEY);
  await SecureStore.deleteItemAsync(STRAVA_STATE_KEY);
  return state;
}

export function normalizeSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
