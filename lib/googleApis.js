/**
 * Google Cloud Vision API - Web Detection
 * Finds where images appear on the web
 */
export async function detectImageOnWeb(imageBase64) {
  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: imageBase64
              },
              features: [
                {
                  type: 'WEB_DETECTION',
                  maxResults: 10
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const webDetection = data.responses?.[0]?.webDetection || {};
    
    return {
      success: true,
      pagesWithMatchingImages: webDetection.pagesWithMatchingImages || [],
      fullMatchingImages: webDetection.fullMatchingImages || [],
      partialMatchingImages: webDetection.partialMatchingImages || [],
      visuallySimilarImages: webDetection.visuallySimilarImages || [],
      webEntities: webDetection.webEntities || [],
      bestGuessLabels: webDetection.bestGuessLabels || []
    };
  } catch (error) {
    console.error('Cloud Vision API Error:', error);
    throw error;
  }
}

/**
 * Google Custom Search - Search for text content on the web
 */
export async function searchWebForContent(query, type = 'text') {
  try {
    const searchType = type === 'image' ? '&searchType=image' : '';
    
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_CUSTOM_SEARCH_API_KEY}&cx=${process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}${searchType}`
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return {
      success: true,
      totalResults: data.searchInformation?.totalResults || 0,
      items: (data.items || []).map(item => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        displayLink: item.displayLink,
        image: item.image?.thumbnailLink
      }))
    };
  } catch (error) {
    console.error('Custom Search API Error:', error);
    throw error;
  }
}

/**
 * Calculate similarity between two text contents
 */
export function calculateTextSimilarity(text1, text2) {
  // Simple word-based similarity using Jaccard index
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  if (union.size === 0) return 0;
  
  return Math.round((intersection.size / union.size) * 100);
}

/**
 * YouTube Data API v3 - Search for videos matching a query
 */
export async function searchYouTubeForContent(query) {
  try {
    const apiKey = process.env.GOOGLE_YOUTUBE_API || process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API Key is missing. Please configure GOOGLE_YOUTUBE_API in .env.local');
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${apiKey}`
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return {
      success: true,
      items: (data.items || []).map(item => ({
        title: item.snippet.title,
        link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        snippet: item.snippet.description,
        displayLink: 'youtube.com',
        image: item.snippet.thumbnails?.default?.url
      }))
    };
  } catch (error) {
    console.error('YouTube API Error:', error);
    throw error;
  }
}

/**
 * YouTube Data API v3 - Fetch video details by video ID
 */
export async function getYouTubeVideoDetails(videoId) {
  try {
    const apiKey = process.env.GOOGLE_YOUTUBE_API || process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API Key is missing. Please configure GOOGLE_YOUTUBE_API in .env.local');
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const items = data.items || [];
    if (items.length === 0) {
      return { success: false, error: 'Video not found' };
    }

    const video = items[0];
    return {
      success: true,
      video: {
        title: video.snippet.title,
        channel: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails?.default?.url || video.snippet.thumbnails?.medium?.url,
        link: `https://www.youtube.com/watch?v=${videoId}`,
        description: video.snippet.description || ''
      }
    };
  } catch (error) {
    console.error('YouTube Video Lookup Error:', error);
    throw error;
  }
}

