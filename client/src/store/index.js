import { create } from "zustand";

import { createAuthSlice } from "../slices/auth-slice";
import { createChatSlice } from "../slices/chat-slice";

export const useAppStore = create(
  (...args) => ({
    ...createAuthSlice(...args),
    ...createChatSlice(...args),
  }),
);