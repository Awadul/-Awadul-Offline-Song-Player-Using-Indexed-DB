const rangeInput = document.getElementById('input-range');

function updateRange() {
    const value = ((rangeInput.value - rangeInput.min) / (rangeInput.max - rangeInput.min)) * 100;
    rangeInput.style.background = `linear-gradient(to right, rgb(0,0,0),  rgb(156, 156, 92) ${value}%, black ${value}%)`;
}

updateRange(); // Initialize on page load