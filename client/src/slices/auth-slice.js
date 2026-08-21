export const createAuthSlice = (set) => ({
  // user: null,   // initial state
  userInfo: undefined,
  setUserInfo: (userInfo) => set({ userInfo }),
  // setUser: (userInfo) => set({ user: userInfo }),
  // clearUser: () => set({ user: null }),
});
