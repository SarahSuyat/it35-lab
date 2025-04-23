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
import backg from "../images/backg.jpg";
import { supabase } from '../utils/supabaseClient';

const AlertBox: React.FC<{ message: string; isOpen: boolean; onClose: () => void }> = ({ message, isOpen, onClose }) => {
  return (
    <IonAlert
      isOpen={isOpen}
      onDidDismiss={onClose}
      header="Notification"
      message={message}
      buttons={['OK']}
    />
  );
};

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
        {/* MAIN BACKGROUND WRAPPER */}
        <div style={{
          height: '100vh',
          width: '100%',
          background: 'linear-gradient(to right,rgba(192, 153, 103, 0.32),rgba(194, 170, 122, 0.57))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: '"Segoe UI", sans-serif'
        }}>
          {/* SINGLE CONTAINER WITH BACKGROUND IMAGE */}
          <div style={{
            display: 'flex',
            width: '90%',
            maxWidth: '1000px',
            backgroundImage: `url(${backg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '25px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            {/* LEFT - QUOTE */}
            <div style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              color: '#fff',
              padding: '30px 20px 30px 50px', // shifted quote closer to form
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: 'right',
              textShadow: '2px 2px 6px rgba(0,0,0,0.6)'
            }}>
              <h1 style={{
                fontSize: '2.2rem',
                fontFamily: '"Handlee", cursive',
                color: '#ffd29d',
                marginBottom: '10px',
                textAlign: 'right'
              }}>
                Welcome to CraftyGate
              </h1>
              <p style={{
                fontSize: '1.2rem',
                maxWidth: '90%',
                color: 'rgb(236, 219, 197)',
                margin: '0 auto'
              }}>
                “Dive into a world of creativity — where every post unlocks a new step-by-step craft for you to make and enjoy.”
              </p>
            </div>  

            {/* RIGHT - LOGIN FORM */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '30px',
              backgroundColor: 'rgba(0, 0, 0, 0.4)', // translucent white
            }}>
              <div style={{
                width: '100%',
                maxWidth: '350px',
                padding: '30px',
                backgroundColor: 'rgba(0, 0, 0, 0.58)',
                borderRadius: '15px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                border: '1.5px solid #c8a77f'
              }}>
                <IonAvatar style={{
                  margin: '0 auto 20px',
                  width: '90px',
                  height: '90px',
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
                  marginBottom: '20px',
                  color: 'rgb(248, 216, 176)',
                  fontWeight: 'bold'
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
                  style={{ marginTop: '15px' }}
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
                    marginTop: '25px',
                    color: '#fff'
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
                  style={{ marginTop: '10px', color: 'rgb(202, 160, 108)' }}
                >
                  No account yet? Register here
                </IonButton>
              </div>
            </div>
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