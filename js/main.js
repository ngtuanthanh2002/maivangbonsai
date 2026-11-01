const money = (value) => value.toLocaleString('vi-VN') + '₫';

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

document.querySelectorAll('[data-order]').forEach((form) => {
  const readOrder = () => {
    const pack = form.querySelector('input[name="pack"]:checked');
    const bud = form.querySelector('input[name="bud"]:checked');
    const packPrice = Number(pack.dataset.price);
    const budPrice = Number(bud.dataset.price);
    return {
      packLabel: pack.dataset.label,
      packPrice,
      budLabel: bud.dataset.label,
      budPrice,
      total: packPrice + budPrice,
    };
  };

  const total = form.querySelector('[data-total]');
  const render = () => {
    total.textContent = money(readOrder().total);
  };

  form.addEventListener('change', render);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const order = readOrder();
    const data = new FormData(form);
    const lines = [
      'ĐƠN HÀNG MAI VÀNG BONSAI',
      `Gói: ${order.packLabel} - ${money(order.packPrice)}`,
    ];
    if (order.budPrice > 0) {
      lines.push(`Thuốc kích nụ hoa: ${order.budLabel} - ${money(order.budPrice)}`);
    }
    lines.push(
      `Tổng: ${money(order.total)} (miễn ship)`,
      `Giống mai: ${data.get('variety') || 'Nhờ nhà vườn chọn giúp'}`,
      `Người nhận: ${data.get('name').trim()}`,
      `Điện thoại: ${data.get('phone').trim()}`,
      `Địa chỉ: ${data.get('address').trim()}`,
    );

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
