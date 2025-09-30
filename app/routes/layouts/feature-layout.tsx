import type { Route } from "./+types/feature-layout";
import { Outlet, useRouteLoaderData } from "react-router";
import { NewFeatureService } from "~/services/newFeatureService";
import { redirect } from "react-router";
import { useEffect, useState } from "react";
import type { NewFeature } from "~/services/newFeatureService";

export async function loader({ request, context }: Route.LoaderArgs) {
  const user = context.session?.user;
  if (!user?.id) {
    return redirect("/");
  }

  const currentPage = new URL(request.url).pathname;

  try {
    const features = await NewFeatureService.getFeaturesForPage(currentPage, user.id);
    return { features, userId: user.id, currentPage };
  } catch (error) {
    console.error("Error loading features:", error);
    return { features: [], userId: user.id, currentPage };
  }
}

export default function FeatureLayout({ loaderData }: Route.ComponentProps) {
  const [dismissedFeatures, setDismissedFeatures] = useState<number[]>([]);
  const [availableFeature, setAvailableFeature] = useState<NewFeature | null>(null);
  const rootData = useRouteLoaderData("root") as { csrfToken?: string };

  useEffect(() => {
    const checkFeatureAvailability = () => {
      const features = loaderData?.features?.filter(f => !dismissedFeatures.includes(f.id)) || [];

      for (const feature of features) {
        const elements = document.querySelectorAll(feature.selector);
        if (elements.length > 0) {
          setAvailableFeature(feature);
          return;
        }
      }
      setAvailableFeature(null);
    };

    checkFeatureAvailability();

    const timer = setTimeout(checkFeatureAvailability, 100);

    const observer = new MutationObserver(() => {
      checkFeatureAvailability();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [loaderData?.features, dismissedFeatures]);

  const currentFeature = availableFeature;

  const handleDismissFeature = async (featureId: number) => {
    // Optimistically update UI
    setDismissedFeatures((prev: number[]) => [...prev, featureId]);

    try {
      const response = await fetch('/api/dismiss-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csrfToken: rootData?.csrfToken || '',
          featureId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error dismissing feature:', error);
      // Revert optimistic update on error
      setDismissedFeatures((prev: number[]) => prev.filter((id: number) => id !== featureId));
    }
  };

  useEffect(() => {
    if (!currentFeature) return;

    const handleAnyInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('.feature-popup')) {
        return;
      }
      handleDismissFeature(currentFeature.id);
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleAnyInput);
      document.addEventListener('touchstart', handleAnyInput);
      document.addEventListener('mousedown', handleAnyInput);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleAnyInput);
      document.removeEventListener('touchstart', handleAnyInput);
      document.removeEventListener('mousedown', handleAnyInput);
    };
  }, [currentFeature]);

  useEffect(() => {
    if (!currentFeature) return;

    const elements = document.querySelectorAll(currentFeature.selector);
    if (elements.length === 0) return;

    const cleanupFunctions: (() => void)[] = [];

    elements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const stickyParent = htmlElement.closest('.sticky') as HTMLElement;

      if (stickyParent) {
        stickyParent.style.zIndex = '9999';
        stickyParent.style.position = 'relative';

        const localCurtain = document.createElement('div');
        localCurtain.className = 'absolute inset-0 bg-black/75 backdrop-blur-sm z-10';
        localCurtain.classList.add('local-curtain');
        stickyParent.appendChild(localCurtain);

        htmlElement.classList.add(
          'relative',
          'z-20',
          'ring-2',
          'ring-white',
          'ring-opacity-60',
          'shadow-2xl',
          'shadow-white/75',
          'rounded-lg',
          'animate-pulse'
        );
        htmlElement.style.boxShadow = '0 0 60px rgba(255, 255, 255, 0.8), 0 0 120px rgba(255, 255, 255, 0.6), 0 0 180px rgba(255, 255, 255, 0.4)';

        cleanupFunctions.push(() => {
          stickyParent.style.zIndex = '';
          stickyParent.style.position = '';

          localCurtain.remove();

          htmlElement.style.boxShadow = '';
          htmlElement.classList.remove(
            'relative',
            'z-20',
            'ring-2',
            'ring-white',
            'ring-opacity-60',
            'shadow-2xl',
            'shadow-white/75',
            'rounded-lg',
            'animate-pulse'
          );
        });
      } else {
        htmlElement.classList.add(
          'relative',
          'z-[9999]',
          'ring-2',
          'ring-white',
          'ring-opacity-60',
          'shadow-2xl',
          'shadow-white/75',
          'rounded-lg',
          'animate-pulse'
        );
        htmlElement.style.boxShadow = '0 0 60px rgba(255, 255, 255, 0.8), 0 0 120px rgba(255, 255, 255, 0.6), 0 0 180px rgba(255, 255, 255, 0.4)';

        cleanupFunctions.push(() => {
          htmlElement.style.boxShadow = '';
          htmlElement.classList.remove(
            'relative',
            'z-[9999]',
            'ring-2',
            'ring-white',
            'ring-opacity-60',
            'shadow-2xl',
            'shadow-white/75',
            'rounded-lg',
            'animate-pulse'
          );
        });
      }
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [currentFeature?.selector]);

  return (
    <>
      <Outlet />
      {currentFeature && (
        <>
          {/* Curtain overlay */}
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9998]" />

          {/* Feature description popup */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="feature-popup bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm rounded-lg shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {currentFeature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {currentFeature.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDismissFeature(currentFeature.id)}
                    className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleDismissFeature(currentFeature.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium cursor-pointer"
                  >
                    Got it!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}