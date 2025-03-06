
import { 
    IonButton,
    IonButtons,
      IonContent, 
      IonHeader, 
      IonMenuButton, 
      IonPage, 
      IonTitle, 
      IonToolbar ,
      IonInput, IonItem, IonList, IonInputPasswordToggle,
      useIonRouter
  } from '@ionic/react';
  
  const Login: React.FC = () => {
    const navigation = useIonRouter();

    const doLogin = () => {
        navigation.push('/it35-lab/app','forward','replace');

    }
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Login</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonItem>
          <IonInput label="Email" type="email" placeholder=""></IonInput>
        </IonItem>

        <IonItem>
          <IonInput label="Password" type="password" value=""></IonInput>
        </IonItem>

        <IonContent className= 'ion-padding'>
            <IonButton onClick={() => doLogin()} expand="full">
                Login
            </IonButton>
            
    
        </IonContent>
      </IonPage>
    );
  };
  
  export default Login;