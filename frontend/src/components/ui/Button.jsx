import React from "react";
import classNames from "classnames";

export default function Button({
  variant = "primary",
  className,
  ...props
}) {
  const cn = classNames(
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
    variant === "primary" && "bg-slate-900 text-white hover:bg-slate-800",
    variant === "secondary" && "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50",
    variant === "danger" && "bg-red-600 text-white hover:bg-red-500",
    className
  );
  return <button className={cn} {...props} />;
}

