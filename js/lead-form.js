// Handles any form with class "leadForm"-style fields, submitting to /api/lead
// Works for the homepage contact form, sell.html valuation form, and contact.html
(function(){
  const forms = document.querySelectorAll('form[data-lead-source]');
  forms.forEach(function(form){
    const status = form.querySelector('.form-status');

    // Spam protection: stamp the moment this form became visible.
    // The server checks that enough time passed before treating a submission as human.
    const loadedAtField = form.querySelector('.form-loaded-at');
    if(loadedAtField) loadedAtField.value = Date.now();

    form.addEventListener('submit', async function(e){
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const original = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      const data = Object.fromEntries(new FormData(form).entries());
      data.source = form.getAttribute('data-lead-source');
      data.page = window.location.pathname;

      try {
        const res = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if(!res.ok) throw new Error('Request failed');
        if(status){
          status.textContent = "Thanks — I'll be in touch shortly.";
          status.className = 'form-status show ok';
        }
        form.reset();
      } catch(err){
        if(status){
          status.textContent = "Something went wrong sending that. Please call or email directly.";
          status.className = 'form-status show err';
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = original;
      }
    });
  });
})();
