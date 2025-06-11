
import { useEffect } from 'react';

/**
 * Hook to set the document title
 * @param title The title to set
 * @param prefix Optional prefix to add before the title (e.g., app name)
 */
export function useTitle(title: string, prefix: string = 'Jewelry Dashboard | ') {
  useEffect(() => {
    // Save the original title to restore it on unmount
    const originalTitle = document.title;
    
    // Set the new title with prefix
    document.title = `${prefix}${title}`;
    
    // Restore the original title on unmount
    return () => {
      document.title = originalTitle;
    };
  }, [title, prefix]);
}

export default useTitle;
