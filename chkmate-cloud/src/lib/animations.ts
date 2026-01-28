import { Variants, Transition } from 'framer-motion';

/**
 * Standard transition presets
 */
export const transitions = {
  /** Quick, snappy transitions */
  fast: { duration: 0.15, ease: 'easeOut' } as Transition,
  /** Default transition speed */
  default: { duration: 0.2, ease: 'easeOut' } as Transition,
  /** Slower, more deliberate transitions */
  slow: { duration: 0.3, ease: 'easeInOut' } as Transition,
  /** Spring animation for bouncy effects */
  spring: { type: 'spring', stiffness: 500, damping: 30 } as Transition,
  /** Gentle spring */
  gentleSpring: { type: 'spring', stiffness: 300, damping: 25 } as Transition,
};

/**
 * Fade in/out animations
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transitions.default },
  exit: { opacity: 0, transition: transitions.fast },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: transitions.default },
  exit: { opacity: 0, y: -10, transition: transitions.fast },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0, transition: transitions.default },
  exit: { opacity: 0, y: 10, transition: transitions.fast },
};

/**
 * Slide animations
 */
export const slideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: transitions.default },
  exit: { opacity: 0, x: -20, transition: transitions.fast },
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: transitions.default },
  exit: { opacity: 0, x: 20, transition: transitions.fast },
};

/**
 * Scale animations
 */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: transitions.default },
  exit: { opacity: 0, scale: 0.95, transition: transitions.fast },
};

export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: transitions.spring },
  exit: { opacity: 0, scale: 0.8, transition: transitions.fast },
};

/**
 * Container variants for staggered children
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

export const staggerContainerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

/**
 * Child variants (used with staggerContainer)
 */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const staggerItemScale: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

/**
 * Page transition variants
 */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2, ease: 'easeIn' }
  },
};

/**
 * Modal/overlay variants
 */
export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.gentleSpring
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: transitions.fast
  },
};

/**
 * Skeleton pulse (for loading states)
 */
export const skeletonPulse: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Progress bar animation
 */
export const progressBar: Variants = {
  initial: { width: 0 },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: { duration: 0.3, ease: 'easeOut' },
  }),
};

/**
 * Loader stages for multi-step processes
 */
export const loaderStages = {
  stage1: { scale: [1, 1.1, 1], transition: { duration: 0.6, repeat: Infinity } },
  stage2: { rotate: 360, transition: { duration: 1, repeat: Infinity, ease: 'linear' } },
  stage3: { opacity: [0.5, 1, 0.5], transition: { duration: 0.8, repeat: Infinity } },
};

/**
 * Notification/toast animation
 */
export const toastVariants: Variants = {
  initial: { opacity: 0, x: 100, scale: 0.9 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: transitions.gentleSpring
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.9,
    transition: transitions.fast
  },
};

/**
 * Card hover effect
 */
export const cardHover: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: transitions.fast
  },
  tap: {
    scale: 0.98
  },
};

/**
 * Button press effect
 */
export const buttonPress: Variants = {
  initial: { scale: 1 },
  tap: { scale: 0.97 },
  hover: { scale: 1.02 },
};
