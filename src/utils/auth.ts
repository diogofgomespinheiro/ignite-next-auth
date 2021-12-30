import { CookieSerializeOptions } from 'next/dist/server/web/types';
import { setCookie, destroyCookie } from 'nookies';

export function destroyAuthCookies() {
  destroyCookie(undefined, 'nextauth.token');
  destroyCookie(undefined, 'nextauth.refreshToken');
}

export function setAuthCookies(
  token: string,
  refreshToken: string,
  options: CookieSerializeOptions = {
    maxAge: 60 * 60 * 24 * 30, // 30 days,
    path: '/',
  }
) {
  setCookie(null, 'nextauth.token', token, options);
  setCookie(null, 'nextauth.refreshToken', refreshToken, options);
}
