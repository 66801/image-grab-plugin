let imageList = [];

// 页面完全加载后读取数据
window.onload = function() {
  // 从本地存储取出图片列表
  chrome.storage.local.get('imageList', (result) => {
    imageList = result.imageList || [];
    renderImages();
    updateCount();
  });

  // 绑定所有按钮事件
  document.getElementById('selectAll').addEventListener('click', selectAll);
  document.getElementById('invertSelect').addEventListener('click', invertSelect);
  document.getElementById('downloadBtn').addEventListener('click', downloadSelected);
};

// 渲染图片网格
function renderImages() {
  const grid = document.getElementById('imageGrid');
  grid.innerHTML = '';

  if (imageList.length === 0) {
    grid.innerHTML = '<div class="empty">未提取到有效图片</div>';
    return;
  }

  imageList.forEach((url, index) => {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.innerHTML = `
      <input type="checkbox" class="check" data-index="${index}" checked>
      <img src="${url}" alt="图片${index + 1}" loading="lazy">
      <span class="index">${index + 1}</span>
    `;
    grid.appendChild(card);
  });

  // 绑定复选框事件
  document.querySelectorAll('.check').forEach(box => {
    box.addEventListener('change', updateCount);
  });
}

// 更新选中计数
function updateCount() {
  const total = imageList.length;
  const selected = document.querySelectorAll('.check:checked').length;
  document.getElementById('totalCount').innerText = total;
  document.getElementById('selectedCount').innerText = selected;
}

// 全选
function selectAll() {
  document.querySelectorAll('.check').forEach(box => box.checked = true);
  updateCount();
}

// 反选
function invertSelect() {
  document.querySelectorAll('.check').forEach(box => box.checked = !box.checked);
  updateCount();
}

// 批量下载选中图片
async function downloadSelected() {
  const checks = document.querySelectorAll('.check:checked');
  if (checks.length === 0) {
    alert('请先选择要下载的图片');
    return;
  }

  const btn = document.getElementById('downloadBtn');
  btn.innerText = '下载中...';
  btn.disabled = true;

  try {
    for (let i = 0; i < checks.length; i++) {
      const index = parseInt(checks[i].dataset.index);
      const url = imageList[index];
      const num = String(i + 1).padStart(3, '0');
      await downloadImageAsPng(url, `商品图_${num}.png`);
    }
    alert('下载完成');
  } catch (e) {
    alert('下载出错：' + e.message);
  } finally {
    btn.innerText = '下载选中';
    btn.disabled = false;
  }
}

// 图片转PNG格式并下载
function downloadImageAsPng(url, filename) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(blob => {
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objUrl);
        resolve();
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = url;
  });
}
