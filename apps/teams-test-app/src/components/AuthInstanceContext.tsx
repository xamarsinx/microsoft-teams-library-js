import { M365ClientApplication } from 'msal-m365/dist';
import React from 'react';

const AuthInstanceContext: React.Context<M365ClientApplication | null> = React.createContext<M365ClientApplication | null>(
  null,
);

export default AuthInstanceContext;
