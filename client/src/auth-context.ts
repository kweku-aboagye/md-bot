import { createContext, useContext } from 'react';

export interface AuthCtx {
  pinRequired: boolean;
  showPinModal: (onSuccess: (pinOverride?: string) => void, errorMessage?: string | null) => void;
}

export const AuthContext = createContext<AuthCtx>({
  pinRequired: false,
  showPinModal: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
