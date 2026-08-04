const sessionKey = 'little-stewarts-dm-mode';

if (sessionStorage.getItem(sessionKey) === 'unlocked') {
  document.documentElement.classList.add('dm-unlocked');
} else {
  window.location.replace('../../../index.html?dm=locked');
}
