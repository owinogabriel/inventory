import Pagination from "@/components/pagination";
import Sidebar from "@/components/sidebar";
import { deleteProduct } from "@/lib/actions/products"; // Server action to delete a product. This is imported from the lib folder.
import { getCurrentUser } from "@/lib/auth"; // Utility to fetch the currently authenticated user details.
import { prisma } from "@/lib/prisma"; // The Prisma client instance for database access.

/**TOD0:
 *1. AUTHENTICATION & INITIAL SETUP
 *2. PARSE SEARCH & PAGINATION PARAMETERS
 *3. DATABASE QUERY CONSTRUCTION
 *4. CONCURRENT DATA FETCHING
 *5. RENDER THE COMPONENT UI
 **/

// It fetches data directly on the server before rendering.
export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  // Fetch the current user to ensure only their products are displayed.
  const user = await getCurrentUser();
  const userId = user.id;

  // Await the searchParams promise to get the query and page number.
  const params = await searchParams;
  const q = (params.q ?? "").trim(); // Get the search query 'q', default to an empty string, and trim whitespace.
  const page = Math.max(1, Number(params.page ?? 1)); // Get the current page number, ensuring it's at least 1.
  // Define the number of items to show per page.
  const pageSize = 5;

  // Build the 'where' clause for the Prisma query.
  const where = {
    // Only fetch products belonging to the current user.
    userId,
    // Conditionally add the search filter if 'q' is not empty.
    ...(q
      ? {
          // Search product 'name' containing the query string (case-insensitive).
          name: { contains: q, mode: "insensitive" as const },
        }
      : {}),
  };

  // Use Promise.all to fetch the total count and the actual items concurrently
  // to speed up data loading (a common Server Component optimization).
  const [totalCount, items] = await Promise.all([
    // Get the total number of products matching the filter for pagination.
    prisma.product.count({ where }),
    // Fetch the paginated products.
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      // Skip logic: (current page - 1) * pageSize
      skip: (page - 1) * pageSize,
      // Take logic: limit the results to the page size.
      take: pageSize,
    }),
  ]);

  // Calculate the total number of pages required.
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar component for navigation. Highlights the current path. */}
      <Sidebar currentPath="/inventory" />

      {/* Main content area. 'ml-64' creates space for the sidebar. */}
      <main className="ml-64 p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Inventory
              </h1>
              <p className="text-sm text-gray-500">
                Manage your products and track inventory levels.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Search Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Form is a standard HTML GET form. 
                Submitting it reloads the page with 'q' as a search parameter. */}
            <form className="flex gap-2" action="/inventory" method="GET">
              <input
                name="q" // The input name must be 'q' to be picked up by searchParams.
                placeholder="Search products..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-transparent"
              />
              <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Search
              </button>
            </form>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              {/* Table Header */}
              <thead className="bg-gray-50">
                <tr>
                  {/* All standard table headers */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Low Stock At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions {/* Header for the Delete button */}
                  </th>
                </tr>
              </thead>

              {/* Table Body - Renders product rows */}
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Map over the fetched 'items' array. */}
                {items.map((product) => (
                  // Using 'product.id' is preferable for the key, but 'key'
                  // here is used as a stand-in for a temporary unique identifier.
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.name}
                    </td>
                    <td className="px-6 py-4  text-sm text-gray-500">
                      {product.sku || "-"}
                    </td>
                    <td className="px-6 py-4  text-sm text-gray-900">
                      {/* Format price to two decimal places */}$
                      {Number(product.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4  text-sm text-gray-900">
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4  text-sm text-gray-500">
                      {product.lowStockAt || "-"}
                    </td>
                    {/* Actions Column */}
                    <td className="px-6 py-4  text-sm text-gray-500">
                      {/* Server Action Form: Calls deleteProduct when submitted. */}
                      <form action={deleteProduct}>
                        {/* Hidden field passes the product ID to the server action. */}
                        <input type="hidden" name="id" value={product.id} />
                        <button className="text-red-600 hover:text-red-900">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Component */}
          {/* Only render pagination controls if there is more than one page. */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                baseUrl="/inventory"
                // Pass current search parameters to the Pagination component
                // so they are preserved when the page number changes.
                searchParams={{
                  q,
                  pageSize: String(pageSize),
                }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
