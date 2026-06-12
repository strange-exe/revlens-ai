export default function Card({ title, description, image, action }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {image && (
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-sm overflow-hidden">
          {typeof image === "string" ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            image
          )}
        </div>
      )}
      <div className="p-5">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            {action.label} &rarr;
          </button>
        )}
      </div>
    </div>
  )
}
