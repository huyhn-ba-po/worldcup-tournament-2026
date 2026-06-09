/* Cấu hình Tailwind CDN: trỏ palette vào biến CSS + font Lexend. Light-only. */
(function () {
  function ramp(name, shades) {
    const o = {};
    for (const s of shades) o[s] = `rgb(var(--${name}-${s}) / <alpha-value>)`;
    return o;
  }
  const slate = ramp('slate', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);
  const brand = ramp('brand', [200, 300, 400, 500, 600, 700]);   // thay emerald
  const accent = ramp('accent', [300, 400, 500]);                // thay blue

  window.tailwind = window.tailwind || {};
  window.tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ['Lexend', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        },
        colors: {
          slate,
          emerald: brand,  // mọi class *-emerald-* → xanh thép dịu
          blue: accent,    // mọi class *-blue-* → cam đất nhẹ
          amber: { 200: '#b89a4a', 300: '#a07b2f', 400: '#8c6a28', 500: '#75571f', 600: '#634a1a' }, // vàng trầm dịu mắt
          brand, accent,
        },
      },
    },
  };
})();
