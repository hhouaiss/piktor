// Debug utility to check Firebase user data
export function debugUserData(user: any, context: string = 'Unknown') {
  console.log(`[DEBUG ${context}] Current user data:`, {
    id: user?.id,
    email: user?.email,
    displayName: user?.displayName,
    photoURL: user?.photoURL,
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
    usage: user?.usage,
    preferences: user?.preferences
  });
}

export function debugFirebaseUserData(firebaseUser: any, context: string = 'Unknown') {
  console.log(`[DEBUG ${context}] Firebase Auth user data:`, {
    uid: firebaseUser?.uid,
    email: firebaseUser?.email,
    displayName: firebaseUser?.displayName,
    photoURL: firebaseUser?.photoURL,
    emailVerified: firebaseUser?.emailVerified,
    metadata: {
      creationTime: firebaseUser?.metadata?.creationTime,
      lastSignInTime: firebaseUser?.metadata?.lastSignInTime
    }
  });
}