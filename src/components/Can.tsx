import { useCan } from '../utils/hooks';

interface CanProps {
  children: React.ReactNode;
  permissions?: string[];
  roles?: string[];
}

export function Can({ children, permissions, roles }: CanProps) {
  const userCanSeeComponent = useCan({ permissions, roles });

  if (!userCanSeeComponent) return null;

  return <>{children}</>;
}
