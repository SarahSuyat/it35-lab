import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonRouter,
  IonToast, // Import IonToast
} from "@ionic/react";
import { useState } from "react";

const Register: React.FC = () => {
  const navigation = useIonRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showToast, setShowToast] = useState(false); // State to control the toast visibility

  const doRegister = () => {
    // Basic validation for password match
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // Show the toast after successful registration
    setShowToast(true);

    // Log the user information (you can replace this with actual registration logic)
    console.log("Register button clicked");
    console.log("Username:", username);
    console.log("Email:", email);
    console.log("Password:", password);

    // After successful registration, navigate to the login page (or home page)
    setTimeout(() => {
      navigation.push("/login", "forward", "replace"); // Navigate to login page
    }, 2000); // 2-second delay to show the toast
  };

  const navigateToLogin = () => {
    navigation.push("/login"); // Navigate back to Login page
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Username</IonLabel>
          <IonInput
            value={username}
            onIonChange={(e) => setUsername(e.detail.value!)}
            placeholder="Enter username"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Email</IonLabel>
          <IonInput
            value={email}
            onIonChange={(e) => setEmail(e.detail.value!)}
            placeholder="Enter email"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Password</IonLabel>
          <IonInput
            type="password"
            value={password}
            onIonChange={(e) => setPassword(e.detail.value!)}
            placeholder="Enter password"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Confirm Password</IonLabel>
          <IonInput
            type="password"
            value={confirmPassword}
            onIonChange={(e) => setConfirmPassword(e.detail.value!)}
            placeholder="Confirm your password"
          />
        </IonItem>

        <IonButton onClick={doRegister} expand="full">
          Register
        </IonButton>

        {/* IonToast component to show the success message */}
        <IonToast
          isOpen={showToast}
          message="Account Created Successfully!"
          duration={2000} // Show for 2 seconds
          onDidDismiss={() => setShowToast(false)} // Hide toast after it is dismissed
        />

        {/* Button to navigate to Login page */}
        <IonButton onClick={navigateToLogin} expand="full" color="secondary">
          Already have an account? Login
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Register;