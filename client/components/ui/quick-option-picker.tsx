"use client";

import { useState, useRef, useEffect, type FC } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { ChevronDown, Globe, Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Option {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface OptionPickerProps {
  options?: Option[];
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
}

const DEFAULT_OPTIONS: Option[] = [
  { id: "private", label: "Private", icon: Lock },
  { id: "public", label: "Public", icon: Globe },
];

export const OptionPicker: FC<OptionPickerProps> = ({ options, value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const data = options || DEFAULT_OPTIONS;
  
  const [internalSelected, setInternalSelected] = useState<Option>(
    data.find(opt => opt.id === value) || data[0]
  );

  const selected = value ? (data.find(opt => opt.id === value) || internalSelected) : internalSelected;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOpen = () => setIsOpen((prev) => !prev);
  const handleSelect = (option: Option) => {
    if (onChange) {
        onChange(option.id);
    } else {
        setInternalSelected(option);
    }
    setIsOpen(false);
  };

  return (
    <div
      className="relative inline-block perspective-[1200px] transform-3d"
      ref={containerRef}
    >
      <MotionConfig
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{
                opacity: 0,
                y: -10,
                filter: "blur(4px)",
                scale: 1.1,
                rotateX: 70,
              }}
              animate={{
                opacity: 1,
                y: 5,
                filter: "blur(0px)",
                scale: 1,
                rotateX: 0,
              }}
              exit={{
                opacity: 0,
                y: -10,
                filter: "blur(4px)",
                scale: 1.1,
                rotateX: 70,
              }}
              className="absolute top-full left-1/2 z-50 mt-2 origin-top -translate-x-1/2 transform-3d"
              role="menu"
              aria-label="Visibility options"
            >
              <div className="relative flex min-w-max gap-2 rounded-full border border-neutral-100 bg-[#F3F3F3] p-1.5 py-1 whitespace-nowrap dark:border-neutral-700 dark:bg-neutral-800">
                {data.map((option, index) => {
                  const isActive = selected.id === option.id;
                  const isFirst = index === 0;
                  const isLast = index === data.length - 1;

                  const roundedClasses = `
                    ${isFirst ? "rounded-l-full rounded-r-2xl" : ""}
                    ${isLast ? "rounded-r-full rounded-l-2xl" : ""}
                    ${!isFirst && !isLast ? "rounded-none" : ""}
                  `;

                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => handleSelect(option)}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ y: -1 }}
                      title={`Set as ${option.label}`}
                      aria-label={`Select ${option.label}`}
                      className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${roundedClasses} bg-primary/10 hover:bg-primary/20 dark:bg-neutral-700 ${
                        isActive
                          ? "text-primary dark:text-white"
                          : "text-muted-foreground dark:text-white/60"
                      }`}
                    >
                      <motion.span>
                        <option.icon size={14} />
                      </motion.span>
                      <span className="font-bold relative z-10 uppercase tracking-widest">
                        {option.label}
                      </span>
                    </motion.button>
                  );
                })}

                <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-neutral-100 bg-[#F3F3F3] dark:border-neutral-700 dark:bg-neutral-800" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          layout="size"
          onClick={toggleOpen}
          whileTap={{ scale: 0.97 }}
          title="Change Layout"
          aria-label={`Layout is currently ${selected.label}. Click to change.`}
          aria-expanded={isOpen}
          className={cn(`flex items-center justify-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 transition-all duration-300 select-none ${
            isOpen
              ? "bg-primary/10 dark:bg-white/15"
              : "bg-muted/50 dark:bg-white/5"
          }`, className)}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              className="flex items-center gap-1.5"
            >
              <selected.icon
                size={16}
                className={`transition-colors duration-300 ${
                  isOpen
                    ? "text-primary/70 dark:text-white/40"
                    : "text-muted-foreground dark:text-white/60"
                }`}
              />
            </motion.div>
          </AnimatePresence>
          <AnimatedText
            value={selected.label}
            className="text-xs uppercase tracking-widest font-bold text-foreground/90 dark:text-white/90"
          />

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="flex items-center"
          >
            <ChevronDown
              size={14}
              className={`transition-colors duration-300 ${
                isOpen
                  ? "text-primary/70 dark:text-white/40"
                  : "text-muted-foreground dark:text-white/60"
              }`}
              strokeWidth={3}
            />
          </motion.div>
        </motion.button>
      </MotionConfig>
    </div>
  );
};

const AnimatedText = ({
  value,
  className,
}: {
  value: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex text-lg tracking-tight will-change-transform",
        className
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {value.split("").map((char, index) => {
          const displayChar = char === " " ? "\u00A0" : char;

          return (
            <motion.span
              key={char + index}
              layout
              initial={{ opacity: 0, y: 5, scale: 0.7 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.03 * index,
                },
              }}
              exit={{ opacity: 0, y: -5, scale: 0.7 }}
            >
              {displayChar}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
