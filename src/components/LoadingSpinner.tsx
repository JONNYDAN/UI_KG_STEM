export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      <span className="ml-3 text-lg">Đang tải...</span>
    </div>
  );
}