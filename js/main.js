// Nav toggle (mobile)
(function(){
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if(toggle && links){
    toggle.addEventListener('click', function(){
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();
})();

// Hero quick mortgage estimate
(function(){
  const home = document.getElementById('qHome');
  const down = document.getElementById('qDown');
  const rate = document.getElementById('qRate');
  const result = document.getElementById('qResult');
  const downAmt = document.getElementById('qDownAmt');
  if(!home || !result) return;

  function calc(){
    const price = parseFloat(home.value) || 0;
    const downPct = Math.min(Math.max(parseFloat(down.value) || 0, 0), 100);
    const annualRate = parseFloat(rate.value) || 0;
    const downPayment = price * (downPct / 100);
    const principal = Math.max(price - downPayment, 0);
    const amortYears = 25; // standard default for the quick estimate
    const monthlyRate = (annualRate / 100) / 12;
    const n = amortYears * 12;
    let payment = 0;
    if(monthlyRate === 0){
      payment = principal / n;
    } else {
      payment = principal * (monthlyRate * Math.pow(1+monthlyRate, n)) / (Math.pow(1+monthlyRate, n) - 1);
    }
    result.textContent = isFinite(payment) ? '$' + Math.round(payment).toLocaleString() : '$0';
    downAmt.textContent = 'Based on ' + downPct + '% down ($' + Math.round(downPayment).toLocaleString() + ') and a 25-year amortization.';
  }

  [home, down, rate].forEach(el => el.addEventListener('input', calc));
  calc();
})();
