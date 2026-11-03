// Dán URL Web app của Google Apps Script vào đây (kết thúc bằng /exec).
// Để trống thì khách gửi đơn thủ công qua Zalo hoặc gọi điện.
const ORDER_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxFEdbwe70do2A58l5_1rWtxDDyXsPTDl8A1NVp-GrzngV_5ukjy9wP6-o-CwicnlFE/exec';
const ORDER_TIMEOUT_MS = 20000;

const money = (value) => value.toLocaleString('vi-VN') + '₫';

// Meta Pixel: PageView nằm trong <head>, các bước còn lại của phễu mua hàng ở đây
const track = (event, data) => {
  if (window.fbq) window.fbq('track', event, data);
};
const trackedOnce = new Set();
const trackOnce = (event, data) => {
  if (trackedOnce.has(event)) return;
  trackedOnce.add(event);
  track(event, data);
};
const adData = (order) => ({
  content_name: order.packLabel,
  content_ids: [order.packSku],
  content_type: 'product',
  num_items: order.packItems,
  value: order.total,
  currency: 'VND',
});

track('ViewContent', {
  content_name: 'Cây mai vàng bonsai',
  content_type: 'product',
  value: 100000,
  currency: 'VND',
});

document.addEventListener('click', (event) => {
  if (event.target.closest('a[href^="tel:"], a[href*="zalo.me"]')) trackOnce('Contact');
});

// Đếm ngược đến Tết
const timers = document.querySelectorAll('[data-countdown]');
if (timers.length) {
  const target = new Date(timers[0].dataset.countdown).getTime();
  const units = {
    days: 86400000,
    hours: 3600000,
    minutes: 60000,
    seconds: 1000,
  };

  const tick = () => {
    let left = target - Date.now();
    if (left <= 0) {
      document.querySelectorAll('.timerbar, .pricebar__timer').forEach((el) => {
        el.hidden = true;
      });
      clearInterval(timer);
      return;
    }
    for (const [unit, ms] of Object.entries(units)) {
      const value = Math.floor(left / ms);
      left -= value * ms;
      document.querySelectorAll(`[data-unit="${unit}"]`).forEach((el) => {
        el.textContent = String(value).padStart(2, '0');
      });
    }
  };

  const timer = setInterval(tick, 1000);
  tick();
}

// Slider ảnh
const slider = document.querySelector('[data-slider]');
if (slider) {
  const track = slider.querySelector('.slider__track');
  const thumbs = [...slider.querySelectorAll('.slider__thumbs button')];
  const count = slider.querySelector('[data-slider-count]');
  const current = () => Math.round(track.scrollLeft / track.clientWidth);
  const goTo = (index) => {
    const wrapped = (index + thumbs.length) % thumbs.length;
    track.scrollTo({ left: wrapped * track.clientWidth, behavior: 'smooth' });
  };

  thumbs.forEach((thumb, index) => {
    thumb.addEventListener('click', () => goTo(index));
  });

  slider.querySelectorAll('[data-slide]').forEach((arrow) => {
    arrow.addEventListener('click', () => goTo(current() + Number(arrow.dataset.slide)));
  });

  track.addEventListener('scroll', () => {
    const index = current();
    count.textContent = `${index + 1}/${thumbs.length}`;
    thumbs.forEach((thumb, i) => thumb.classList.toggle('is-active', i === index));
    thumbs[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, { passive: true });
}

// Slider video: chuột thì kéo, điện thoại thì vuốt nhờ cuộn ngang của trình duyệt
const videoSlider = document.querySelector('[data-video-slider]');
if (videoSlider) {
  const DRAG_THRESHOLD = 6;
  const SWITCH_DISTANCE = 40;
  const row = videoSlider.querySelector('.video__row');
  const cards = [...row.children];
  const arrows = [...videoSlider.querySelectorAll('[data-video-slide]')];
  const offsetOf = (card) => card.offsetLeft - cards[0].offsetLeft;
  const current = () => {
    const distances = cards.map((card) => Math.abs(offsetOf(card) - row.scrollLeft));
    return distances.indexOf(Math.min(...distances));
  };
  const goTo = (index) => {
    const target = cards[Math.min(cards.length - 1, Math.max(0, index))];
    row.scrollTo({ left: offsetOf(target), behavior: 'smooth' });
  };

  row.addEventListener('scroll', () => {
    const max = row.scrollWidth - row.clientWidth;
    arrows[0].hidden = row.scrollLeft <= 1;
    arrows[1].hidden = row.scrollLeft >= max - 1;
  }, { passive: true });

  arrows.forEach((arrow) => {
    arrow.addEventListener('click', () => goTo(current() + Number(arrow.dataset.videoSlide)));
  });

  let pressed = false;
  let dragged = false;
  let startX = 0;
  let startLeft = 0;
  let startIndex = 0;
  let distance = 0;

  row.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    pressed = true;
    dragged = false;
    startX = event.clientX;
    startLeft = row.scrollLeft;
    startIndex = current();
  });

  row.addEventListener('pointermove', (event) => {
    if (!pressed) return;
    distance = event.clientX - startX;
    if (!dragged) {
      if (Math.abs(distance) < DRAG_THRESHOLD) return;
      dragged = true;
      row.classList.add('is-dragging');
      // Chỉ giữ con trỏ sau khi đã kéo, nếu không cú bấm phát video sẽ không tới nút play
      row.setPointerCapture(event.pointerId);
    }
    row.scrollLeft = startLeft - distance;
  });

  const release = () => {
    if (!pressed) return;
    pressed = false;
    if (!dragged) return;
    let index = startIndex;
    if (distance <= -SWITCH_DISTANCE) index += 1;
    if (distance >= SWITCH_DISTANCE) index -= 1;
    goTo(index);
    setTimeout(() => row.classList.remove('is-dragging'), 400);
  };
  row.addEventListener('pointerup', release);
  row.addEventListener('pointercancel', release);

  // Kéo xong không được tính là bấm phát video
  row.addEventListener('click', (event) => {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    dragged = false;
  }, true);
  row.addEventListener('dragstart', (event) => event.preventDefault());
}

// Trang có 2 form đặt hàng giống nhau như trang mẫu
const orderSection = document.getElementById('dang-ky');
const orderCopy = orderSection.cloneNode(true);
orderCopy.id = 'dang-ky2';
document.getElementById('order-copy').replaceWith(orderCopy);

const dialog = document.getElementById('confirm');
const orderText = document.getElementById('confirm-text');
const successDialog = document.getElementById('order-success');

const sendOrder = async (payload) => {
  if (!ORDER_ENDPOINT) return false;
  try {
    // Không đặt Content-Type JSON: Apps Script không trả lời được yêu cầu preflight CORS
    const response = await fetch(ORDER_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(ORDER_TIMEOUT_MS),
    });
    const result = await response.json();
    return result.ok === true;
  } catch {
    return false;
  }
};

document.querySelectorAll('[data-order]').forEach((form) => {
  const readOrder = () => {
    const pack = form.querySelector('input[name="pack"]:checked');
    const bud = form.querySelector('input[name="bud"]:checked');
    const packPrice = Number(pack.dataset.price);
    const budPrice = Number(bud.dataset.price);
    return {
      packLabel: pack.dataset.label,
      packSku: pack.dataset.sku,
      packItems: Number(pack.dataset.items),
      packPrice,
      budLabel: bud.dataset.label,
      budPrice,
      total: packPrice + budPrice,
    };
  };

  const total = form.querySelector('[data-total]');
  const chips = [...form.querySelectorAll('input[name="variety"]')];
  const picked = form.querySelector('[data-variety-picked]');
  const varietyHint = form.querySelector('[data-variety-hint]');

  // Mỗi giống được tích có một dòng chọn số cây, xếp theo thứ tự khách chọn
  const rows = () => [...picked.children];
  const rowOf = (name) => rows().find((row) => row.dataset.variety === name);
  const qtyOf = (row) => Number(row.dataset.qty);
  const setQty = (row, qty) => {
    row.dataset.qty = qty;
    row.querySelector('b').textContent = qty;
  };
  const createRow = (name) => {
    const row = document.createElement('li');
    row.className = 'picked';
    row.dataset.variety = name;
    row.innerHTML = '<span class="picked__name"></span><span class="qty">'
      + '<button type="button" data-step="-1">−</button><b></b>'
      + '<button type="button" data-step="1">+</button></span>';
    row.querySelector('.picked__name').textContent = name;
    row.querySelector('[data-step="-1"]').setAttribute('aria-label', `Bớt 1 cây ${name}`);
    row.querySelector('[data-step="1"]').setAttribute('aria-label', `Thêm 1 cây ${name}`);
    setQty(row, 1);
    return row;
  };
  const removeRow = (row) => {
    chips.find((chip) => chip.value === row.dataset.variety).checked = false;
    row.remove();
  };
  const pickedCount = () => rows().reduce((sum, row) => sum + qtyOf(row), 0);
  const readVarieties = () => rows().map((row) => ({ name: row.dataset.variety, qty: qtyOf(row) }));

  // Tổng số cây các giống không vượt số cây của gói, gói nhỏ lại thì bớt từ giống chọn sau cùng
  const renderVarieties = (max) => {
    chips.forEach((chip) => {
      const row = rowOf(chip.value);
      if (chip.checked && !row) picked.append(createRow(chip.value));
      if (!chip.checked && row) row.remove();
    });
    let extra = pickedCount() - max;
    for (const row of rows().reverse()) {
      if (extra <= 0) break;
      const cut = Math.min(extra, qtyOf(row));
      if (cut === qtyOf(row)) removeRow(row);
      else setQty(row, qtyOf(row) - cut);
      extra -= cut;
    }

    const count = pickedCount();
    chips.forEach((chip) => {
      chip.disabled = !chip.checked && count >= max;
    });
    rows().forEach((row) => {
      row.querySelector('[data-step="1"]').disabled = count >= max;
    });
    picked.hidden = count === 0;
    if (count === 0) {
      varietyHint.textContent = `Gói của bạn có ${max} cây · Không chọn: nhà vườn chọn giúp`;
    } else if (count < max) {
      varietyHint.textContent = `Đã chọn ${count}/${max} cây · ${max - count} cây còn lại nhà vườn chọn giúp`;
    } else {
      varietyHint.textContent = `Đã chọn đủ ${max}/${max} cây`;
    }
  };

  const render = () => {
    const order = readOrder();
    total.textContent = money(order.total);
    renderVarieties(order.packItems);
  };

  form.addEventListener('click', (event) => {
    const button = event.target.closest('[data-step]');
    if (!button) return;
    const row = button.closest('.picked');
    const qty = qtyOf(row) + Number(button.dataset.step);
    // Bớt về 0 cây thì bỏ luôn giống đó
    if (qty <= 0) removeRow(row);
    else setQty(row, qty);
    render();
  });

  form.addEventListener('change', (event) => {
    render();
    if (event.target.type === 'radio') trackOnce('AddToCart', adData(readOrder()));
  });

  form.addEventListener('focusin', (event) => {
    if (event.target.matches('.input')) trackOnce('InitiateCheckout', adData(readOrder()));
  });

  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = submitButton.textContent;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitButton.disabled) return;
    const order = readOrder();
    const data = new FormData(form);
    const varieties = readVarieties();
    const unpicked = order.packItems - pickedCount();
    const varietyParts = varieties.map((item) => `${item.name} x${item.qty}`);
    if (unpicked > 0) varietyParts.push(`nhà vườn chọn giúp ${unpicked} cây`);
    const lines = [
      'ĐƠN HÀNG MAI VÀNG BONSAI',
      `Gói: ${order.packLabel} - ${money(order.packPrice)}`,
    ];
    if (order.budPrice > 0) {
      lines.push(`Thuốc kích nụ hoa: ${order.budLabel} - ${money(order.budPrice)}`);
    }
    lines.push(
      `Tổng: ${money(order.total)} (miễn ship)`,
      `Giống mai: ${varietyParts.join(', ')}`,
      `Người nhận: ${data.get('name').trim()}`,
      `Điện thoại: ${data.get('phone').trim()}`,
      `Địa chỉ: ${data.get('address').trim()}`,
    );

    submitButton.disabled = true;
    submitButton.textContent = 'Đang gửi đơn…';
    const saved = await sendOrder({
      name: data.get('name'),
      phone: data.get('phone'),
      address: data.get('address'),
      pack: order.packLabel,
      packItems: order.packItems,
      bud: order.budLabel || 'Không mua',
      varieties,
      total: order.total,
      website: data.get('website'),
    });
    submitButton.disabled = false;
    submitButton.textContent = submitLabel;

    if (saved) {
      track('Purchase', adData(order));
      form.reset();
      render();
      successDialog.showModal();
      return;
    }

    // Không lưu được đơn thì để khách gửi qua Zalo, tránh mất đơn
    orderText.value = lines.join('\n');
    dialog.showModal();
  });

  render();
});

document.getElementById('confirm-zalo').addEventListener('click', () => {
  orderText.select();
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(orderText.value);
  } else {
    document.execCommand('copy');
  }
});
