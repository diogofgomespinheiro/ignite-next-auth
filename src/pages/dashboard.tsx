import { GetServerSideProps } from 'next';
import { useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/apiClient';
import { setupApiClient } from '../services/api';
import { withSSRAuth } from '../utils/hocs/withSSRAuth';

export default function Dashboard() {
  const { user } = useAuth();

  useEffect(() => {
    api
      .get('/me')
      .then((response) => {
        console.log(response);
      })
      .catch((err) => console.log(err));
  }, []);

  return <h1>{user?.email}</h1>;
}

export const getServerSideProps: GetServerSideProps = withSSRAuth(
  async (ctx) => {
    const apiClient = setupApiClient(ctx);
    await apiClient.get('/me');

    return {
      props: {},
    };
  }
);
