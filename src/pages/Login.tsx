
import { 
  IonButton,
  IonButtons,
    IonContent, 
    IonHeader, 
    IonMenuButton, 
    IonPage, 
    IonTitle, 
    IonToolbar ,
    IonInput, IonItem, IonList,
    useIonRouter,
    IonInputPasswordToggle,
    IonIcon
} from '@ionic/react';
import { logoIonic } from 'ionicons/icons';

const Login: React.FC = () => {
  const navigation = useIonRouter();

  const doLogin = () => {
      navigation.push('/it35-lab/app','forward','replace');
    };

    const goToRegister = () => {
      navigation.push('/register'); //  Navigate to Register
    };

  
  return (
    <IonPage>
      
      <IonHeader>
        <IonToolbar>
          <IonTitle >Login</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonItem>
      <IonInput label="Email" labelPlacement="floating" placeholder="Enter email"></IonInput>
      </IonItem>

      <IonItem>
        <IonInput label="Password" labelPlacement="floating" placeholder="Enter password">   
        <IonInputPasswordToggle slot="end"></IonInputPasswordToggle> 
        </IonInput>
      </IonItem>

      <IonContent className= 'ion-padding'>
          <IonButton onClick={() => doLogin()} expand="full">
              Login
          </IonButton>

          <IonButton onClick={() => goToRegister()} expand="full">
              Sign up
          </IonButton>
          
  
      </IonContent>
    </IonPage>
  );
};

export default Login;