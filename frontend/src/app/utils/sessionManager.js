export function saveSession(batchId, images, currentIndex) {
    localStorage.setItem('imagesData', JSON.stringify(imagesData));
}

export function loadSession() {
    const data = localStorage.getItem('imagesData');
    return data ? JSON.parse(data) : null;
}

export function clearSession() {
    localStorage.removeItem('imagesData');
}