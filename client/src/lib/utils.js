import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import animationData from "../assets/lottie-json.json"; 

export function cn(...inputs) {
  return twMerge(clsx(inputs));
} 

// array of class strings
export const colors = [
  "bg-[#712c4a57] text-[#ff006e] border-[1px] border-[#ffd006faa]",
  "bg-[#ffd6802a] text-[#ffd60a] border-[1px] border-[#ffd60abb]",
  "bg-[#86d6a83a] text-[#86d6a8] border-[1px] border-[#06d6a0bb]",
  "bg-[#4cc9f02a] text-[#4cc9f0] border-[1px] border-[#4cc9fabb]"
];

export const getColor = (color) => {
  if (color >= 0 && color < colors.length) {
    return colors[color];
  }
  return colors[0]; // default
};


export const animationDefaultOptions = {
  loading: {
    loop: true,
    autoplay: true, 
    animationData,
    // path: "/animations/loading.json"
  },
  // success: {
  //   loop: false,
  //   autoplay: true,
  //   path: "/animations/success.json"
  // },
  // error: {
  //   loop: false,
  //   autoplay: true,
  //   path: "/animations/error.json"
  // }
};