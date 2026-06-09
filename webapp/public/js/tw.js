/* Cấu hình Tailwind CDN: trỏ palette vào biến CSS (đổi theo theme) + font Lexend.
   Đồng thời áp theme đã lưu (light/dark) ngay lập tức để tránh nháy màu. */
(function () {
  // 1) Áp theme sớm nhất có thể. Mặc định SÁNG; chỉ thêm class 'dark' khi chọn tối.
  try {
    var qp = new URLSearchParams(location.search).get('theme');
    if (qp === 'light' || qp === 'dark') { try { localStorage.setItem('theme', qp); } catch (e) {} }
    var theme = qp || localStorage.getItem('theme');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}

  // 2) Remap màu Tailwind → biến CSS (hỗ trợ opacity qua <alpha-value>)
  function ramp(name, shades) {
    const o = {};
    for (const s of shades) o[s] = `rgb(var(--${name}-${s}) / <alpha-value>)`;
    return o;
  }
  const slate = ramp('slate', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);
  const brand = ramp('brand', [200, 300, 400, 500, 600, 700]);   // thay emerald
  const accent = ramp('accent', [300, 400, 500]);                // thay blue (cam)

  window.tailwind = window.tailwind || {};
  window.tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ['Lexend', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        },
        colors: {
          slate,
          emerald: brand,  // mọi class *-emerald-* → xanh #135bec
          blue: accent,    // mọi class *-blue-* → cam (tương phản team A/B)
          brand, accent,
        },
      },
    },
  };
})();
