import { useRouter } from "next/navigation";
import PropTypes from "prop-types";

export default function BackButton({ targetPage }) {
  const router = useRouter();

  const handleNavigation = () => {
    if (targetPage) {
      router.push(targetPage); // Navigate to specified page
    } else {
      router.back(); // Go back to the previous page
    }
  };

  return (
    <button
      onClick={handleNavigation}
      className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow hover:bg-gray-200"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-black hover:text-gray-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>
  );
}

BackButton.propTypes = {
  targetPage: PropTypes.string, // Optional, specify the page to navigate to
};
