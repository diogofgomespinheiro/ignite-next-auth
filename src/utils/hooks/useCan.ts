import { useAuth } from '../../contexts/AuthContext';
import { validateUserPermissions } from '../auth';

type UseCanParams = {
  permissions?: string[];
  roles?: string[];
};

export function useCan({
  permissions = [],
  roles = [],
}: UseCanParams): boolean {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return false;
  }

  return validateUserPermissions({
    user,
    permissions,
    roles,
  });
}
