function initGrid() {
    const grid = document.getElementById('grid');
    if(!grid) return;
    grid.innerHTML = '';
    let items = ['🦄', '🦄', '🦄', '🌸', '✨', '🍭', '🎀', '🌈', '🍓'];
    items.sort(() => Math.random() - 0.5);
    items.forEach(emoji => {
        const div = document.createElement('div');
        div.className = 'grid-item';
        div.innerHTML = emoji;
        div.onclick = () => div.classList.toggle('selected');
        grid.appendChild(div);
    });
}

function checkTest() {
    const selected = document.querySelectorAll('.grid-item.selected');
    let correct = selected.length === 3;
    selected.forEach(item => { if(item.innerHTML !== '🦄') correct = false; });

    if(correct) {
        window.location.href = 'tanisma.html';
    } else {
        alert("Robot olmadığını biliyorum, tekrar dene.🦄");
        initGrid();
    }
}

function saveName() {
    const name = document.getElementById('user-name-input').value;
    if(name) {
        localStorage.setItem('userName', name); // İsmi hafızaya al
        window.location.href = 'anasayfa.html';
    }
}