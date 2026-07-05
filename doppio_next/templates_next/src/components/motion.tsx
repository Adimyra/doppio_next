"use client";

/**
 * Reusable animation primitives built on Motion (Framer Motion's
 * successor — `motion` package, `motion/react` entry point).
 *
 * <FadeIn>            fade + slide-up on mount or when scrolled into view
 * <StaggerContainer>  parent that staggers its <StaggerItem> children
 * <StaggerItem>       child of StaggerContainer
 * <HoverLift>         subtle lift + scale on hover (cards, tiles)
 * <AnimatedNumber>    spring count-up for stats
 */

import { useEffect, useRef } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  type HTMLMotionProps,
} from "motion/react";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  y?: number;
  /** Animate when scrolled into view instead of on mount */
  inView?: boolean;
}

export function FadeIn({
  delay = 0,
  y = 12,
  inView = false,
  children,
  ...props
}: FadeInProps) {
  const viewportProps = inView
    ? {
        initial: { opacity: 0, y },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-80px" },
      }
    : {
        initial: { opacity: 0, y },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <motion.div
      {...viewportProps}
      transition={{ duration: 0.5, delay, ease: EASE }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  stagger = 0.08,
  ...props
}: HTMLMotionProps<"div"> & { stagger?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: EASE },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({ children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 24 });
  const rounded = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  return (
    <motion.span ref={ref} className={className}>
      {rounded}
    </motion.span>
  );
}
