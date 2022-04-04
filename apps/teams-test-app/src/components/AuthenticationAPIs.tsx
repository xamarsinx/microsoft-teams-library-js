import { app, authentication, initialize } from '@microsoft/teams-js';
import { HostClientType, IdentityProvider, M365ClientApplication } from 'msal-m365/dist';
import React, { ReactElement } from 'react';

import AuthInstanceContext from './AuthInstanceContext';
import { ApiWithoutInput, ApiWithTextInput } from './utils';

const initAuthInstance = (): Promise<M365ClientApplication> => {
  return new Promise(resolve => {
    app.getContext().then(context => {
      resolve(
        new M365ClientApplication(
          {
            identityInfo: {
              providerName: IdentityProvider.msIdentity,
              clientId: '34d8e67c-2758-40b5-836f-eb7defa875d3', // Have to provide client ID
              redirectUri: context.page.sourceOrigin as string,
              authority: `https://login.microsoftonline.com/${
                context.user?.tenant?.id ? context.user?.tenant?.id : 'common'
              }`,
            },
            userInfo: {
              loginHint: context.user?.loginHint as string,
              tenantId: context.user?.tenant?.id,
            },
            hostInfo: {
              clientType: context.app.host.clientType as HostClientType,
            },
          },
          authentication,
        ),
      );
    });
  });
};

const Initialize = (): React.ReactElement =>
  ApiWithoutInput({
    name: 'initialize',
    title: 'Initialize',
    onClick: {
      withPromise: async () => {
        await app.initialize();
        return 'called';
      },
      withCallback: setResult => {
        const callback = (): void => {
          return;
        };
        initialize(callback);
        setResult('called');
      },
    },
  });

const GetAuthToken = (): React.ReactElement => {
  const authInstance = React.useContext(AuthInstanceContext);

  return ApiWithTextInput<authentication.AuthTokenRequestParameters>({
    name: 'getAuthToken',
    title: 'Get Auth Token',
    onClick: {
      validateInput: () => {
        return; //This API can have no input
      },
      submit: {
        withPromise: async authParams => {
          const result = await authentication.getAuthToken(authParams);
          return JSON.stringify(result);
        },
        withCallback: (authParams, setResult) => {
          const callback = (result: string): void => {
            setResult(result);
          };
          const authRequest: authentication.AuthTokenRequest = {
            successCallback: callback,
            failureCallback: callback,
            ...authParams,
          };
          authInstance
            ?.acquireTokenSilent({ scopes: authRequest.resources as string[] })
            .then(r => callback(r.accessToken))
            .catch(r => callback(r));
        },
      },
    },
  });
};

const GetUser = (): React.ReactElement =>
  ApiWithoutInput({
    name: 'getUser',
    title: 'Get User',
    onClick: {
      withPromise: async () => {
        const user = await authentication.getUser();
        return JSON.stringify(user);
      },
      withCallback: setResult => {
        const successCallback = (user: authentication.UserProfile): void => {
          setResult(JSON.stringify(user));
        };
        const failureCallback = (reason: string): void => {
          setResult(reason);
        };
        const userRequest: authentication.UserRequest = {
          successCallback: successCallback,
          failureCallback: failureCallback,
        };
        authentication.getUser(userRequest);
      },
    },
  });

const NotifyFailure = (): React.ReactElement =>
  ApiWithTextInput<string>({
    name: 'authentication.notifyFailure2',
    title: 'authentication.notifyFailure',
    onClick: async input => {
      authentication.notifyFailure(input);
      return 'called';
    },
  });

const NotifySuccess = (): React.ReactElement =>
  ApiWithTextInput<string>({
    name: 'authentication.notifySuccess2',
    title: 'authentication.notifySuccess',
    onClick: async input => {
      authentication.notifySuccess(input);
      return 'called';
    },
  });

const Authenticate = (): React.ReactElement =>
  ApiWithTextInput<authentication.AuthenticatePopUpParameters>({
    name: 'authentication.authenticate2',
    title: 'authentication.authenticate',
    onClick: {
      validateInput: input => {
        if (!input.url) {
          throw new Error('url is required');
        }
      },
      submit: {
        withPromise: async authParams => {
          const token = await authentication.authenticate(authParams);
          return 'Success: ' + token;
        },
        withCallback: (authParams, setResult) => {
          const successCallback = (result: string): void => {
            setResult('Success: ' + result);
          };
          const failureCallback = (result: string): void => {
            setResult('Error: Error: ' + result);
          };
          const authRequest: authentication.AuthenticateParameters = {
            successCallback: successCallback,
            failureCallback: failureCallback,
            ...authParams,
          };
          authentication.authenticate(authRequest);
        },
      },
    },
  });

const AuthenticationAPIs = (): ReactElement => {
  const [authInstance, setAuthInstance] = React.useState<M365ClientApplication | null>(null);

  React.useEffect(() => {
    initAuthInstance().then(i => setAuthInstance(i));
  }, []);

  return (
    <>
      <AuthInstanceContext.Provider value={authInstance}>
        <h1>authentication</h1>
        <Initialize />
        <GetAuthToken />
        <GetUser />
        <NotifyFailure />
        <NotifySuccess />
        <Authenticate />
      </AuthInstanceContext.Provider>
    </>
  );
};

export default AuthenticationAPIs;
