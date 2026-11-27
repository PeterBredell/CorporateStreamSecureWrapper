import type { SVGProps } from "react";

/** ScreenShield logo mark: a shield with a crossed-out eye. Original artwork. */
export function ShieldMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2.2 19 5v6.4c0 4.6-2.9 7.9-7 9.4-4.1-1.5-7-4.8-7-9.4V5l7-2.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7.6 12.2c1.2-1.6 2.7-2.4 4.4-2.4s3.2.8 4.4 2.4c-1.2 1.6-2.7 2.4-4.4 2.4s-3.2-.8-4.4-2.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 16.6 16 7.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
