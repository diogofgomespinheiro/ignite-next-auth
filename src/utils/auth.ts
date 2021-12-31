import { GetServerSidePropsContext } from 'next';
import { CookieSerializeOptions } from 'next/dist/server/web/types';
import { setCookie, destroyCookie } from 'nookies';

export function destroyAuthCookies(ctx: GetServerSidePropsContext = undefined) {
  destroyCookie(ctx, 'nextauth.token');
  destroyCookie(ctx, 'nextauth.refreshToken');
}

interface SetAuthCookiesParams {
  token: string;
  refreshToken: string;
  options?: CookieSerializeOptions;
  ctx?: GetServerSidePropsContext;
}

export function setAuthCookies({
  token,
  refreshToken,
  options = {
    maxAge: 60 * 60 * 24 * 30, // 30 days,
    path: '/',
  },
  ctx = undefined,
}: SetAuthCookiesParams) {
  setCookie(ctx, 'nextauth.token', token, options);
  setCookie(ctx, 'nextauth.refreshToken', refreshToken, options);
}
