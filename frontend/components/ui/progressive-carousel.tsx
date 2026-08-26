"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type FC,
} from "react";
// Snippet zakładał pakiet `motion/react`; u nas zainstalowany jest `framer-motion`
// (to samo API: motion, AnimatePresence) — importujemy z niego, bez nowej zależności.
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressSliderContextType {
  active: string;
  progress: number;
  handleButtonClick: (value: string) => void;
  vertical: boolean;
}

interface ProgressSliderProps {
  children: ReactNode;
  duration?: number;
  fastDuration?: number;
  vertical?: boolean;
  activeSlider: string;
  className?: string;
}

interface SliderContentProps {
  children: ReactNode;
  className?: string;
}

interface SliderWrapperProps {
  children: ReactNode;
  value: string;
  className?: string;
}

interface ProgressBarProps {
  children: ReactNode;
  className?: string;
}

interface SliderBtnProps {
  children: ReactNode;
  value: string;
  className?: string;
  progressBarClass?: string;
}

const ProgressSliderContext = createContext<ProgressSliderContextType | undefined>(
  undefined,
);

export const useProgressSliderContext = (): ProgressSliderContextType => {
  const context = useContext(ProgressSliderContext);
  if (!context) {
    throw new Error("useProgressSliderContext must be used within a ProgressSlider");
  }
  return context;
};

export const ProgressSlider: FC<ProgressSliderProps> = ({
  children,
  duration = 5000,
  fastDuration = 400,
  vertical = false,
  activeSlider,
  className,
}) => {
  const [active, setActive] = useState<string>(activeSlider);
  const [progress, setProgress] = useState<number>(0);
  const [isFastForward, setIsFastForward] = useState<boolean>(false);
  const frame = useRef<number>(0);
  const firstFrameTime = useRef<number>(0);
  const targetValue = useRef<string | null>(null);
  const progressRef = useRef<number>(0);
  // „Najświeższe" wartości dla pętli rAF — dzięki temu efekt nie restartuje się
  // przy każdej zmianie slajdu (pętla czyta refy zamiast stanu z zależności).
  const activeRef = useRef<string>(active);
  const fastRef = useRef<boolean>(isFastForward);
  useEffect(() => {
    activeRef.current = active;
    fastRef.current = isFastForward;
  }, [active, isFastForward]);

  // Wartości slajdów = `value` każdego SliderWrapper w SliderContent (z dzieci).
  const sliderValues = useMemo(() => {
    const content = React.Children.toArray(children).find(
      (child): child is React.ReactElement<SliderContentProps> =>
        React.isValidElement(child) && child.type === SliderContent,
    );
    if (!content) return [] as string[];
    return React.Children.toArray(content.props.children)
      .filter((child): child is React.ReactElement<SliderWrapperProps> =>
        React.isValidElement(child),
      )
      .map((child) => child.props.value)
      .filter((v): v is string => typeof v === "string");
  }, [children]);

  useEffect(() => {
    if (sliderValues.length === 0) return;
    firstFrameTime.current = performance.now();

    // Pętla postępu: normalnie liniowo do 100% i skok do kolejnego slajdu; po
    // kliknięciu („fast-forward") szybko dobija do 100% i przełącza na wybrany.
    const animate = (now: number) => {
      const currentDuration = fastRef.current ? fastDuration : duration;
      const timeFraction = (now - firstFrameTime.current) / currentDuration;
      if (timeFraction <= 1) {
        const p = fastRef.current
          ? progressRef.current + (100 - progressRef.current) * timeFraction
          : timeFraction * 100;
        progressRef.current = p;
        setProgress(p);
      } else {
        if (fastRef.current) {
          setIsFastForward(false);
          if (targetValue.current !== null) {
            setActive(targetValue.current);
            targetValue.current = null;
          }
        } else {
          const idx = sliderValues.indexOf(activeRef.current);
          const next = sliderValues[(idx + 1) % sliderValues.length];
          if (next) setActive(next);
        }
        progressRef.current = 0;
        setProgress(0);
        firstFrameTime.current = performance.now();
      }
      frame.current = requestAnimationFrame(animate);
    };

    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current);
  }, [sliderValues, duration, fastDuration]);

  const handleButtonClick = (value: string) => {
    if (value !== active) {
      const elapsedTime = performance.now() - firstFrameTime.current;
      const currentProgress = (elapsedTime / duration) * 100;
      progressRef.current = currentProgress;
      setProgress(currentProgress);
      targetValue.current = value;
      setIsFastForward(true);
      firstFrameTime.current = performance.now();
    }
  };

  return (
    <ProgressSliderContext.Provider value={{ active, progress, handleButtonClick, vertical }}>
      <div className={cn("relative", className)}>{children}</div>
    </ProgressSliderContext.Provider>
  );
};

export const SliderContent: FC<SliderContentProps> = ({ children, className }) => {
  return <div className={cn("", className)}>{children}</div>;
};

export const SliderWrapper: FC<SliderWrapperProps> = ({ children, value, className }) => {
  const { active } = useProgressSliderContext();

  return (
    <AnimatePresence mode="popLayout">
      {active === value && (
        <motion.div
          key={value}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn("", className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const SliderBtnGroup: FC<ProgressBarProps> = ({ children, className }) => {
  return <div className={cn("", className)}>{children}</div>;
};

export const SliderBtn: FC<SliderBtnProps> = ({
  children,
  value,
  className,
  progressBarClass,
}) => {
  const { active, progress, handleButtonClick, vertical } = useProgressSliderContext();

  return (
    <button
      className={cn("relative", active === value ? "opacity-100" : "opacity-50", className)}
      onClick={() => handleButtonClick(value)}
    >
      {children}
      <div
        className="absolute inset-0 -z-10 max-h-full max-w-full overflow-hidden"
        role="progressbar"
        aria-valuenow={active === value ? progress : 0}
      >
        <span
          className={cn("absolute left-0", progressBarClass)}
          style={
            {
              [vertical ? "height" : "width"]: active === value ? `${progress}%` : "0%",
            } as React.CSSProperties
          }
        />
      </div>
    </button>
  );
};
