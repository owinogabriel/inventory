import ProductsChart from "@/components/product-chart";
import Sidebar from "@/components/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrendingUp } from "lucide-react";

/**
 * *TODO:
 * 1. AUTHENTICATION
 * 2. CONCURRENT DATA FETCHING (Performance Optimization)
 * 3. TOTAL INVENTORY CALCULATIONS
 *
 * **/

// This is an async Server Component, responsible for fetching and presenting data.
export default async function DashboardPage() {
  // 1. AUTHENTICATION
  const user = await getCurrentUser();
  const userId = user.id;

  // 2. CONCURRENT DATA FETCHING (Performance Optimization)
  // Use Promise.all to fetch three key database metrics simultaneously.
  const [totalProducts, lowStock, allProducts] = await Promise.all([
    // Count 1: Total number of products owned by the user.
    prisma.product.count({ where: { userId } }),
    // Count 2: Total number of products meeting the 'low stock' criteria (quantity <= 5).
    prisma.product.count({
      where: {
        userId,
        lowStockAt: { not: null }, // Only count if a lowStock threshold is set (optional logic).
        quantity: { lte: 5 }, // Less than or equal to 5 units remaining.
      },
    }),
    // Data Set: Fetch all products needed for subsequent complex JS calculations (value, percentages, charts).
    prisma.product.findMany({
      where: { userId },
      // Only select necessary fields to keep the payload small.
      select: {
        price: true,
        quantity: true,
        createdAt: true,
        name: true, // <-- FIX: Added this for use in the 'Recent Stock Levels' section
        lowStockAt: true, // <-- FIX: Added this for use in the 'Recent Stock Levels' section
        id: true,
      },
    }),
  ]);

  // 3. JAVASCRIPT CALCULATIONS

  // Calculate the total inventory value: SUM(price * quantity)
  const totalValue = allProducts.reduce(
    (sum, product) => sum + Number(product.price) * Number(product.quantity),
    0
  );

  // --- Stock Level Breakdown (Based on quantity <= 5 logic) ---
  const inStockCount = allProducts.filter((p) => Number(p.quantity) > 5).length;
  const lowStockCount = allProducts.filter(
    (p) => Number(p.quantity) <= 5 && Number(p.quantity) >= 1
  ).length;
  const outOfStockCount = allProducts.filter(
    (p) => Number(p.quantity) === 0
  ).length;

  // Calculate percentages for the 'Efficiency' chart.
  const inStockPercentage =
    totalProducts > 0 ? Math.round((inStockCount / totalProducts) * 100) : 0;
  const lowStockPercentage =
    totalProducts > 0 ? Math.round((lowStockCount / totalProducts) * 100) : 0;
  const outOfStockPercentage =
    totalProducts > 0 ? Math.round((outOfStockCount / totalProducts) * 100) : 0;
  // --- End Stock Level Breakdown ---

  // --- Weekly Products Data for Chart ---
  const now = new Date();
  const weeklyProductsData = [];

  // Loop back 12 weeks to generate the time series data.
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    // Set the start date to be 'i' weeks ago.
    weekStart.setDate(weekStart.getDate() - i * 7);
    // Ensure weekStart is midnight (start of the day).
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    // Set the end date to 6 days after the start.
    weekEnd.setDate(weekEnd.getDate() + 6);
    // Ensure weekEnd is 23:59:59.999 to cover the entire day.
    weekEnd.setHours(23, 59, 59, 999);

    // Format the label as MM/DD.
    const weekLabel = `${String(weekStart.getMonth() + 1).padStart(
      2,
      "0"
    )}/${String(weekStart.getDate()).padStart(2, "0")}`;

    // Filter the locally fetched 'allProducts' to count products created in this week.
    const weekProducts = allProducts.filter((product) => {
      const productDate = new Date(product.createdAt);
      return productDate >= weekStart && productDate <= weekEnd;
    });

    weeklyProductsData.push({
      week: weekLabel,
      products: weekProducts.length,
    });
  }
  // --- End Weekly Products Data ---

  // Fetch the 5 most recently created products for the 'Stock Levels' list.
  const recent = await prisma.product.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Log the calculated value to the server console (for debugging).
  console.log(totalValue);

  // 4. RENDER UI
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar component, highlighting the Dashboard path. */}
      <Sidebar currentPath="/dashboard" />
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Welcome back! Here is an overview of your inventory.
              </p>
            </div>
          </div>
        </div>

        {/* Top Row: Key Metrics & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Key Metrics Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Key Metrics
            </h2>
            <div className="grid grid-cols-3 gap-6">
              {/* Metric: Total Products */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {totalProducts}
                </div>
                <div className="text-sm text-gray-600">Total Products</div>
                <div className="flex items-center justify-center mt-1">
                  <span className="text-xs text-green-600">
                    +{totalProducts}
                  </span>
                  <TrendingUp className="w-3 h-3 text-green-600 ml-1" />
                </div>
              </div>

              {/* Metric: Total Inventory Value */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  ${Number(totalValue).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
                <div className="flex items-center justify-center mt-1">
                  <span className="text-xs text-green-600">
                    +${Number(totalValue).toFixed(0)}
                  </span>
                  <TrendingUp className="w-3 h-3 text-green-600 ml-1" />
                </div>
              </div>

              {/* Metric: Low Stock Count */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {lowStock}
                </div>
                <div className="text-sm text-gray-600">Low Stock</div>
                <div className="flex items-center justify-center mt-1">
                  <span className="text-xs text-green-600">+{lowStock}</span>
                  <TrendingUp className="w-3 h-3 text-green-600 ml-1" />
                </div>
              </div>
            </div>
          </div>

          {/* New Products Chart Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2>New products per week</h2>
            </div>
            <div className="h-48">
              {/* Component that renders the chart using the prepared weekly data. */}
              <ProductsChart data={weeklyProductsData} />
            </div>
          </div>
        </div>

        {/* Bottom Row: Recent Stock Levels & Efficiency */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Stock Levels List */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Stock Levels
              </h2>
            </div>
            <div className="space-y-3">
              {/* Map over the 5 most recent products */}
              {recent.map((product, key) => {
                // Determine stock level (0=Out, 1=Low, 2=In Stock)
                const threshold = product.lowStockAt || 5;
                const stockLevel =
                  product.quantity === 0
                    ? 0 // Out of Stock
                    : product.quantity <= threshold
                    ? 1 // Low Stock
                    : 2; // In Stock

                const bgColors = [
                  "bg-red-600", // 0
                  "bg-yellow-600", // 1
                  "bg-green-600", // 2
                ];
                const textColors = [
                  "text-red-600",
                  "text-yellow-600",
                  "text-green-600",
                ];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      {/* Colored dot indicator */}
                      <div
                        className={`w-3 h-3 rounded-full ${bgColors[stockLevel]}`}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {product.name}
                      </span>
                    </div>
                    {/* Quantity with colored text */}
                    <div
                      className={`text-sm font-medium ${textColors[stockLevel]}`}
                    >
                      {product.quantity} units
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Efficiency (Doughnut/Pie Chart Data) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Efficiency
              </h2>
            </div>
            <div className="flex items-center justify-center">
              {/* Placeholder for a visual chart (likely a doughnut chart) */}
              <div className="relative w-48 h-48">
                {/* Background (Out of Stock portion) */}
                <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
                {/* Foreground (In Stock portion - uses clipPath for visualization) */}
                <div
                  className="absolute inset-0 rounded-full border-8 border-purple-600"
                  style={{
                    // This is a CSS trick to visually represent a percentage cut of a circle.
                    clipPath:
                      "polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50%)",
                  }}
                />
                {/* Center text for the 'In Stock' percentage */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {inStockPercentage}%
                    </div>
                    <div className="text-sm text-gray-600">In Stock</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Percentage Legend */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-200" />
                  <span>In Stock ({inStockPercentage}%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-600" />
                  <span>Low Stock ({lowStockPercentage}%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-200" />
                  <span>Out of Stock ({outOfStockPercentage}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
