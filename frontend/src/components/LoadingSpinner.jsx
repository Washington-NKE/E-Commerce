const LoadingSpinner = () => {
    return (
        <div className="flex items-center jsutify-center min-h-screen bg-gray-900">
            <div className="realtive">
                <div className="w-20 h-20 border-2 border-dashed rounded-full animate-spin border-emerald-200">
                    <div className="absolute w-16 h-16 border-t-2 border-dashed rounded-full animate-spin border-emerald-500">
                        <div className="sr-only">Loading</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoadingSpinner