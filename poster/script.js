// YONO Bank Poster Interactive Logic

document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const themeText = document.getElementById('themeText');
  const body = document.body;

  let isLight = false;

  themeToggleBtn.addEventListener('click', () => {
    isLight = !isLight;
    if (isLight) {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
      themeIcon.textContent = '☀️';
      themeText.textContent = 'Toggle Dark Theme';
    } else {
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
      themeIcon.textContent = '🌙';
      themeText.textContent = 'Toggle Light Theme';
    }
  });

  console.log('YONO Bank Project Poster initialized successfully.');
});
