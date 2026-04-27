export const getServerSession = async (...args: any[]) => {
  return { 
    user: { 
      id: "1", 
      email: "mock@firebase-transition.com",
      name: "Firebase Transition User" 
    } 
  };
};

export const authOptions = {};
