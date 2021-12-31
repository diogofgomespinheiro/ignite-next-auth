import { GetServerSideProps } from 'next';
import { useEffect } from 'react';

import { Can } from '../components/Can';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/apiClient';
import { setupApiClient } from '../services/api';
import { withSSRAuth } from '../utils/hocs/withSSRAuth';

export default function Dashboard() {
  const { user, signOut } = useAuth();

  useEffect(() => {
    api
      .get('/me')
      .then((response) => {
        console.log(response);
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <>
      <h1>{user?.email}</h1>
      <button onClick={signOut}>Sign out</button>
      <Can permissions={['metrics.list']}>
        <div>Metrics</div>
      </Can>
    </>
  );
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
