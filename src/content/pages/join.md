---
title: Join the Community
slug: join
template: page
description: Ways to get involved and help shape the project during its alpha stage.
---

# Join the Community

We are only in the alpha stage, which means that there are many ways you can get involved to shape the future of this project.

<div class="box-grid">
  <div class="box">
    <h2>Alpha Tester</h2>
    <p>Is there a way you think you can help test or shape the system?</p>
    <p>What it means, what you can do. Sign-up form/email link.</p>
  </div>
  <div class="box">
    <h2>Contribute a book</h2>
    <p>We can handle the conversion process, or you can try it yourself as an alpha tester. Click for a form here to express interest.</p>
  </div>
  <div class="box">
    <h2>Request a Variant</h2>
    <p>We can handle the conversion process, or you can try it yourself as an alpha tester. Click for a form here to express interest.</p>
  </div>
  <div class="box">
    <h2>Accrediting Body</h2>
    <p>As our library grows with new variants, we want a system to help quality assure content. Could your organisation help quality-assure content, or do you have a suggestion of one that can? Nominate and express interest here.</p>
  </div>
  <div class="box">
    <h2>Contact Us</h2>
    <p>General inquiries</p>
  </div>
</div>

## Register your interest

If you'd like to get involved or hear more as the alpha develops, fill in the form below and we'll be in touch.

<!-- Submits to a Google Form. `name` attributes are the Google Form `entry.*`
     field ids (from its pre-filled link); the "I am" checkboxes share one id and
     use Google's `__other_option__` convention for the free-text "Other". -->
<form class="form" data-gform method="post" action="https://docs.google.com/forms/d/e/1FAIpQLSe_M86uPqBvrZAN5XK1HlSiS6lkgmbZeVQfADDc5fkow1Ce1w/formResponse">
  <div class="form__row">
    <div class="form__field">
      <label for="first-name">First name</label>
      <input type="text" id="first-name" name="entry.953194710" autocomplete="given-name" required />
    </div>
    <div class="form__field">
      <label for="last-name">Last name</label>
      <input type="text" id="last-name" name="entry.2097224968" autocomplete="family-name" required />
    </div>
  </div>
  <div class="form__field">
    <label for="email">Email</label>
    <input type="email" id="email" name="entry.1898684704" autocomplete="email" required />
  </div>
  <div class="form__field">
    <label for="role">Current role</label>
    <input type="text" id="role" name="entry.101676569" autocomplete="organization-title" />
  </div>
  <div class="form__field">
    <label for="organisation">Institution / organisation</label>
    <input type="text" id="organisation" name="entry.646749844" autocomplete="organization" />
  </div>
  <fieldset class="form__fieldset">
    <legend>I am… (select all that apply)</legend>
    <label class="form__check"><input type="checkbox" name="entry.2111608256" value="An author" /> An author</label>
    <label class="form__check"><input type="checkbox" name="entry.2111608256" value="An educator" /> An educator</label>
    <label class="form__check"><input type="checkbox" name="entry.2111608256" value="A student" /> A student</label>
    <label class="form__check"><input type="checkbox" name="entry.2111608256" value="A developer" /> A developer</label>
    <label class="form__check"><input type="checkbox" name="entry.2111608256" value="__other_option__" data-other-checkbox /> Other</label>
    <input type="text" class="form__other" name="entry.2111608256.other_option_response" data-other-input aria-label="Other — please specify" placeholder="Please specify" />
  </fieldset>
  <button type="submit" class="btn btn--primary">Register interest</button>
</form>
<p class="form__status" id="join-form-status" role="status" tabindex="-1" hidden>Thanks — we've received your details and we'll be in touch.</p>

<script>
  (function () {
    var form = document.querySelector('form[data-gform]');
    if (!form) return;
    var status = document.getElementById('join-form-status');
    var otherCheck = form.querySelector('[data-other-checkbox]');
    var otherInput = form.querySelector('[data-other-input]');

    // Keep "Other" and its text field in sync: Google needs the
    // __other_option__ value selected alongside the free-text answer.
    if (otherCheck && otherInput) {
      otherInput.addEventListener('input', function () {
        if (otherInput.value.trim() !== '') otherCheck.checked = true;
      });
      otherCheck.addEventListener('change', function () {
        if (!otherCheck.checked) otherInput.value = '';
      });
    }

    // Progressive enhancement: post in the background (Google Forms doesn't send
    // CORS headers, so the response is opaque) and keep the visitor on the page.
    // Native validation runs first, so this only fires for valid input. With JS
    // off, the form posts normally and lands on Google's confirmation page.
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      fetch(form.action, { method: 'POST', mode: 'no-cors', body: new FormData(form) })
        .then(function () {
          form.hidden = true;
          if (status) {
            status.hidden = false;
            status.focus();
          }
        })
        .catch(function () {
          if (status) {
            status.hidden = false;
            status.textContent =
              'Sorry — something went wrong sending the form. Please try again.';
            status.focus();
          }
        });
    });
  })();
</script>
