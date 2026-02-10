"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs = ({
  defaultValue,
  value,
  onValueChange,
  className,
  ...props
}: TabsProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");

  const currentValue = value ?? internalValue;

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (value === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [onValueChange, value],
  );

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue }}>
      <div className={cn("w-full", className)} {...props} />
    </TabsContext.Provider>
  );
};

export const TabsList = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "inline-flex items-center justify-center rounded-lg bg-slate-100 p-1",
      className,
    )}
    {...props}
  />
);

export const TabsTrigger = ({
  className,
  value,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) => {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error("TabsTrigger must be used within Tabs");
  }

  const isActive = context.value === value;

  return (
    <button
      type="button"
      onClick={() => context.setValue(value)}
      className={cn(
        "rounded-md px-4 py-2 text-sm font-semibold text-slate-600 transition",
        isActive && "bg-white text-slate-900 shadow",
        className,
      )}
      {...props}
    />
  );
};

export const TabsContent = ({
  className,
  value,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) => {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error("TabsContent must be used within Tabs");
  }

  if (context.value !== value) {
    return null;
  }

  return <div className={cn("mt-4", className)} {...props} />;
};
