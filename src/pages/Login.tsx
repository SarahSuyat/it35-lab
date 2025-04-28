import {
  IonAlert,
  IonAvatar,
  IonButton,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonPage,
  IonToast,
  useIonRouter
} from '@ionic/react';
import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const Login: React.FC = () => {
  const navigation = useIonRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const doLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage(error.message);
      setShowAlert(true);
      return;
    }

    setShowToast(true);
    setTimeout(() => {
      navigation.push('/it35-lab/app', 'forward', 'replace');
    }, 300);
  };

  return (
    <IonPage>
      <IonContent fullscreen style={{ padding: 0 }}>
        {/* Background Container */}
        <div style={{
          height: '100vh',
          width: '100%',
          backgroundImage: `url('https://images.wallpaperscraft.com/image/single/branch_bottle_necklace_199652_1280x720.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          fontFamily: '"Segoe UI", sans-serif'
        }}>
          {/* Overlay for blur effect */}
          <div style={{
            position: 'absolute',
            height: '100%',
            width: '100%',
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)', // slightly dark overlay
            zIndex: 1
          }}></div>

          {/* Login Form */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            maxWidth: '500px', // pa-dako ang form
            padding: '40px',
            backgroundColor: 'rgba(0, 0, 0, 0.81)',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: '2px solid #c8a77f'
          }}>
            <IonAvatar style={{
              margin: '0 auto 20px',
              width: '100px',
              height: '100px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              border: '2px solid #b88e5a'
            }}>
              <img
                src="https://ionicframework.com/docs/img/demos/avatar.svg"
                alt="User Avatar"
                style={{ width: '100%', height: '100%' }}
              />
            </IonAvatar>

            <h2 style={{
              textAlign: 'center',
              marginBottom: '25px',
              color: 'rgb(248, 216, 176)',
              fontWeight: 'bold',
              fontSize: '28px'
            }}>
              LOGIN
            </h2>

            <IonInput
              label="Email"
              labelPlacement="floating"
              fill="outline"
              type="email"
              placeholder="Enter Email"
              onIonChange={e => setEmail(e.detail.value!)}
              value={email}
            />
            <IonInput
              style={{ marginTop: '20px' }}
              fill="outline"
              type="password"
              placeholder="Enter Password"
              onIonChange={e => setPassword(e.detail.value!)}
              value={password}
            >
              <IonInputPasswordToggle slot="end" />
            </IonInput>

            <IonButton
              expand="full"
              shape="round"
              style={{
                marginTop: '30px',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
              onClick={doLogin}
            >
              Log In
            </IonButton>

            <IonButton
              routerLink="/it35-lab/register"
              expand="full"
              fill="clear"
              shape="round"
              style={{ marginTop: '15px', color: 'rgb(202, 160, 108)', fontSize: '14px' }}
            >
              No account yet? Register here
            </IonButton>
          </div>

          {/* Alerts */}
          <IonAlert
            isOpen={showAlert}
            onDidDismiss={() => setShowAlert(false)}
            header="Login Failed"
            message={errorMessage}
            buttons={['OK']}
          />
          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message="Login successful! Redirecting..."
            duration={1500}
            position="top"
            color="primary"
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
