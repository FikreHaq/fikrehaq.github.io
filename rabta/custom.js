  (function () {
    const form = document.getElementById('fhContactForm');
    const submitBtn = document.getElementById('fhSubmitBtn');
    const thankYouBox = document.getElementById('fhThankYouBox');
    const thankYouText = document.getElementById('fhThankYouText');
    const sendAnotherBtn = document.getElementById('fhSendAnotherBtn');
    const statusAlert = document.getElementById('fhStatusAlert');
    const nameInput = document.getElementById('senderName');

    if (!form || !submitBtn || !thankYouBox) return;

    function showAlert(msg) {
      statusAlert.textContent = msg;
      statusAlert.classList.add('is-visible');
    }

    function hideAlert() {
      statusAlert.textContent = '';
      statusAlert.classList.remove('is-visible');
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideAlert();

      const senderName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : '';
      const originalBtnHTML = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>پیغام بھیجا جا رہا ہے...</span><i class="fas fa-spinner fa-spin"></i>';

      try {
        const formData = new FormData(form);
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok && data.success) {
          form.reset();
          form.style.display = 'none';

          if (senderName) {
            thankYouText.textContent = 'محترم ' + senderName + '، آپ کا پیغام کامیابی کے ساتھ بھیج دیا گیا ہے۔ ہم جلد از جلد اس کا جائزہ لیں گے۔';
          } else {
            thankYouText.textContent = 'آپ کا پیغام کامیابی کے ساتھ بھیج دیا گیا ہے۔ ہم جلد از جلد اس کا جائزہ لیں گے۔';
          }

          thankYouBox.classList.add('is-visible');
          thankYouBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          showAlert(data.message || 'پیغام ارسال کرنے میں عارضی دشواری پیش آئی ہے۔ براہِ مہربانی چند لمحے بعد دوبارہ کوشش کریں۔');
        }
      } catch (err) {
        showAlert('انٹرنیٹ کنکشن یا سرور سے رابطے میں دشواری پیش آئی ہے۔ براہِ مہربانی دوبارہ کوشش کریں۔');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      }
    });

    if (sendAnotherBtn) {
      sendAnotherBtn.addEventListener('click', function () {
        thankYouBox.classList.remove('is-visible');
        hideAlert();
        form.style.display = 'block';
        if (nameInput) nameInput.focus();
      });
    }
  })();
