  (function () {
    const form = document.getElementById('fhContactForm');
    const submitBtn = document.getElementById('fhSubmitBtn');
    const thankYouBox = document.getElementById('fhThankYouBox');
    const thankYouText = document.getElementById('fhThankYouText');
    const sendAnotherBtn = document.getElementById('fhSendAnotherBtn');
    const statusAlert = document.getElementById('fhStatusAlert');
    const nameInput = document.getElementById('senderName');

    if (!form || !submitBtn || !thankYouBox) return;

    let isSubmitting = false;
    let currentSenderName = '';
    const originalBtnHTML = submitBtn.innerHTML;

    function showAlert(msg) {
      statusAlert.textContent = msg;
      statusAlert.classList.add('is-visible');
    }

    function hideAlert() {
      statusAlert.textContent = '';
      statusAlert.classList.remove('is-visible');
    }

    form.addEventListener('submit', function () {
      hideAlert();
      isSubmitting = true;
      currentSenderName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : '';

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>پیغام بھیجا جا رہا ہے...</span><i class="fas fa-spinner fa-spin"></i>';
    });

    window.addEventListener('message', function (event) {
      if (!isSubmitting) return;
      isSubmitting = false;

      form.reset();
      form.style.display = 'none';

      if (currentSenderName) {
        thankYouText.textContent = 'محترم ' + currentSenderName + '، آپ کا پیغام کامیابی کے ساتھ بھیج دیا گیا ہے۔ ہم جلد از جلد اس کا جائزہ لیں گے۔';
      } else {
        thankYouText.textContent = 'آپ کا پیغام کامیابی کے ساتھ بھیج دیا گیا ہے۔ ہم جلد از جلد اس کا جائزہ لیں گے۔';
      }

      thankYouBox.classList.add('is-visible');
      thankYouBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML;
    });

    // اگر iframe لوڈ ہو جائے (عام صورت میں FormSubmit کا رسپانس آنے پر)
    const iframe = document.getElementById('fhSubmitFrame');
    if (iframe) {
      iframe.addEventListener('load', function () {
        if (!isSubmitting) return;
        isSubmitting = false;

        form.reset();
        form.style.display = 'none';

        if (currentSenderName) {
          thankYouText.textContent = 'محترم ' + currentSenderName + '، آپ کا پیغام کامیابی کے ساتھ بھیج دیا گیا ہے۔ ہم جلد از جلد اس کا جائزہ لیں گے۔';
        } else {
          thankYouText.textContent = 'آپ کا پیغام کامیابی کے ساتھ بھیج دیا گیا ہے۔ ہم جلد از جلد اس کا جائزہ لیں گے۔';
        }

        thankYouBox.classList.add('is-visible');
        thankYouBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      });
    }

    if (sendAnotherBtn) {
      sendAnotherBtn.addEventListener('click', function () {
        thankYouBox.classList.remove('is-visible');
        hideAlert();
        form.style.display = 'block';
        if (nameInput) nameInput.focus();
      });
    }
  })();
