import React, { useState } from 'react';
import {
  IonButton,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonPage,
  IonTitle,
  IonModal,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonAlert,
} from '@ionic/react';
import { supabase } from '../utils/supabaseClient';
import bcrypt from 'bcryptjs';

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

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  const handleOpenVerificationModal = () => {
    if (!email.endsWith("@nbsc.edu.ph")) {
      setAlertMessage("Only @nbsc.edu.ph emails are allowed.");
      setShowAlert(true);
      return;
    }
    if (password !== confirmPassword) {
      setAlertMessage("Passwords do not match.");
      setShowAlert(true);
      return;
    }
    setShowVerificationModal(true);
  };

  const doRegister = async () => {
    setShowVerificationModal(false);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error("Signup failed: " + error.message);

      const hashedPassword = await bcrypt.hash(password, 10);
      const { error: insertError } = await supabase.from("users").insert([
        {
          username,
          user_email: email,
          user_firstname: firstName,
          user_lastname: lastName,
          user_password: hashedPassword,
        },
      ]);
      if (insertError) throw new Error("Database error: " + insertError.message);

      setShowSuccessModal(true);
    } catch (err) {
      setAlertMessage(err instanceof Error ? err.message : "Unknown error");
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen style={{ padding: 0 }}>
        <div style={{
          height: '100vh',
          width: '100%',
          backgroundImage: `url('https://images.wallpaperscraft.com/image/single/branch_bottle_necklace_199652_1280x720.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(6px)',
            zIndex: 0,
          }}></div>

          <div style={{
            position: 'relative',
            zIndex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.81)',
            borderRadius: '25px',
            padding: '20px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.56)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
          }}>
            <h1 style={{
              textAlign: 'center',
              fontSize: '2.3rem',
              fontWeight: 'bold',
              color: '#ffe7ba',
              fontFamily: 'Handlee, cursive',
              textShadow: '1px 1px 3px black',
              marginBottom: '20px',
            }}>
              Create Account
            </h1>

            <IonInput label="Username" labelPlacement="stacked" fill="outline" value={username} onIonChange={e => setUsername(e.detail.value!)} style={{ marginBottom: '12px' }} />
            <IonInput label="First Name" labelPlacement="stacked" fill="outline" value={firstName} onIonChange={e => setFirstName(e.detail.value!)} style={{ marginBottom: '12px' }} />
            <IonInput label="Last Name" labelPlacement="stacked" fill="outline" value={lastName} onIonChange={e => setLastName(e.detail.value!)} style={{ marginBottom: '12px' }} />
            <IonInput label="Email" labelPlacement="stacked" fill="outline" type="email" value={email} onIonChange={e => setEmail(e.detail.value!)} style={{ marginBottom: '12px' }} />
            <IonInput label="Password" labelPlacement="stacked" fill="outline" type="password" value={password} onIonChange={e => setPassword(e.detail.value!)} style={{ marginBottom: '12px' }}>
              <IonInputPasswordToggle slot="end" />
            </IonInput>
            <IonInput label="Confirm Password" labelPlacement="stacked" fill="outline" type="password" value={confirmPassword} onIonChange={e => setConfirmPassword(e.detail.value!)} style={{ marginBottom: '20px' }}>
              <IonInputPasswordToggle slot="end" />
            </IonInput>

            <IonButton expand="full" shape="round" onClick={handleOpenVerificationModal} style={{ marginBottom: '10px' }}>
              Register
            </IonButton>

            <IonButton routerLink="/it35-lab" expand="full" fill="clear" shape="round" style={{ color: '#ffc069' }}>
              Already have an account? Sign in
            </IonButton>
          </div>
        </div>

        {/* Verification Modal */}
        <IonModal isOpen={showVerificationModal} onDidDismiss={() => setShowVerificationModal(false)}>
          <IonContent className="ion-padding">
            <IonCard style={{ marginTop: '25%' }}>
              <IonCardHeader>
                <IonCardTitle>User Registration Details</IonCardTitle>
                <hr />
                <IonCardSubtitle>Username</IonCardSubtitle>
                <IonCardTitle>{username}</IonCardTitle>
                <IonCardSubtitle>Email</IonCardSubtitle>
                <IonCardTitle>{email}</IonCardTitle>
                <IonCardSubtitle>Name</IonCardSubtitle>
                <IonCardTitle>{firstName} {lastName}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent />
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 10px 10px' }}>
                <IonButton fill="clear" onClick={() => setShowVerificationModal(false)}>Cancel</IonButton>
                <IonButton color="primary" onClick={doRegister}>Confirm</IonButton>
              </div>
            </IonCard>
          </IonContent>
        </IonModal>

        {/* Success Modal */}
        <IonModal isOpen={showSuccessModal} onDidDismiss={() => setShowSuccessModal(false)}>
          <IonContent className="ion-padding" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <IonTitle style={{ marginTop: '20%' }}>🎉 Registration Successful</IonTitle>
            <IonText>
              <p>Your account has been created. Please check your email for confirmation.</p>
            </IonText>
            <IonButton routerLink="/it35-lab" routerDirection="back">Go to Login</IonButton>
          </IonContent>
        </IonModal>

        <AlertBox message={alertMessage} isOpen={showAlert} onClose={() => setShowAlert(false)} />
      </IonContent>
    </IonPage>
  );
};

export default Register;
