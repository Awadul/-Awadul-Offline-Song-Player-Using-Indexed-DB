let input_File = document.getElementById("input-file");
input_File.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        addSongtoDB(file);
        e.target.value = '';
    }
});

let countAndProcessItems = () => {
    return new Promise((resolve, reject) => {
        let tx = db.transaction([db.objectStoreNames[0]], "readonly");
        let objectStore = tx.objectStore(db.objectStoreNames[0]);
        let request = objectStore.openCursor();
        request.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                songs.push(cursor.value);
                totalSongs++;
                cursor.continue();
            } else {
                resolve(totalSongs);
            }
        };
    });
};