function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function isFullscreenSupported() {
  return Boolean(
    document.fullscreenEnabled
    || document.webkitFullscreenEnabled
    || document.documentElement.requestFullscreen
    || document.documentElement.webkitRequestFullscreen,
  );
}

function requestFullscreen(element) {
  if (element.requestFullscreen) {
    return element.requestFullscreen();
  }
  if (element.webkitRequestFullscreen) {
    return element.webkitRequestFullscreen();
  }
  return Promise.reject(new Error('Fullscreen not supported'));
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    return document.exitFullscreen();
  }
  if (document.webkitExitFullscreen) {
    return document.webkitExitFullscreen();
  }
  return Promise.reject(new Error('Fullscreen not supported'));
}

function updateToggleState(button) {
  const active = Boolean(getFullscreenElement());
  button.textContent = active ? '⤡' : '⛶';
  button.setAttribute('aria-label', active ? '전체 화면 종료' : '전체 화면');
  button.title = active ? '전체 화면 종료' : '전체 화면';
  button.setAttribute('aria-pressed', active ? 'true' : 'false');
  document.body.classList.toggle('is-fullscreen', active);
}

export function initFullscreenToggle(buttonId = 'fullscreen-toggle') {
  const button = document.getElementById(buttonId);
  if (!button) return;

  if (!isFullscreenSupported()) {
    button.hidden = true;
    return;
  }

  const onFullscreenChange = () => updateToggleState(button);

  button.addEventListener('click', () => {
    if (getFullscreenElement()) {
      exitFullscreen().catch(() => {});
      return;
    }

    requestFullscreen(document.documentElement).catch(() => {});
  });

  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  updateToggleState(button);
}
