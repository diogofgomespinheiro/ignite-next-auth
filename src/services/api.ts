import Router from 'next/router';
import axios, { AxiosError } from 'axios';
import { parseCookies, setCookie } from 'nookies';

import { destroyAuthCookies, setAuthCookies } from '../utils/auth';

let cookies = parseCookies();
let isRefreshing = false;
let failedRequestsQueue = [];

export const api = axios.create({
  baseURL: 'http://localhost:3333',
  headers: {
    Authorization: `Bearer ${cookies['nextauth.token']}`,
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.log(error.response);
    const isForbiddenError = error.response.status === 401;
    const isTokenExpired = error.response.data?.code === 'token.expired';

    if (!isForbiddenError) return Promise.reject(error);

    if (!isTokenExpired) {
      destroyAuthCookies();
      Router.push('/');
      return Promise.reject(error);
    }

    cookies = parseCookies();
    const { 'nextauth.refreshToken': refreshToken } = cookies;
    const originalConfig = error.config;

    if (!isRefreshing) {
      isRefreshing = true;

      api
        .post('/refresh', { refreshToken })
        .then((response) => {
          const { token, refreshToken: newRefreshToken } = response.data;

          setAuthCookies(token, newRefreshToken);
          api.defaults.headers['Authorization'] = `Bearer ${token}`;

          failedRequestsQueue.forEach((request) => request.onSuccess(token));
          failedRequestsQueue = [];
        })
        .catch((err) => {
          failedRequestsQueue.forEach((request) => request.onFailure(err));
          failedRequestsQueue = [];
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
