/**
 * Capture first frame of a video as JPEG data URL (poster/thumbnail).
 */
export function getVideoPosterUrl(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('crossOrigin', 'anonymous');

    const done = (url: string) => {
      video.src = '';
      video.load();
      resolve(url);
    };

    const timeout = window.setTimeout(() => {
      video.onseeked = null;
      video.onerror = null;
      done('');
    }, 8000);

    video.onseeked = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          done('');
          return;
        }
        ctx.drawImage(video, 0, 0);
        done(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        done('');
      }
    };
    video.onerror = () => {
      clearTimeout(timeout);
      done('');
    };
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) * 0.1);
    };
    video.src = videoUrl;
  });
}
