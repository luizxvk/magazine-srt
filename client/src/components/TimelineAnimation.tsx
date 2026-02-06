import React, { useRef, forwardRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { Variants, HTMLMotionProps } from 'framer-motion';

/**
 * TimelineAnimation - Animates elements when they enter the viewport
 * Each element can have a staggered animation delay based on animationNum
 */

interface TimelineAnimationProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
    /** Element type to render */
    as?: 'div' | 'article' | 'section' | 'header' | 'main' | 'aside' | 'a';
    /** Animation index for staggered delay (0.1s per index) */
    animationNum?: number;
    /** Ref to the timeline container (for viewport intersection) */
    timelineRef?: React.RefObject<HTMLElement | null>;
    /** Custom animation variants */
    customVariants?: Variants;
    /** Children to animate */
    children: React.ReactNode;
    /** Additional className */
    className?: string;
}

// Default reveal variants with blur and slide up effect
const defaultRevealVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 30,
        filter: 'blur(10px)',
    },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            delay: i * 0.08,
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1],
        },
    }),
};

// Simple fade in from below variant (for feed items)
const feedItemVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
    },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: Math.min(i * 0.05, 0.3), // Cap delay at 0.3s
            duration: 0.4,
            ease: 'easeOut',
        },
    }),
};

export const TimelineAnimation = forwardRef<HTMLDivElement, TimelineAnimationProps>(
    (
        {
            as = 'div',
            animationNum = 0,
            timelineRef,
            customVariants,
            children,
            className = '',
            ...props
        },
        ref
    ) => {
        const internalRef = useRef<HTMLDivElement>(null);
        const elementRef = ref || internalRef;
        
        // Use the timelineRef or the element itself for viewport detection
        const isInView = useInView(elementRef as React.RefObject<HTMLElement>, {
            once: true,
            margin: '-50px 0px',
        });

        const variants = customVariants || defaultRevealVariants;
        const MotionComponent = motion[as] as typeof motion.div;

        return (
            <MotionComponent
                ref={elementRef}
                className={className}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                custom={animationNum}
                variants={variants}
                {...props}
            >
                {children}
            </MotionComponent>
        );
    }
);

TimelineAnimation.displayName = 'TimelineAnimation';

// Export variants for customization
export { defaultRevealVariants, feedItemVariants };

// Wrapper component for staggered children animations
interface TimelineContainerProps {
    children: React.ReactNode;
    className?: string;
    staggerDelay?: number;
}

export const TimelineContainer: React.FC<TimelineContainerProps> = ({
    children,
    className = '',
    staggerDelay = 0.1,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: '-50px 0px' });

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: staggerDelay,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20, filter: 'blur(5px)' },
        visible: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: { duration: 0.4, ease: 'easeOut' },
        },
    };

    return (
        <motion.div
            ref={containerRef}
            className={className}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={containerVariants}
        >
            {React.Children.map(children, (child) => {
                if (!React.isValidElement(child)) return child;
                return (
                    <motion.div variants={itemVariants}>
                        {child}
                    </motion.div>
                );
            })}
        </motion.div>
    );
};

export default TimelineAnimation;
