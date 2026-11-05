"use client";

import { Input } from "@/components/ui/input";
import { COMMON_UNITS } from "@/utils/freight-management/constants";
import {
  ListPlacement,
  measurePlacement,
} from "@/utils/freight-management/helper";
import { cn } from "cn";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function UnitSelect({
  id,
  value,
  onChange,
  options = COMMON_UNITS,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<ListPlacement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const openList = () => {
    if (containerRef.current) {
      setPlacement(measurePlacement(containerRef.current));
    }
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    // The list lives outside containerRef (it's portaled), so check both.
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    let frame = 0;
    const reposition = (event?: Event) => {
      // Scrolling the list itself shouldn't move it.
      if (
        event?.target instanceof Node &&
        listRef.current?.contains(event.target)
      ) {
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (containerRef.current) {
          setPlacement(measurePlacement(containerRef.current));
        }
      });
    };

    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      cancelAnimationFrame(frame);
    };
  }, [isOpen]);

  const filteredOptions = options.filter(
    (opt) =>
      !value.trim() || opt.toLowerCase().includes(value.trim().toLowerCase()),
  );
  const displayOptions = filteredOptions.length > 0 ? filteredOptions : options;

  const list = isOpen && placement && (
    <div
      ref={listRef}
      id={`${id}-list`}
      role="listbox"
      style={
        placement.host
          ? {
              left: placement.left,
              top: placement.top,
              width: placement.width,
              maxHeight: placement.maxHeight,
              transform: placement.openUp ? "translateY(-100%)" : undefined,
            }
          : { maxHeight: placement.maxHeight }
      }
      className={cn(
        "z-100 overflow-y-auto overscroll-contain border border-border bg-popover p-1 text-popover-foreground shadow-lg",
        placement.host
          ? "absolute"
          : cn(
              "absolute left-0 w-full",
              placement.openUp ? "bottom-full mb-1" : "top-full mt-1",
            ),
      )}
    >
      <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        Existing choices
      </div>
      {displayOptions.map((u) => {
        const isSelected = value.trim().toUpperCase() === u.toUpperCase();
        return (
          <button
            key={u}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => {
              onChange(u);
              setIsOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground",
              isSelected && "bg-accent/60 font-semibold text-primary",
            )}
          >
            <span>{u}</span>
            {isSelected && <Check className="size-3.5 text-primary" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Input
          id={id}
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            openList();
          }}
          onFocus={openList}
          onKeyDown={(e) => {
            if (e.key === "Escape" && isOpen) {
              e.stopPropagation();
              setIsOpen(false);
            }
          }}
          placeholder="e.g. CONTAINER"
          className="h-10 w-full pr-8 text-sm uppercase"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${id}-list`}
        />
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              return;
            }
            openList();
            // Don't let focusing the input scroll the dialog.
            inputRef.current?.focus({ preventScroll: true });
          }}
          tabIndex={-1}
          className="absolute right-1 flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
          title="Toggle list"
          aria-label="Toggle list"
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-150",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {list && placement?.host ? createPortal(list, placement.host) : list}
    </div>
  );
}
