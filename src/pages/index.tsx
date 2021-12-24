import { useState, FormEvent, SyntheticEvent } from 'react';
import type { NextPage } from 'next';

import { useAuth } from '../contexts/AuthContext';

interface FormData {
  email: string;
  password: string;
}

const Home: NextPage = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  } as FormData);
  const { signIn } = useAuth();

  function handleInputChange(event: FormEvent<HTMLInputElement>) {
    const { name, value } = event.currentTarget;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  }

  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    await signIn(formData);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
      />
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleInputChange}
      />
      <button type="submit">Login</button>
    </form>
  );
};

export default Home;
