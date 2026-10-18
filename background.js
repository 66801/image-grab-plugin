// 存储图片数据，供画廊页面读取
let imageCache = [];

// 监听来自content的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openGallery') {
    // 缓存图片数据
    imageCache = request.images;
    // 打开画廊页面
    chrome.tabs.create({
      url: chrome.runtime.getURL('gallery.html')
    });
    sendResponse({ success: true });
  }
  
  // 画廊页面请求数据
  if (request.action === 'getImages') {
    sendResponse({ images: imageCache });
  }
  
  return true;
});
