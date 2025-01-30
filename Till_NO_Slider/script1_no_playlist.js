// songs = [
//     {songName: "Aaye Haaye (Official Video)  Karan Aujla, Nora Fatehi, Neha Kakkar, Jay Trak  Bhushan Kumar",   address:"assets/Songs/Aaye Haaye (Official Video)  Karan Aujla, Nora Fatehi, Neha Kakkar, Jay Trak  Bhushan Kumar.mp3"},
//     {songName: "Dhanda Nyoliwala  Russian Bandana (Music Video)  Deepesh Goyal  VYRL Haryanvi",                 address:"assets/Songs/Dhanda Nyoliwala  Russian Bandana (Music Video)  Deepesh Goyal  VYRL Haryanvi.mp3"},
//     {songName: "Ishq Ka Raja - Addy Nagar (Official Video)- Hamsar Hayat - New Hindi Songs 2022"   ,            address:"assets/Songs/Ishq Ka Raja - Addy Nagar (Official Video)- Hamsar Hayat - New Hindi Songs 2022.mp3"},
// ]
let songs = [];
let db = null;
let totalSongs = 0 ;
const request = indexedDB.open("songs", 1)
request.onupgradeneeded = e => {
    db = e.target.result
    db.createObjectStore("mysongs" , {keyPath: "hash"})
    console.log("upgrade is needed")
}
request.onsuccess = e => {
    db = e.target.result
    const transaction = db.transaction(["mysongs"], "readonly")
    const objectStore = transaction.objectStore("mysongs")
    console.log(objectStore)
    // show_allSongs(objectStore)
    console.log(e.target.result)
    // show_allSongs(db)
    console.log("there was success")
    make_list_from_DB();
}
request.onerror = () => {
    console.log("there was an error")
}
function addSongtoDB(file){
    let songBlob = new Blob([file], {type: file.type})
    let hashBlob = async (blob)=> {
        const arrayBuffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)  // returns low level 
        // convert array into 8 bits combinations (bytes)
        const uint8Array = new Uint8Array(hashBuffer)
        const byteArray = Array.from(uint8Array)
        const hexArray = byteArray.map(byte=> {
            return byte.toString(16).padStart(2, "0")
        });
        const hexString = hexArray.join('');
        return hexString;
    }
    hashBlob(songBlob).then((songHash) => {
        let transaction = db.transaction(["mysongs"], "readwrite")
        let objectStore = transaction.objectStore("mysongs")
        const song = {songName: file.name, audio: songBlob, id: totalSongs, hash:songHash}
        const request = objectStore.add(song)
        request.onsuccess = ()=> {
            totalSongs++;
            console.log("song has been added successfully")
            songs.push(song)
            console.log(totalSongs)
            // totalSongs++;
            console.log(totalSongs)
            update_items_from_Db();
        }
        request.onerror = (e)=> {
            alert("song already exists in the player list")
            console.log(e)
        }
    });
}
let input_File = document.getElementById("input-file")
input_File.addEventListener("change", (e)=> {
    const file = e.target.files[0]
    if (file) {
        addSongtoDB(file)
        e.target.value = ''
    }
})
let countAndProcessItems = ()=> {
    return new Promise ((resolve , reject) => {
        let tx = db.transaction(["mysongs"], "readonly");
        let objectStore = tx.objectStore("mysongs")
        let request = objectStore.openCursor();
        request.onsuccess = (e)=> {
            const cursor = e.target.result;
            // console.log(cursor)
            if (cursor){
                songs.push(cursor.value)
                /* console.log(cursor.value)       // cursor returns the value of the object that was stored in the database */
                totalSongs++;
                cursor.continue();
            } else {
                resolve (totalSongs)
                console.log(songs)
            }
        }
        request.onerror = ()=> {
            reject("error iterating through the object store")
        }
    });
}

async function make_list_from_DB() {
    try {
        const totalSongs = await countAndProcessItems(db , "mysongs");
        console.log("Total items" , totalSongs)
        show_allSongs();
    } catch (error ){
        console.log(error)
    }
}

function update_items_from_Db() {
    // let transaction = db.transaction(["mysong"], "readonly")
    // let objectStore = transaction.objectStore("mysongs")
    // let request = objectStore.get(7);
    // make_list_from_DB();
    let song_List_Container = document.getElementsByClassName("song-list");
        const li = document.createElement('li');

        const spanImg = document.createElement('span');
        const img = document.createElement('img');
        img.src = `assets/Covers/${2}.jpg`;
        img.alt = "";
        img.classList.add('song-cover');
        spanImg.appendChild(img);

        const spanName = document.createElement('span');
        spanName.classList.add('song-name');
        spanName.textContent = songs[totalSongs-1].songName;

        const icon = document.createElement('i');
        icon.classList.add('fa-solid', 'fa-2x', 'fa-circle-play', 'control-button', 'song-list-control-btn');
        icon.addEventListener('click', () => {
            SetAllIcons();  // Reset all icons to play state
            Play_from_song_List(totalSongs-1, icon);  // Call the function to play the song and update the icon
        });

        // Create an audio element to get the duration
        const tempAudio = new Audio(URL.createObjectURL(songs[totalSongs - 1].audio));
        const dur = document.createElement('span');
        dur.classList.add('song-duration');

        // Load the audio metadata and get the duration
        tempAudio.addEventListener('loadedmetadata', () => {
            const minutes = Math.floor(tempAudio.duration / 60);
            const seconds = Math.floor(tempAudio.duration % 60);
            dur.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        });

        li.appendChild(spanImg);
        li.appendChild(spanName);
        li.appendChild(dur);
        li.appendChild(icon);

        song_List_Container[0].appendChild(li);

}

setTimeout(()=> {
    console.log("for timeout")
}, 2000)

let masterPlay = document.getElementById("masterPlay");
let playPrevious = document.getElementById("playPrevious");
let playNext = document.getElementById("playNext")
let songIndex = 0 ;
// let audioElement = new Audio(URL.createObjectURL(songs[songIndex].audio));
let audioElement ;
function setAudio_for_first_use(){
    // LoopOption();
    audioElement = new Audio(URL.createObjectURL(songs[songIndex].audio));
}
let gif = document.getElementById("player-gif-inner")
let songDisplayList = document.getElementsByClassName("song-name");
let progressBar = document.getElementsByClassName("progress-bar")
let progress = 0;
let songlist_conrtolBtn = document.getElementsByClassName("song-list-control-btn");
let loopOption = document.getElementById("loopOption") /*Checks if user has clicked the loop option or shuffle option */
let loopIcon = document.getElementById("loop-icon")
let loop = true; /*User has true: loop or false: shuffle */
let repeatSong = document.getElementsByClassName("repeat-song")
let repeatSame = true;
let timeUpdateProgressBar = () => {
    audioElement.addEventListener("timeupdate", ()=>{
        progress = parseInt((audioElement.currentTime / audioElement.duration ) * 100);
        progressBar[0].value = progress;
        if (progressBar[0].value == 100){
            // if (loop == true){
                // playNext.click()
                // masterPlay.click()
                LoopOptionControl();
            // } else if (loop == false){}
        }
    })
}

let Play_from_song_List = (index, element)=> {
    // console.log(element)
    console.log(index)
    console.log(songs[index])

    let click_on_different_link = () => {
                audioElement.pause() // pause the previous song
                progressBar[0].value = 0 ;  // set the progress bar to zero
                songIndex = index;  // change the audio to new element
                audioElement = new Audio(URL.createObjectURL(songs[songIndex].audio))  // load the new song
                console.log("audio element loaded", audioElement)
                // audioElement.load()     // done loading
                audioElement.play() // play that song
                timeUpdateProgressBar();
                masterPlay.classList.replace('fa-circle-play', 'fa-circle-pause')   // change main button to play
                element.classList.replace('fa-circle-play', 'fa-circle-pause')      // change list button to play
                gif.setAttribute("src", "assets/try-cover-2.gif")
                return ;
            }
            if (!audioElement){
                setAudio_for_first_use();
            }
            if (!audioElement.paused){  // it is running
                if (index == songIndex ){    // user clicks on the same link
                    audioElement.pause()    // pause the song
                    element.classList.replace('fa-circle-pause', 'fa-circle-play')  // change the list player button to stop
                    gif.setAttribute("src", "assets/try-cover-2-pause.gif")
                    masterPlay.classList.replace('fa-circle-pause', 'fa-circle-play')   // change the main player button to stop
                    return ;
            } else {    // user clicks on the different link
                click_on_different_link();  // scenario if user clicks on different links
            }
        } else if (audioElement.paused){    // it is not running
            if (index == songIndex ){    // user clicks on the same link
                audioElement.play()    // pause the song
                timeUpdateProgressBar();
                masterPlay.classList.replace('fa-circle-play', 'fa-circle-pause')   // change the main player button to stop
                element.classList.replace('fa-circle-play', 'fa-circle-pause')  // change the list player button to stop
                gif.setAttribute("src", "assets/try-cover-2.gif")
                return ;
            } else {    // user clicks on the different link
                click_on_different_link();  // scenario if user clicks on different links
            }
        }
};


masterPlay.addEventListener('click', (e)=> {
    if (e.hasOwnProperty('index') && e.index !== undefined){
        Play_from_song_List(e.index, e.element)
    } else {
        if (!audioElement){
            setAudio_for_first_use();
        }
        if (audioElement.paused){
            masterPlay.classList.replace('fa-circle-play', 'fa-circle-pause')
            songlist_conrtolBtn.item(songIndex).classList.replace('fa-circle-play', 'fa-circle-pause')
            audioElement.play()
            timeUpdateProgressBar();
            gif.setAttribute("src", "assets/try-cover-2.gif")
        } else {
            masterPlay.classList.replace('fa-circle-pause', 'fa-circle-play')
            audioElement.pause()
            gif.setAttribute("src", "assets/try-cover-2-pause.gif")
            SetAllIcons()
        }
    }
})
progressBar[0].addEventListener('change' , ()=> {
    audioElement.currentTime = (progressBar[0].value * audioElement.duration) / 100
})
playNext.addEventListener('click', ()=> {
    masterPlay.classList.replace('fa-circle-pause', 'fa-circle-play')
    audioElement.pause()
    progressBar[0].value = 0 ;  // set the progress bar to zero
    songIndex = songIndex+1 % songs.length
    audioElement = new Audio(URL.createObjectURL(songs[songIndex].audio))
    audioElement.load()
    SetAllIcons()
})

playPrevious.addEventListener('click', ()=> {
    masterPlay.classList.replace('fa-circle-pause', 'fa-circle-play')
    audioElement.pause()
    songIndex = (songIndex-1)%songs.length
    if (songIndex < 0){
        songIndex = songIndex + songs.length
    }
    audioElement = new Audio(URL.createObjectURL(songs[songIndex].audio))
    progressBar[0].value = 0 ;  // set the progress bar to zero
    audioElement.load()
    SetAllIcons()
})

Array.from(songDisplayList).forEach((element, i) => {
    element.innerHTML = songs[i].songName
})

function SetAllIcons(){
    Array.from(songlist_conrtolBtn).forEach(e => {
            e.classList.replace('fa-circle-pause', 'fa-circle-play')
    })    
}
Array.from(songlist_conrtolBtn).forEach((e, i) => {
    e.addEventListener('click', ()=> {
        SetAllIcons();
        const customEvent = new Event('click'); 
        customEvent.index = i; // Attach the index to the event
        customEvent.element = e 
        masterPlay.dispatchEvent(customEvent); 
    })
})

function show_allSongs(){

    let song_List_Container = document.getElementsByClassName("song-list");

    for (let i = 0; i < songs.length; i++) {
        const li = document.createElement('li');

        const spanImg = document.createElement('span');
        const img = document.createElement('img');
        img.src = `assets/Covers/${i}.jpg`;
        img.alt = "";
        img.classList.add('song-cover');
        spanImg.appendChild(img);

        const spanName = document.createElement('span');
        spanName.classList.add('song-name');
        spanName.textContent = songs[i].songName;

        const icon = document.createElement('i');
        icon.classList.add('fa-solid', 'fa-2x', 'fa-circle-play', 'control-button', 'song-list-control-btn');
        icon.addEventListener('click', () => {
            SetAllIcons();  // Reset all icons to play state
            Play_from_song_List(i, icon);  // Call the function to play the song and update the icon
        });

        // Create an audio element to get the duration
        const tempAudio = new Audio(URL.createObjectURL(songs[i].audio));
        const dur = document.createElement('span');
        dur.classList.add('song-duration');

        // Load the audio metadata and get the duration
        tempAudio.addEventListener('loadedmetadata', () => {
            const minutes = Math.floor(tempAudio.duration / 60);
            const seconds = Math.floor(tempAudio.duration % 60);
            dur.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        });

        li.appendChild(spanImg);
        li.appendChild(spanName);
        li.appendChild(dur);
        li.appendChild(icon);

        song_List_Container[0].appendChild(li);
    }
}

// show_allSongs();
loopOption.addEventListener("click", ()=> {
    const parser = new DOMParser();
    const loopsvg = '<?xml version="1.0" encoding="UTF-8" ?><svg width="41" height="34px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000" stroke-width="1.5"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.25 12C1.25 6.06294 6.06294 1.25 12 1.25C17.9371 1.25 22.75 6.06294 22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12ZM11.9877 7.75C9.70121 7.75 7.9471 9.28219 7.74541 11.0835C7.69932 11.4951 7.32825 11.7914 6.91661 11.7453C6.50497 11.6992 6.20863 11.3282 6.25472 10.9165C6.556 8.22597 9.07599 6.25 11.9877 6.25C13.6578 6.25 15.1863 6.8937 16.2503 7.94689V7.5C16.2503 7.08579 16.5861 6.75 17.0003 6.75C17.4145 6.75 17.7503 7.08579 17.7503 7.5V9.12222C17.7503 9.86781 17.1459 10.4722 16.4003 10.4722H14.4941C14.0799 10.4722 13.7441 10.1364 13.7441 9.72222C13.7441 9.30801 14.0799 8.97222 14.4941 8.97222H15.1523C14.3818 8.23175 13.2617 7.75 11.9877 7.75ZM12.0123 16.25C14.158 16.25 16.03 14.4222 16.2529 11.9331C16.2899 11.5205 16.6543 11.216 17.0669 11.253C17.4794 11.2899 17.7839 11.6544 17.747 12.0669C17.467 15.1926 15.0648 17.75 12.0123 17.75C10.3037 17.75 8.79345 16.943 7.74967 15.6877V16.4004C7.74967 16.8146 7.41389 17.1504 6.99967 17.1504C6.58546 17.1504 6.24967 16.8146 6.24967 16.4004V14.2226C6.24967 13.477 6.85409 12.8726 7.59967 12.8726H9.50586C9.92007 12.8726 10.2559 13.2084 10.2559 13.6226C10.2559 14.0368 9.92007 14.3726 9.50586 14.3726H8.63282C9.42384 15.5314 10.6601 16.25 12.0123 16.25Z" fill="#000000"></path></svg>'
    const shufflesvg = '<?xml version="1.0" encoding="UTF-8"?><svg width="41px" height="34px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M22 6.99999C19 6.99999 13.5 6.99999 11.5 12.5C9.5 18 5 18 2 18" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M20 5C20 5 21.219 6.21895 22 7C21.219 7.78105 20 9 20 9" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M22 18C19 18 13.5 18 11.5 12.5C9.5 6.99999 5 7.00001 2 7" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M20 20C20 20 21.219 18.781 22 18C21.219 17.219 20 16 20 16" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>'
    if (loop == true){
        const svgDoc = parser.parseFromString(shufflesvg, "image/svg+xml")
        const svgElement = svgDoc.documentElement
        loopOption.innerHTML = '';
        loopOption.appendChild(svgElement)
        console.log("child appended")
        loop = false ;
    } else {
        const svgDoc = parser.parseFromString(loopsvg, "image/svg+xml")
        const svgElement = svgDoc.documentElement
        loopOption.innerHTML = ''
        loopOption.appendChild(svgElement)
        loop = true;
    }
})
let LoopOptionControl = ()=> {
    if (loop === true && !repeatSame){
        playNext.click()
        masterPlay.click()
    } else if (loop === true && repeatSame){
        masterPlay.click()
    } else if (loop === false /*&& !repeatSame*/) { 
        let rand = Math.floor(Math.random() * songs.length)
        console.log(rand);
        songlist_conrtolBtn.item(rand).click()
        // SetAllIcons();
        // let customEvent = new Event('click');
        // customEvent.index = rand;
        // customEvent.element = songlist_conrtolBtn.item(rand);
        // masterPlay.dispatchEvent(customEvent)
        console.log(songlist_conrtolBtn.item(rand))

        // Play_from_song_List(rand, )
    } 
}
repeatSong[0].addEventListener("click", ()=> {
    if (repeatSame){
        repeatSame = false;
        console.log("loop same set to false")
        repeatSong[0].classList.add("repeat-song-style")
    } else {
        repeatSame = true;
        console.log("loop same set to true")
        repeatSong[0].classList.remove("repeat-song-style")
    }
})

/* Handling Slider */
let slide_container = document.querySelector(".main-slider")
let slide_option = document.querySelector(".slide-option")
slide_option.addEventListener("click", ()=> {
    slide_container.classList.toggle("main-slider-hide")
    const slider_option_rect = slide_option.getBoundingClientRect();
    console.log(slider_option_rect)
    setTimeout(()=> {
        slide_option.classList.toggle("slide-hide-option")
    }, 170)
    console.log(slider_option_rect)
    console.log("clicked")
})
/**End slider */