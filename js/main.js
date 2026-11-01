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
