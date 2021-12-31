import { GetServerSidePropsContext } from 'next';
import Router from 'next/router';
import axios, { AxiosError } from 'axios';
import { parseCookies } from 'nookies';

import { AuthTokenError } from './errors';
import { destroyAuthCookies, setAuthCookies } from '../utils/auth';

let isRefreshing = false;
let failedRequestsQueue = [];

export function setupApiClient(ctx: GetServerSidePropsContext = undefined) {
  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`,
    },
  });

  api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const isForbiddenError = error.response.status === 401;
      const isTokenExpired = error.response.data?.code === 'token.expired';

      if (!isForbiddenError) return Promise.reject(error);

      if (!isTokenExpired) {
        destroyAuthCookies(ctx);

        if (process.browser) {
          Router.push('/');
          return Promise.reject(error);
        }

        return Promise.reject(new AuthTokenError());
      }

      cookies = parseCookies(ctx);
      const { 'nextauth.refreshToken': refreshToken } = cookies;
      const originalConfig = error.config;

      if (!isRefreshing) {
        isRefreshing = true;

        api
          .post('/refresh', { refreshToken })
          .then((response) => {
            const { token, refreshToken: newRefreshToken } = response.data;

            setAuthCookies({ token, refreshToken: newRefreshToken, ctx });
            api.defaults.headers['Authorization'] = `Bearer ${token}`;

            failedRequestsQueue.forEach((request) => request.onSuccess(token));
            failedRequestsQueue = [];
          })
          .catch((err) => {
            failedRequestsQueue.forEach((request) => request.onFailure(err));
            failedRequestsQueue = [];

            if (process.browser) {
              Router.push('/');
            }
          })
          .finally(() => {
            isRefreshing = false;
          });
      }

      return new Promise((resolve, reject) => {
        failedRequestsQueue.push({
          onSuccess: (token: string) => {
            originalConfig.headers['Authorization'] = `Bearer ${token}`;
            resolve(api(originalConfig));
          },
          onFailure: (err: AxiosError) => {
            reject(err);
          },
        });
      });
    }
  );

  return api;
}
