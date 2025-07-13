// module imports
const axios = require('axios');

exports.getYouTubeVideoId = (url) => {
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/attribution_link\?a=|youtube\.com\/attribut?e=|youtube\.com\/shorts\/)([0-9a-zA-Z_-]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

exports.getYoutubeMeta = async (videoId) => {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  try {
    const { data } = await axios.get(oembedUrl);
    return data;
  } catch (error) {
    console.error('Error fetching metadata from YouTube:', error, videoId);
    return null;
  }
};
