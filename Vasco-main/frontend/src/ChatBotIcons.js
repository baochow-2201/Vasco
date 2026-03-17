// ChatBotIcons.js - Pure SVG Icons for ChatBot

export const ChatBubbleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
    <path d="M2 12c0-5.5 3-10 10-10s10 4.5 10 10-3 10-10 10l-6 3 2-4C4 20 2 17 2 12z" />
    <circle cx="7" cy="12" r="1.2" fill="white" />
    <circle cx="12" cy="12" r="1.2" fill="white" />
    <circle cx="17" cy="12" r="1.2" fill="white" />
  </svg>
);

export const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 21l19-9L2 3v7l15 2-15 2v7z" />
  </svg>
);

export const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="8" y1="8" x2="16" y2="16" />
    <line x1="16" y1="8" x2="8" y2="16" />
  </svg>
);

export const BotIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="2" width="16" height="16" rx="2" />
    <rect x="6" y="4" width="3" height="3" rx="0.5" fill="currentColor" />
    <rect x="15" y="4" width="3" height="3" rx="0.5" fill="currentColor" />
    <circle cx="12" cy="13" r="2" fill="currentColor" />
    <path d="M7 20 Q12 22 17 20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
);

export const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="8" r="4" />
    <path d="M3 18c0-2 3-4 9-4s9 2 9 4v2H3v-2z" />
  </svg>
);

export const MinimizeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 12h6M15 12h6M12 3v6M12 15v6" />
  </svg>
);

export const ChatAnimated = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5" style={{animation: 'pulse 2s infinite'}}>
    <path d="M2 12c0-5.5 3-10 10-10s10 4.5 10 10-3 10-10 10l-6 3 2-4C4 20 2 17 2 12z" />
    <circle cx="7" cy="12" r="1.2" fill="white" style={{animation: 'bounce 1s infinite'}}/>
    <circle cx="12" cy="12" r="1.2" fill="white" style={{animation: 'bounce 1s infinite 0.2s'}}/>
    <circle cx="17" cy="12" r="1.2" fill="white" style={{animation: 'bounce 1s infinite 0.4s'}}/>
  </svg>
);
