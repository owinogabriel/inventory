// Skeleton component to show a loading state
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
}

export default function Loading() {
  // Stack uses React Suspense, which will render this page while user data is being fetched.
  // See: https://nextjs.org/docs/app/api-reference/file-conventions/loading
  return <></>;
}
