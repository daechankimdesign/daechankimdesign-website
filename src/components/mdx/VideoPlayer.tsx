type VideoPlayerProps = {
  /** gif: a real .gif · video: CDN .mp4/.webm (autoplay loop muted) · embed: YouTube/Vimeo */
  type: "gif" | "video" | "embed";
  src: string;
  poster?: string;
  caption?: string;
  width?: number;
  height?: number;
};

export function VideoPlayer({
  type,
  src,
  poster,
  caption,
  width = 1600,
  height = 900,
}: VideoPlayerProps) {
  let media: React.ReactNode;

  if (type === "gif") {
    media = (
      // eslint-disable-next-line @next/next/no-img-element -- animated GIFs aren't optimized by next/image
      <img src={src} alt={caption ?? ""} loading="lazy" className="h-auto w-full" />
    );
  } else if (type === "video") {
    media = (
      <video
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        className="h-auto w-full"
      />
    );
  } else {
    media = (
      <div
        className="relative w-full"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <iframe
          src={src}
          title={caption ?? "Embedded video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <figure className="my-8">
      {media}
      {caption ? (
        <figcaption className="text-caption mt-2 text-fg-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
