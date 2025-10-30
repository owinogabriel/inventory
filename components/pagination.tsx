import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

// Define the expected properties (props) for the Pagination component.
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams: Record<string, string>;
}

// Pagination component.
export default function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams,
}: PaginationProps) {
  // Guard Clause: If there's only one page or fewer, hide the pagination control.
  if (totalPages <= 1) return null;

  // Helper function to construct the full URL for any given page number.
  const getPageUrl = (page: number) => {
    // 1. Create a new URLSearchParams object, starting with existing searchParams.
    // 2. Override or add the 'page' parameter with the new page number.
    const params = new URLSearchParams({ ...searchParams, page: String(page) });
    // 3. Return the base URL combined with the serialized query string.
    return `${baseUrl}?${params.toString()}`;
  };

  // Logic to determine which page numbers (and '...') should be displayed.
  // This prevents clutter by only showing pages around the current page, plus the first and last.
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of the current page.
    const range = [];
    const rangeWithDots = [];

    // 1. Determine the core range of pages around the currentPage.
    for (
      // Start: Max of 2 (to skip page 1) or currentPage - delta.
      let i = Math.max(2, currentPage - delta);
      // End: Min of totalPages - 1 (to skip the last page) or currentPage + delta.
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    // 2. Add the first page (always 1) and the leading ellipsis.
    if (currentPage - delta > 2) {
      // If there's a large gap between page 1 and the visible range, add '...'.
      rangeWithDots.push(1, "...");
    } else {
      // Otherwise, just show page 1.
      rangeWithDots.push(1);
    }

    // 3. Insert the core range of pages.
    rangeWithDots.push(...range);

    // 4. Add the trailing ellipsis and the last page.
    if (currentPage + delta < totalPages - 1) {
      // If there's a large gap between the visible range and the last page, add '...'.
      rangeWithDots.push("...", totalPages);
    } else {
      // Otherwise, just ensure the last page is included (it was excluded in the loop above).
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  //  RENDER THE PAGINATION UI
  return (
    <nav className="flex items-center justify-center gap-1">
      {/* --- Previous Button --- */}
      <Link
        href={getPageUrl(currentPage - 1)}
        className={`flex items-center px-3 py-2 text-sm font-meium rounded-lg ${
          currentPage <= 1
            ? "text-gray-400 cursor-not-allowed bg-gray-100"
            : "text-gray-700 hover:bg-gray-100 bg-white border border-gray-300"
        }`}
        // Accessibility attribute to indicate if the link is non-functional.
        aria-disabled={currentPage <= 1}
      >
        <ChevronLeft /> Prevous
      </Link>

      {/* --- Page Numbers and Ellipsis --- */}
      {visiblePages.map((page, key) => {
        // If the item is the string '...', render it as plain text.
        if (page === "...") {
          return (
            <span key={key} className="px-3 py-2 text-sm text-gray-500">
              ...
            </span>
          );
        }

        const pageNumber = page as number;
        const isCurrentPage = pageNumber === currentPage;

        // Render the page number button as a Link.
        return (
          <Link
            key={key}
            href={getPageUrl(pageNumber)}
            className={`px-3 py-2 text-sm font-medium rounded-lg ${
              isCurrentPage
                ? "bg-purple-600 text-white"
                : "text-gray-700 hover:bg-gray-100 bg-white border border-gray-300"
            }`}
          >
            {pageNumber}
          </Link>
        );
      })}

      {/* --- Next Button --- */}
      <Link
        href={getPageUrl(currentPage + 1)}
        className={`flex items-center px-3 py-2 text-sm font-meium rounded-lg ${
          // Styling condition for disabled state (last page or more).
          currentPage >= totalPages
            ? "text-gray-400 cursor-not-allowed bg-gray-100"
            : "text-gray-700 hover:bg-gray-100 bg-white border border-gray-300"
        }`}
        aria-disabled={currentPage >= totalPages}
      >
        Next
        <ChevronRight />
      </Link>
    </nav>
  );
}
