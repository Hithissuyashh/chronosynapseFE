import { Suspense, lazy } from "react";
import { ClientOnly, useLocation } from "@tanstack/react-router";

const Balatro = lazy(() => import("./Balatro"));
const Dither = lazy(() => import("./Dither"));
const AsciiField = lazy(() => import("./AsciiField"));

/**
 * Route-aware decorative backdrop. Overview uses the Balatro field; every
 * other surface uses the dithered wave field. Fully visible — panels rely on
 * their own glass surfaces for contrast. No experimental values are encoded.
 */
export function SceneBackground() {
  const location = useLocation();
  const overview = location.pathname === "/";
  const contact = location.pathname === "/contact";

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />

      <ClientOnly fallback={null}>
        <Suspense fallback={null}>
          <div className="absolute inset-0">
            {overview ? (
              <Balatro isRotate={false} mouseInteraction pixelFilter={700} />
            ) : contact ? (
              <AsciiField />
            ) : (
              <Dither
                waveColor={[0.5, 0.5, 0.5]}
                disableAnimation={false}
                enableMouseInteraction
                mouseRadius={0.3}
                colorNum={4}
                waveAmplitude={0.3}
                waveFrequency={3}
                waveSpeed={0.05}
              />
            )}
          </div>
        </Suspense>
      </ClientOnly>
    </div>
  );
}
