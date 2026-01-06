import { motion, AnimatePresence, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

// Page transition variants
const pageVariants: Variants = {
    initial: {
        opacity: 0,
        y: 20,
        scale: 0.98,
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.3,
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.98,
        transition: {
            duration: 0.2,
            ease: 'easeIn',
        },
    },
};

// Modal/Popup transition variants
export const modalVariants: Variants = {
    initial: {
        opacity: 0,
        scale: 0.9,
        y: 20,
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.25,
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: 20,
        transition: {
            duration: 0.2,
        },
    },
};

// Slide in from right (for drawers/sidebars)
export const slideInRight: Variants = {
    initial: { x: '100%', opacity: 0 },
    animate: { 
        x: 0, 
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: { 
        x: '100%', 
        opacity: 0,
        transition: { duration: 0.2 }
    },
};

// Slide in from bottom (for mobile sheets)
export const slideInBottom: Variants = {
    initial: { y: '100%', opacity: 0 },
    animate: { 
        y: 0, 
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: { 
        y: '100%', 
        opacity: 0,
        transition: { duration: 0.2 }
    },
};

// Fade in with scale (for cards/items)
export const fadeInScale: Variants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { 
        opacity: 1, 
        scale: 1,
        transition: { duration: 0.2, ease: 'easeOut' }
    },
    exit: { 
        opacity: 0, 
        scale: 0.95,
        transition: { duration: 0.15 }
    },
};

// Staggered children animation
export const staggerContainer: Variants = {
    animate: {
        transition: {
            staggerChildren: 0.05,
        },
    },
};

export const staggerItem: Variants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.2 }
    },
};

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Wrapper for AnimatePresence with page transitions
export function AnimatedRoutes({ children }: { children: ReactNode }) {
    return (
        <AnimatePresence mode="wait">
            {children}
        </AnimatePresence>
    );
}
