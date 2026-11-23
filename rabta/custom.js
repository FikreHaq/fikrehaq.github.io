  (function () {
    const form = document.getElementById('fhContactForm');
    const submitBtn = document.getElementById('fhSubmitBtn');
    const thankYouBox = document.getElementById('fhThankYouBox');
    const thankYouHeading = document.getElementById('fhThankYouHeading');
    const thankYouText = document.getElementById('fhThankYouText');
    const sendAnotherBtn = document.getElementById('fhSendAnotherBtn');
    const statusAlert = document.getElementById('fhStatusAlert');
    const categorySelect = document.getElementById('messageCategory');
    const nameInput = document.getElementById('senderName');
    const emailInput = document.getElementById('senderEmail');
    const topicInput = document.getElementById('messageSubject');
    const messageInput = document.getElementById('senderMessage');
    const hiddenSubjectInput = document.getElementById('hiddenEmailSubject');

    if (!form || !submitBtn || !thankYouBox || !categorySelect) return;

    const originalBtnHTML = submitBtn.innerHTML;

    const categoryMessages = {
      'دینی مسئلہ': {
        heading: 'جزاک اللہ خیر! آپ کا دینی مسئلہ موصول ہو گیا ہے',
        body: 'آپ کا دینی مسئلہ علماء کرام کی بارگاہ میں پیش کیا جائے گا اور جلد ہی اس کا جواب ویب سائٹ پر یا براہِ راست آپ کے درست ای میل پر ارسال کیا جائے گا ان شاء اللہ تعالیٰ عزوجل۔ آپ کا ای میل منتظمین کے علاوہ کوئی نہیں دیکھے گا۔'
      },
      'ویب سائٹ کی شکایت': {
        heading: 'جزاک اللہ خیر! آپ کی شکایت موصول ہو گئی ہے',
        body: 'ویب سائٹ کے حوالے سے آپ کی اطلاع موصول ہو گئی ہے۔ منتظمین جلد اس کا جائزہ لے کر درپیش دشواری کو دور کرنے کی کوشش کریں گے ان شاء اللہ تعالیٰ عزوجل۔'
      },
      'ویب سائٹ میں ترمیم': {
        heading: 'جزاک اللہ خیر! آپ کی ترمیمی تجویز موصول ہو گئی ہے',
        body: 'ویب سائٹ میں ترمیم کے لیے آپ کی گزارش موصول ہو گئی ہے۔ ہم مناسب جائزے کے بعد ضروری اصلاح و ترمیم عمل میں لائیں گے ان شاء اللہ تعالیٰ عزوجل۔'
      },
      'ویب سائٹ میں اضافہ': {
        heading: 'جزاک اللہ خیر! آپ کی تجویز برائے اضافہ موصول ہو گئی ہے',
        body: 'ویب سائٹ میں نئے اضافے کے حوالے سے آپ کی رائے موصول ہو گئی ہے۔ منتظمین اس کا جائزہ لے کر مفید اضافوں کو شامل کرنے کی کوشش کریں گے ان شاء اللہ تعالیٰ عزوجل۔'
      },
      'نئے بیان کی اطلاع': {
        heading: 'جزاک اللہ خیر! نئے بیان کی اطلاع موصول ہو گئی ہے',
        body: 'نئے بیان سے متعلق آپ کی اطلاع موصول ہو گئی ہے۔ ہم اس کا جائزہ لے کر مواد کو مزید بہتر و منظم بنانے کی کوشش کریں گے ان شاء اللہ تعالیٰ عزوجل۔'
      },
      'نیا بیان شریف شامل کروانے کی درخواست': {
        heading: 'جزاک اللہ خیر! بیان شریف شامل کروانے کی درخواست موصول ہو گئی ہے',
        body: 'نیا بیان شریف ویب سائٹ پر شامل کروانے کی آپ کی درخواست موصول ہو گئی ہے۔ منتظمین اس کا جائزہ لے کر شمولیت کی مناسب صورت نکالیں گے ان شاء اللہ تعالیٰ عزوجل۔'
      }
    };

    function showAlert(msg) {
      statusAlert.textContent = msg;
      statusAlert.classList.add('is-visible');
    }

    function hideAlert() {
      statusAlert.textContent = '';
      statusAlert.classList.remove('is-visible');
    }

    function buildThankYouMessage(senderName, category) {
      const config = categoryMessages[category] || {
        heading: 'جزاک اللہ خیر! آپ کا پیغام موصول ہو گیا ہے',
        body: 'آپ کا پیغام کامیابی کے ساتھ بھیج دیا گیا ہے۔ ہم جلد از جلد اس کا جائزہ لیں گے ان شاء اللہ تعالیٰ عزوجل۔'
      };

      const greeting = senderName ? 'محترم ' + senderName + '، ' : '';
      return {
        heading: config.heading,
        body: greeting + config.body
      };
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideAlert();

      const selectedCategory = categorySelect.value.trim();
      const senderName = nameInput ? nameInput.value.trim() : '';
      const senderEmail = emailInput ? emailInput.value.trim() : '';
      const senderTopic = topicInput ? topicInput.value.trim() : '';
      const senderMessage = messageInput ? messageInput.value.trim() : '';

      if (!selectedCategory || !senderName || !senderEmail || !senderTopic || !senderMessage) {
        showAlert('براہِ مہربانی پیغام کی نوعیت منتخب کریں اور تمام مطلوبہ خانے درست طریقے سے پُر کریں۔');
        return;
      }

      if (hiddenSubjectInput) {
        hiddenSubjectInput.value = 'فکر حق ویب سائٹ [' + selectedCategory + ']: ' + senderTopic;
      }

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
          const msgContent = buildThankYouMessage(senderName, selectedCategory);

          form.reset();
          form.style.display = 'none';

          thankYouHeading.textContent = msgContent.heading;
          thankYouText.textContent = msgContent.body;

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
        if (categorySelect) categorySelect.focus();
      });
    }
  })();
