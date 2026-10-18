// 创建右上角悬浮按钮
const btn = document.createElement('button');
btn.innerText = '获取图片';
btn.style.cssText = `
  position: fixed;
  right: 24px;
  top: 24px;
  z-index: 999999;
  padding: 10px 20px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
  transition: all 0.2s ease;
`;
document.body.appendChild(btn);

// 按钮点击提取图片
btn.addEventListener('click', async () => {
  const originalText = btn.innerText;
  btn.innerText = '提取中...';
  btn.disabled = true;

  try {
    // 提取页面所有图片
    const imageUrls = extractAllImages();
    // 去重
    const uniqueUrls = [...new Set(imageUrls)];
    // 过滤小于100x100的小图
    const validUrls = await filterSmallImages(uniqueUrls);

    if (validUrls.length === 0) {
      alert('未提取到有效商品图片');
      return;
    }

    // 发送到后台并打开展示页
    chrome.runtime.sendMessage({
      action: 'openGallery',
      images: validUrls
    });
  } catch (err) {
    alert('提取失败：' + err.message);
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
});

/**
 * 提取页面所有可能的图片地址
 */
function extractAllImages() {
  const urls = [];

  // 提取img标签图片
  document.querySelectorAll('img').forEach(img => {
    const src = img.src 
      || img.getAttribute('data-src') 
      || img.getAttribute('data-original')
      || img.getAttribute('data-lazy-src');
    if (src && src.startsWith('http') && !src.startsWith('data:image')) {
      urls.push(src);
    }
  });

  // 提取元素背景图
  document.querySelectorAll('*').forEach(el => {
    const bg = window.getComputedStyle(el).backgroundImage;
    if (bg && bg.startsWith('url("')) {
      const url = bg.slice(5, -2);
      if (url.startsWith('http') && !url.startsWith('data:image')) {
        urls.push(url);
      }
    }
  });

  return urls;
}

/**
 * 过滤尺寸过小的图片
 */
function filterSmallImages(urls) {
  const promises = urls.map(url => {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (img.naturalWidth >= 100 && img.naturalHeight >= 100) {
          resolve(url);
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  });

  return Promise.all(promises).then(results => results.filter(item => item !== null));
}
