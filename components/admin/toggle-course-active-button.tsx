"use client";

import { useState, useTransition } from "react";
import { toggleCourseActiveAction } from "@/app/actions/course-actions";

type Props = {
  courseId: string;
  initialActive: boolean;
};

export function ToggleCourseActiveButton({ courseId, initialActive }: Props) {
  const [active, setActive] = useState(initialActive);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleCourseActiveAction(courseId);
      if (res.success) setActive(res.active);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      title={active ? "Desactivar curso" : "Activar curso"}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 ${
        active ? "bg-green-500" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
          active ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
