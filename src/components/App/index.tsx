import React from 'react';
import './App.css';

import Amplify, { Auth } from 'aws-amplify';
import awsConfig from '../../aws-exports';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import { AmplifyAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';

import AWS from 'aws-sdk';
import database from '../../utils/database';

import Scraper from '../../utils/scraper';

Amplify.configure(awsConfig);

async function scrape() {
  try {
    const scraper = new Scraper();
    const links = await scraper.scrapeSite('https://smartebike.co.uk/', { amazon: ['www.amazon.co.uk'] }, { delay: 1000 });
    console.log(links);
  } catch (error) {
    console.log(error);
  }
}

function App() {

  const [authState, setAuthState] = React.useState<AuthState>();
  const [name, setName] = React.useState<string>();

  React.useEffect(() => {
    return onAuthUIStateChange(async (authState, user: { [key: string]: any } | undefined) => {
      if (authState === AuthState.SignedIn) {
        AWS.config.region = 'us-east-1';
        AWS.config.credentials = await Auth.currentCredentials();
        /*AWS.config.credentials = new AWS.CognitoIdentityCredentials({
          IdentityPoolId: 'us-east-1:88e9ef87-bf66-4cca-8444-d4dae4ffb582',
          Logins: {
            'cognito-idp.us-east-1.amazonaws.com/us-east-1_47AghMuTk': user?.signInUserSession.accessToken.jwtToken
          }
        });*/
        const username = user?.username;
        await database.loadData(username);
        setName(username.charAt(0).toUpperCase() + username.slice(1));
        scrape();
      }
      setAuthState(authState);
    });
  }, []);

  if (authState === AuthState.SignedIn) {
    return (
      <div>
        <div style={{ margin: "1rem" }}>
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
