import { useEffect, useState } from "react";

const DEFAULT_KEY_PLACEHOLDER = "tu_access_key_de_unsplash";

function buildFallbackUnsplashUrl(keyword) {
  const safeKeyword = encodeURIComponent(keyword || "english story");
  const seed = [...safeKeyword].reduce((total, char) => total + char.charCodeAt(0), 0);
  return `https://source.unsplash.com/featured/1280x720/?${safeKeyword}&sig=${seed}`;
}

export function useUnsplash(keyword) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(Boolean(keyword));

  useEffect(() => {
    if (!keyword) {
      setImageUrl(null);
      setLoading(false);
      return;
    }

    const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY?.trim();
    if (!key || key === DEFAULT_KEY_PLACEHOLDER) {
      setImageUrl(buildFallbackUnsplashUrl(keyword));
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(keyword)}&orientation=landscape&client_id=${key}`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) {
          setImageUrl(data?.urls?.regular ?? data?.urls?.small ?? buildFallbackUnsplashUrl(keyword));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setImageUrl(buildFallbackUnsplashUrl(keyword));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [keyword]);

  return { imageUrl, loading };
}