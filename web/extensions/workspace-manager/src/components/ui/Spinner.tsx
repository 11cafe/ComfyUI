// Spinner.tsx
import React from "react";
import ClipLoader from "react-spinners/ClipLoader";

// Define a type for the size prop
type SpinnerSize = "sm" | "md" | "lg";

// Map size variants to Tailwind CSS classes
const sizeClasses: Record<SpinnerSize, number> = {
  sm: 12,
  md: 16,
  lg: 22,
};

interface SpinnerProps {
  size?: SpinnerSize;
}

const Spinner: React.FC<SpinnerProps> = ({ size = "md" }) => {
  const spinnerSize = sizeClasses[size];

  return (
    <div
      className={`flex items-center justify-center min-h-screen ${spinnerSize}`}
    >
      <ClipLoader size={20} loading />
    </div>
  );
};

export default Spinner;

// type SpinnerSize = "sm" | "md" | "lg";
// export default function Spinner({ size = "md" }: { size?: SpinnerSize }) {
//   const sizeNum = size === "sm" ? 3 : size === "md" ? 4 : 6;
//   return (
//     <div className="inline-flex flex-col items-center justify-center gap-3">
//       <div className={`relative size-${sizeNum}`}>
//         <div className="absolute rounded-full border-transparent size-4 border"></div>
//         <svg
//           width="100%"
//           height="100%"
//           fill="none"
//           className="absolute animate-spin stroke-gray-300"
//           xmlns="http://www.w3.org/2000/svg"
//           stroke-width="2.0"
//           viewBox="1 0.25 23 23.5"
//         >
//           <path
//             d="M12.5 23c6.075 0 11-4.925 11-11s-4.925-11-11-11-11 4.925-11 11"
//             stroke-linecap="round"
//           ></path>
//         </svg>
//       </div>
//       <span className="sr-only">Loading...</span>
//     </div>
//   );
// }
