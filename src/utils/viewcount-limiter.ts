export class ViewCountLimiter {
  #videos: Map<string, Set<string>> = new Map();

  constructor() {}

  addViewerToLimit(videoHash: string, viewerId: string) {
    const viewers = this.#videos.get(videoHash);
    if (viewers) {
      viewers.add(viewerId);
      this.#videos.set(videoHash, viewers);
    } else {
      const viewers = new Set([viewerId]);
      this.#videos.set(videoHash, viewers);
    }

    setTimeout(() => {
      this.removeViewerFromLimit(videoHash, viewerId);
    }, 1000 * 60 * 5);
  }

  private removeViewerFromLimit(videoHash: string, viwerId: string) {
    const viewers = this.#videos.get(videoHash);
    viewers?.delete(viwerId);
  }

  userIsLimited(videoHash: string, viewerId: string): boolean {
    const viewers = this.#videos.get(videoHash);
    if (viewers == null) return false;
    return viewers?.has(viewerId);
  }
}

const viewcountLimiter = new ViewCountLimiter();

export { viewcountLimiter };
