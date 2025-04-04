import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log('Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '[PRESENT]' : '[MISSING]'
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const registerUser = async (email: string, password: string, userData: any) => {
  try {
    console.log('Starting Firebase registration...');
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('Firebase Auth user created:', user.uid);

    // Store additional user data in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      email: user.email,
      createdAt: new Date(),
    });
    console.log('User data stored in Firestore');

    return user;
  } catch (error) {
    console.error('Firebase registration error:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Login error details:', {
      code: error.code,
      message: error.message
    });
    
    // Handle specific Firebase auth errors
    switch (error.code) {
      case 'auth/invalid-credential':
        throw new Error('Invalid email or password. Please check your credentials.');
      case 'auth/user-not-found':
        throw new Error('No account found with this email. Please register first.');
      case 'auth/wrong-password':
        throw new Error('Incorrect password. Please try again.');
      case 'auth/invalid-email':
        throw new Error('Invalid email format. Please enter a valid email.');
      case 'auth/too-many-requests':
        throw new Error('Too many failed attempts. Please try again later.');
      default:
        throw new Error('Login failed. Please try again.');
    }
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = () => {
  return new Promise<FirebaseUser | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(user);
      } else {
        resolve(null);
      }
    });
  });
};

export const getUserData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.error('User document not found:', userId);
      return null;
    }
    const userData = userDoc.data();
    console.log('User data from Firestore:', userData);
    
    if (!userData.role) {
      console.error('User role not found:', userId);
      return null;
    }
    
    if (!userData.email || !userData.name) {
      console.error('User data incomplete:', userId);
      return null;
    }
    
    return { id: userDoc.id, ...userData };
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}; 