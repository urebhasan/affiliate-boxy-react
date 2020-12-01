import React from 'react';
import './App.css';

import Amplify, { Auth } from 'aws-amplify';
import awsConfig from './aws-exports';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import { AmplifyAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';

import AWS from 'aws-sdk';
import database from './utils/database';

type User = { [key: string]: any } | undefined;

Amplify.configure(awsConfig);

function App() {
  const [authState, setAuthState] = React.useState<AuthState>();
  const [name, setName] = React.useState<string>();

  React.useEffect(() => {
    return onAuthUIStateChange(async (authState, user: User) => {
      if (authState === AuthState.SignedIn) {
        //const credentials = await Auth.currentUserCredentials();
        //AWS.config.region = 'us-east-1';
        //AWS.config.credentials = credentials;
        //await database.loadData(user?.username);
        const username = user?.username;
        setName(username.charAt(0).toUpperCase() + username.slice(1));
      }
      setAuthState(authState);
    });
  }, []); 

  if (authState === AuthState.SignedIn) {
    return (
      <div>
        <div style={{margin: "1rem"}}>
          <div>Welcome back {name}</div>
        </div>
        <AmplifySignOut />
      </div>
    );
  } else {
    return (<AmplifyAuthenticator />);
  }
}

export default App;
