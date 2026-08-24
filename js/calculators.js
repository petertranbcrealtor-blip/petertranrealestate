// ===== Mortgage Calculator =====
function initMortgageCalculator(){
  const price = document.getElementById('mPrice');
  const downPct = document.getElementById('mDownPct');
  const downAmtEl = document.getElementById('mDownAmt');
  const rate = document.getElementById('mRate');
  const amort = document.getElementById('mAmort');
  const freq = document.getElementById('mFreq');
  const out = {
    payment: document.getElementById('mPayment'),
    principal: document.getElementById('mPrincipal'),
    totalInterest: document.getElementById('mTotalInterest'),
    totalPaid: document.getElementById('mTotalPaid'),
  };
  if(!price) return;

  function paymentsPerYear(f){ return f === 'weekly' ? 52 : f === 'biweekly' ? 26 : 12; }

  function calc(){
    const p = parseFloat(price.value) || 0;
    const dPct = Math.min(Math.max(parseFloat(downPct.value) || 0, 0), 100);
    const dAmt = p * dPct/100;
    downAmtEl.textContent = '$' + Math.round(dAmt).toLocaleString() + ' down payment';
    const principal = Math.max(p - dAmt, 0);
    const r = (parseFloat(rate.value) || 0) / 100;
    const years = parseFloat(amort.value) || 25;
    const ppy = paymentsPerYear(freq.value);
    const n = years * ppy;
    const periodicRate = r / ppy;

    let payment;
    if(periodicRate === 0){ payment = principal / n; }
    else { payment = principal * (periodicRate * Math.pow(1+periodicRate, n)) / (Math.pow(1+periodicRate, n) - 1); }

    const totalPaid = payment * n;
    const totalInterest = totalPaid - principal;

    out.payment.textContent = isFinite(payment) ? '$' + Math.round(payment).toLocaleString() : '$0';
    out.principal.textContent = '$' + Math.round(principal).toLocaleString();
    out.totalInterest.textContent = '$' + Math.round(totalInterest).toLocaleString();
    out.totalPaid.textContent = '$' + Math.round(totalPaid).toLocaleString();
  }

  [price, downPct, rate, amort, freq].forEach(el => el.addEventListener('input', calc));
  calc();
}

// ===== Affordability Calculator =====
function initAffordabilityCalculator(){
  const income = document.getElementById('aIncome');
  const debts = document.getElementById('aDebts');
  const down = document.getElementById('aDown');
  const rate = document.getElementById('aRate');
  const amort = document.getElementById('aAmort');
  const heat = document.getElementById('aHeat');
  const out = {
    maxPrice: document.getElementById('aMaxPrice'),
    maxPayment: document.getElementById('aMaxPayment'),
    gdsNote: document.getElementById('aGdsNote'),
  };
  if(!income) return;

  function calc(){
    const annualIncome = parseFloat(income.value) || 0;
    const monthlyIncome = annualIncome / 12;
    const monthlyDebts = parseFloat(debts.value) || 0;
    const downPayment = parseFloat(down.value) || 0;
    const heatCost = parseFloat(heat.value) || 175;
    const r = (parseFloat(rate.value) || 0) / 100 / 12;
    const years = parseFloat(amort.value) || 25;
    const n = years * 12;

    // Canadian mortgage stress test qualifying guidelines:
    // GDS (housing costs) <= 39% of gross income, TDS (all debts) <= 44%
    const gdsMax = monthlyIncome * 0.39 - heatCost;
    const tdsMax = monthlyIncome * 0.44 - heatCost - monthlyDebts;
    const maxHousingPayment = Math.max(Math.min(gdsMax, tdsMax), 0);

    // Solve for max mortgage principal given the max monthly payment
    let maxPrincipal;
    if(r === 0){ maxPrincipal = maxHousingPayment * n; }
    else { maxPrincipal = maxHousingPayment * (Math.pow(1+r, n) - 1) / (r * Math.pow(1+r, n)); }

    const maxPrice = maxPrincipal + downPayment;

    out.maxPrice.textContent = isFinite(maxPrice) ? '$' + Math.round(Math.max(maxPrice,0)).toLocaleString() : '$0';
    out.maxPayment.textContent = '$' + Math.round(Math.max(maxHousingPayment,0)).toLocaleString() + ' / month';
    out.gdsNote.textContent = 'Based on 39% GDS / 44% TDS lending guidelines — an estimate, not a pre-approval.';
  }

  [income, debts, down, rate, amort, heat].forEach(el => el.addEventListener('input', calc));
  calc();
}

// ===== BC Property Transfer Tax (Land Transfer Tax) Calculator =====
function initLTTCalculator(){
  const price = document.getElementById('lPrice');
  const ftb = document.getElementById('lFtb');
  const newHome = document.getElementById('lNewHome');
  const out = {
    tax: document.getElementById('lTax'),
    exemption: document.getElementById('lExemption'),
    net: document.getElementById('lNet'),
  };
  if(!price) return;

  function baseTax(p){
    // BC Property Transfer Tax brackets
    let tax = 0;
    const t1 = Math.min(p, 200000);
    tax += t1 * 0.01;
    if(p > 200000){
      const t2 = Math.min(p, 2000000) - 200000;
      tax += t2 * 0.02;
    }
    if(p > 2000000){
      const t3 = Math.min(p, 3000000) - 2000000;
      tax += t3 * 0.03;
    }
    if(p > 3000000){
      const t4 = p - 3000000;
      tax += t4 * 0.05;
    }
    return tax;
  }

  function calc(){
    const p = parseFloat(price.value) || 0;
    const tax = baseTax(p);
    let exemption = 0;
    let note = 'No exemption applied.';

    if(ftb.checked && p <= 835000){
      // First Time Home Buyers' exemption: full exemption up to 500k, partial phase-out to 835k (approximation of current BC thresholds)
      if(p <= 500000){ exemption = tax; note = 'Full First-Time Buyer exemption applied.'; }
      else {
        const phaseOutRatio = Math.max(0, (835000 - p) / (835000 - 500000));
        exemption = tax * phaseOutRatio;
        note = 'Partial First-Time Buyer exemption applied (phases out between $500K–$835K).';
      }
    } else if(newHome.checked && p <= 1100000){
      if(p <= 1100000){ exemption = tax; note = 'Newly Built Home exemption applied (full or partial depending on final assessed value).'; }
    }

    const net = Math.max(tax - exemption, 0);
    out.tax.textContent = '$' + Math.round(tax).toLocaleString();
    out.exemption.textContent = '$' + Math.round(exemption).toLocaleString();
    out.net.textContent = '$' + Math.round(net).toLocaleString();
    document.getElementById('lNote').textContent = note;
  }

  [price, ftb, newHome].forEach(el => el.addEventListener('input', calc));
  calc();
}
