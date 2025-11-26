import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Guest utilities
export function getOrCreateGuestId(): string {
  let guestId = localStorage.getItem('blog_guest_id');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).slice(2, 11);
    localStorage.setItem('blog_guest_id', guestId);
  }
  return guestId;
}

export function getOrAskGuestName(): string {
  let guestName = localStorage.getItem('blog_guest_name');
  if (!guestName) {
    // Prompt the user for a name once
    try {
      guestName = prompt("What's your name? (you can change this later)") || 'Anonymous';
    } catch (e) {
      guestName = 'Anonymous';
    }
    localStorage.setItem('blog_guest_name', guestName);
  }
  return guestName;
}
