// songs = [
    //     {songName: "Aaye Haaye (Official Video)  Karan Aujla, Nora Fatehi, Neha Kakkar, Jay Trak  Bhushan Kumar",   address:"assets/Songs/Aaye Haaye (Official Video)  Karan Aujla, Nora Fatehi, Neha Kakkar, Jay Trak  Bhushan Kumar.mp3"},
    //     {songName: "Dhanda Nyoliwala  Russian Bandana (Music Video)  Deepesh Goyal  VYRL Haryanvi",                 address:"assets/Songs/Dhanda Nyoliwala  Russian Bandana (Music Video)  Deepesh Goyal  VYRL Haryanvi.mp3"},
    //     {songName: "Ishq Ka Raja - Addy Nagar (Official Video)- Hamsar Hayat - New Hindi Songs 2022"   ,            address:"assets/Songs/Ishq Ka Raja - Addy Nagar (Official Video)- Hamsar Hayat - New Hindi Songs 2022.mp3"},
// ]



/**Utitity Functions */
function openSongsConnection(){
    return new Promise((resolve, reject)=> {
        request = indexedDB.open("songs")
        request.onsuccess = (e) => {
            db = e.target.result
            resolve(db)
        }
    })
}
function openPlaylistConnection() {
    return new Promise((resolve, reject)=> {
        let playlistDB_request = indexedDB.open("playlists")
        playlistDB_request.onsuccess = (event)=> {
            resolve(event.target.result)
        }
        playlistDB_request.onerror = (e)=> {
            reject(e.target.result.close())
        }
    })
}

/**End untility Functions */

let songs = [];
let songIndex = 0 ;
let totalSongs = 0 ;
let audioElement ;

let masterPlay = document.getElementById("masterPlay");
let playPrevious = document.getElementById("playPrevious");
let playNext = document.getElementById("playNext")
let gif = document.getElementById("player-gif-inner")
let songDisplayList = document.getElementsByClassName("song-name");
let progressBar = document.getElementsByClassName("progress-bar")
let progress = 0;
let songlist_conrtolBtn = document.getElementsByClassName("song-list-control-btn");
let loopOption = document.getElementById("loopOption") /*Checks if user has clicked the loop option or shuffle option */
let loopIcon = document.getElementById("loop-icon")
let loop = true; /*User has true: loop or false: shuffle */
let repeatSong = document.querySelector(".repeat-song")
let repeatSame = true;


function setAudio_for_first_use(){
    audioElement = new Audio(URL.createObjectURL(songs[songIndex].audio));
}

function first_load_songs_display(){
    let request ;
    request = indexedDB.open("songs")
    request.onupgradeneeded = (e) => {
        db = e.target.result
        db.createObjectStore("mysongs" , {keyPath: "hash"})
        let customEvent = new Event("click");
        customEvent.playlist_name = "mysongs";
        addPlaylistButton.dispatchEvent(customEvent);
    }
    request.onsuccess = (e) => {
        db = e.target.result
        if (db.objectStoreNames[0] !== undefined){
            make_list_from_DB();
        }
        e.target.result.close();
    }
    request.onerror = (e) => {
        console.log("can't open database for use in first_load_songs_display()", e)
    }
}
first_load_songs_display();

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
        let songs_obj_Name ;
        openSongsConnection().then((db)=> {
            songs_obj_Name = db.objectStoreNames[0];
            if(songs_obj_Name !== undefined ){
                let transaction = db.transaction([db.objectStoreNames[0]], "readwrite")
                let objectStore = transaction.objectStore(db.objectStoreNames[0])
                const song = {songName: file.name, audio: songBlob, id: totalSongs, hash:songHash}
                const request = objectStore.add(song)
                request.onsuccess = ()=> {
                    totalSongs++;
                    songs.push(song)
                    update_items_from_Db();
                    db.close()
                }
                request.onerror = (e)=> {
                    db.close()
                    // alert("song already exists in the player list")
                    console.log(e)
                };
            } else {
                alert("choose a database")
            }
        });
        openPlaylistConnection().then((db)=> {
            // console.log("adding song in obj store [0] ", songs_obj_Name)
            if (db.objectStoreNames.contains(songs_obj_Name)){
                let transaction = db.transaction([songs_obj_Name], "readwrite")
                let objectStore = transaction.objectStore(songs_obj_Name)
                const song = {songName: file.name, audio: songBlob, id: totalSongs, hash:songHash}
                const request = objectStore.add(song)
                request.onsuccess = ()=> {
                    console.log("song has been added successfully in plalilst db")
                    db.close()
                }
                request.onerror = (e)=> {
                    alert("song already exists in the player list")
                    console.log(e)
                    db.close()
                }
            } else {
                console.log("can't find respective object store")
                db.close();
            }
        });
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
        let tx = db.transaction([db.objectStoreNames[0]], "readonly");
        let objectStore = tx.objectStore(db.objectStoreNames[0])
        let request = objectStore.openCursor();
        request.onsuccess = (e)=> {
            const cursor = e.target.result;
            if (cursor){
                songs.push(cursor.value)
                totalSongs++;
                cursor.continue();
            } else {
                resolve (totalSongs)
                // console.log(songs)
            }
        }
        request.onerror = ()=> {
            reject("error iterating through the object store")
        }
    });
}

async function make_list_from_DB() {
    try {
        const totalSongs = await countAndProcessItems(db , db.objectStoreNames[0]);
        console.log("Total items" , totalSongs)
        show_allSongs();
    } catch (error ){
        console.log(error)
    }
}

function update_items_from_Db() {
    show_allSongs(songs[totalSongs-1])
}

let timeUpdateProgressBar = () => {
    audioElement.addEventListener("timeupdate", ()=>{
        progress = parseInt((audioElement.currentTime / audioElement.duration ) * 100);
        progressBar[0].value = progress;
        progressBar[0].style.background = `linear-gradient(to right, rgb(0,0,0),  rgb(156, 156, 92) ${progress}%, black ${progress}%)`;
        if (progressBar[0].value == 100){
                LoopOptionControl();
        }
    })
}

let Play_from_song_List = (index, element) => {
    console.log(index);
    console.log(songs[index]);

    let click_on_different_link = () => {
        audioElement.pause(); // pause the previous song
        progressBar[0].value = 0;  // set the progress bar to zero
        songIndex = index;  // change the audio to new element
        audioElement = new Audio(URL.createObjectURL(songs[songIndex].audio));  // load the new song
        audioElement.play(); // play that song
        timeUpdateProgressBar();
        masterPlay.classList.replace('fa-circle-play', 'fa-circle-pause');  // change main button to play
        element.classList.replace('fa-circle-play', 'fa-circle-pause');  // change list button to play
        gif.setAttribute("src", "assets/try-cover-5.gif");
        return;
    }

    if (!audioElement) {
        setAudio_for_first_use();
    }

    if (!audioElement.paused) {  // it is running
        if (index == songIndex) {  // user clicks on the same link
            audioElement.pause();  // pause the song
            element.classList.replace('fa-circle-pause', 'fa-circle-play');  // change the list player button to stop
            gif.setAttribute("src", "assets/try-cover-5-pause.gif");
            masterPlay.classList.replace('fa-circle-pause', 'fa-circle-play');  // change the main player button to stop
            return;
        } else {  // user clicks on a different link
            click_on_different_link();  // scenario if user clicks on different links
        }
    } else if (audioElement.paused) {  // it is not running
        if (index == songIndex) {  // user clicks on the same link
            audioElement.play();  // play the song
            timeUpdateProgressBar();
            masterPlay.classList.replace('fa-circle-play', 'fa-circle-pause');  // change the main player button to play
            element.classList.replace('fa-circle-play', 'fa-circle-pause');  // change the list player button to play
            gif.setAttribute("src", "assets/try-cover-5.gif");
            return;
        } else {  // user clicks on a different link
            click_on_different_link();  // scenario if user clicks on different links
        }
    }
};

let togglePlayPause = (toToggle) => {
    if (audioElement.paused) {
        toToggle.classList.toggle("fa-circle-play");
        toToggle.classList.toggle("fa-circle-pause");
        audioElement.play();
        timeUpdateProgressBar();
        gif.setAttribute("src", "assets/try-cover-5.gif");
    } else {
        toToggle.classList.toggle("fa-circle-pause");
        toToggle.classList.toggle("fa-circle-play");
        audioElement.pause();
        gif.setAttribute("src", "assets/try-cover-5-pause.jpg");
        SetAllIcons();
    }
};

masterPlay.addEventListener('click', (e)=> {
    if (e.hasOwnProperty('index') && e.index !== undefined){
        Play_from_song_List(e.index, e.element)
    } else {
        if (!audioElement){
            setAudio_for_first_use();
        }
        togglePlayPause(masterPlay)
        togglePlayPause(song_List_Container.item(songIndex))
    }
})

progressBar[0].addEventListener('change' , ()=> {
    audioElement.currentTime = (progressBar[0].value * audioElement.duration) / 100
    progressBar[0].style.background = `linear-gradient(to right, rgb(0,0,0),  rgb(156, 156, 92) ${progress}%, black ${progress}%)`;
})
playNext.addEventListener('click', ()=> {
    masterPlay.classList.replace('fa-circle-pause', 'fa-circle-play')
    audioElement.pause()
    progressBar[0].value = 0 ;  // set the progress bar to zero
    songIndex = (songIndex+1) % songs.length
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

function songs_UI_generator (song_List_Container , song , i){
    // Clear the container before adding new songs
    // song_List_Container.innerHTML = ''; 

    // songs.forEach((song, i) => {
        const li = document.createElement('li');

        const DeleteDiv = document.createElement("div")
        const deleteIcon = document.createElement("i")
        const spanImg = document.createElement('span');
        const img = document.createElement('img');


        DeleteDiv.classList.add("delete-div-song")
        deleteIcon.classList.add("fa-solid", "fa-trash", "delete-icon")
        DeleteDiv.appendChild(deleteIcon)

        // song_List_Container.appendChild(playlistDiv)
        li.appendChild(DeleteDiv)
        li.onmouseover = ()=> {
            DeleteDiv.classList.add("visible")
        }
        li.onmouseout = ()=> {
            DeleteDiv.classList.remove("visible")
        }
        DeleteDiv.addEventListener(("click") , (event)=> {
            let liParent = event.target.parentNode.parentNode;
            let li_songName = liParent.children[2].innerText.replaceAll(" ", "");
            let currentPlaylist ;
            console.log("trying to delete song")
            console.log(event.target.parentNode.parentNode)
            // event.target.parentNode.parentNode.remove()
            openSongsConnection().then((db)=> {
                return new Promise((resolve , reject) => {
                    currentPlaylist = db.objectStoreNames[0]
                    let tx = db.transaction([currentPlaylist], "readwrite")
                    let objectStore = tx.objectStore(currentPlaylist)
                    let cursorRequest = objectStore.openCursor();
                    console.log("current songs playlist" , currentPlaylist)
                    cursorRequest.onsuccess = (e)=> {
                        let cursor = e.target.result
                        if (cursor){
                            if (cursor.value.songName.replaceAll(" ", "") == li_songName){
                                console.log("item deleted from song database successfully")
                                songs.splice(songs.indexOf(cursor.value), 1)
                                totalSongs--;
                                cursor.delete();
                                event.target.parentNode.parentNode.remove()
                                db.close();
                                resolve();
                                // From here of the promise it does not goes to the next then 
    
                            } else {
                                cursor.continue();
                            }
                        } else {
                            db.close();
                            console.log("cursor ended temp")
                            resolve();
                        }
                    }
                    cursorRequest.onerror = (e)=> {
                        db.close();
                        reject("there was error opening the cursor on the object in songs database", e)
                    }
                })
                // console.log("object store of playlist delete" , objectStore)
            }).then(()=> {
                openPlaylistConnection().then((playlist_db)=> {
                    let tx = playlist_db.transaction([currentPlaylist] , "readwrite")
                    let objectStore = tx.objectStore(currentPlaylist)
                    let cursorRequest = objectStore.openCursor();
                    console.log("to delete also from playlist DB")
                    console.log(currentPlaylist)
                    cursorRequest.onsuccess = (event)=> {
                        let cursor = event.target.result
                        if (cursor){
                            if (cursor.value.songName.replaceAll(" ", "") == li_songName){                                
                                console.log("item deleted from playlist database successfully")
                                console.log(cursor.value)
                                let deleteRequest = cursor.delete()
                                deleteRequest.onsuccess = ()=> {
                                    console.log("cursor deleted successfuly")
                                    playlist_db.close();
                                }
                            } else {
                                cursor.continue();
                            }
                        } else {
                            console.log("cursor ended on deleting from playlist")
                            playlist_db.close();
                        }
                    }
                    cursorRequest.onerror = (e)=> {
                        playlist_db.close();
                        alert("couldn't open cursor on playlist for delete", e)
                    }
                })
            }).catch((e)=> {
                console.log("coming to playlist for delete throws an error ", e)
            })
        })


        img.src = `assets/Covers/${i}.jpg`; // Make sure this file exists
        img.alt = "";
        img.classList.add('song-cover');
        spanImg.appendChild(img);

        const spanName = document.createElement('span');
        spanName.classList.add('song-name');
        spanName.textContent = song.songName;

        const icon = document.createElement('i');
        icon.classList.add('fa-solid', 'fa-2x', 'fa-circle-play', 'control-button', 'song-list-control-btn');
        icon.addEventListener('click', () => {
            SetAllIcons();  // Reset all icons to play state
            Play_from_song_List(i, icon);  // Call the function to play the song and update the icon
        });

        // Create an audio element to get the duration
        const tempAudio = new Audio(URL.createObjectURL(song.audio));
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

        song_List_Container.appendChild(li);
    // });
}
/**show_allSongs() start here */
function show_allSongs(song_Added) {
    let song_List_Container = document.querySelector(".song-list");
    
    if (song_Added !== undefined) {// song is not added
        songs_UI_generator(song_List_Container,song_Added , songs.length - 1)
    }  else {
        song_List_Container.innerHTML = ''; 
        songs.forEach((song, i) => {
            songs_UI_generator(song_List_Container, song , i)   
        })
        songIndex = 0;
        setAudio_for_first_use();
    }
}
/**show_allSongs() ended here */

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
repeatSong.addEventListener("click", ()=> {
    if (repeatSame){
        repeatSame = false;
        console.log("loop same set to false")
        repeatSong.classList.add("repeat-song-style")
    } else {
        repeatSame = true;
        console.log("loop same set to true")
        repeatSong.classList.remove("repeat-song-style")
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



/** Handling playlist add  */
let addPlaylistButton = document.querySelector(".add-playlist");

addPlaylistButton.addEventListener("click", (event) => {
    let newObjectSource;
    let playList_version;

    function Take_input() {
        return new Promise((resolve, reject) => {
            let check = event.hasOwnProperty("playlist_name");
            if (!check) {
                newObjectSource = prompt("Enter the name of the playlist::", "none");
                if (newObjectSource !== null && newObjectSource != undefined && newObjectSource !== ""){
                    openPlaylistConnection().then((db) => {
                        playList_version = db.version;
                        let objStore_exists = db.objectStoreNames.contains(newObjectSource);
                        if (objStore_exists) {
                            alert("Playlist with this name already exists.");
                            db.close();
                            reject();
                        } else {
                            db.close();
                            resolve();
                        }
                    }).catch((error) => {
                        console.log("There was an error opening the Database");
                        reject(error);
                    });
                } else {
                    alert("can't set null object store")
                    reject();
                }
            } else {
                newObjectSource = event.playlist_name;
                resolve();
            }
        });
    }

    Take_input().then(() => {
        function updatePlaylistDb() {
            return new Promise((resolve, reject) => {
                let updatedplaylists = indexedDB.open("playlists", playList_version + 1);
                updatedplaylists.onupgradeneeded = (event) => {
                    let playlistDB = event.target.result;
                    if (!playlistDB.objectStoreNames.contains(newObjectSource)) {
                        playlistDB.createObjectStore(newObjectSource, { keyPath: "hash" });
                        Display_Playlist(newObjectSource);
                    } else {
                        alert("Playlist already exists.");
                        reject();
                    }
                };
                updatedplaylists.onsuccess = (event) => {
                    playList_version = parseInt(event.target.result.version);
                    event.target.result.close();
                    resolve();
                };
                updatedplaylists.onerror = (event) => {
                    reject("Error updating playlists database");
                };
            });
        }

        updatePlaylistDb().then(() => {
            /** update songs db */
            openSongsConnection().then((db) => {
                return new Promise((resolve, reject) => {
                    if (!db.objectStoreNames.length) {
                        let db_version = db.version;
                        db.close();
                        resolve({ db_version, createNewObject: true });
                    } else {
                        db.close();
                        reject("Songs DB already contains object stores");
                    }
                });
            }).then((neededObj) => {
                if (neededObj.createNewObject) {
                    let songsDB = indexedDB.open("songs", neededObj.db_version + 1);
                    songsDB.onupgradeneeded = (e) => {
                        let db = e.target.result;
                        db.createObjectStore(newObjectSource, { keyPath: "hash" });
                        console.log("New Object Source in songs created to fill space for empty songs DB");
                    };
                    songsDB.onsuccess = () => {
                        console.log("Songs DB updated successfully");
                    };
                    songsDB.onerror = (e) => {
                        console.log("Error in creating object store in songs:", e);
                    };
                }
            }).catch((e) => {
                console.log("No need to create a new object store in songs DB:", e);
            });
        }).catch((e) => {
            console.log("There was an error in updating the playlist DB:", e);
        });
    }).catch((e) => {
        console.log("There was an error in the input step:", e);
    });
});

/**End playlist add */

/** Handling songs swap */

/**Handing Display of playlists */
/**function swapObectStores() */
function swapObectStores(playlistName, songDB_ver,songObj_Name , playlistSongs){
    return new Promise ((resolve, reject)=> {
        let songsDB = indexedDB.open("songs", songDB_ver + 1)
        songsDB.onupgradeneeded = (e)=> {
            db = e.target.result;
            if (db.objectStoreNames[0] !== undefined){
                db.deleteObjectStore(songObj_Name)
            }
            let SwappedObject = db.createObjectStore(playlistName, {keyPath: "hash"});
            for (let key of playlistSongs){
                SwappedObject.add(key)
            }
        }
        songsDB.onsuccess = (e)=> {
            e.target.result.close();
            console.log("successfully swapped songs")
            resolve();
        }
        songsDB.onerror = (event)=> {
            console.log("there was an error in opening songsDB for swapping", event.target.value)
            reject("couldn't open new object store in songs database for swap");
        }
    })
}
let Display_Playlists_Div = document.querySelector(".playlists-container")
let toggle_All_Playlist_Animation = () => {
    Array.from(Display_Playlists_Div.children).forEach((element)=> {
        element.classList.remove("playlist-animation")
    })
}

function Display_Playlist(playlistName) {
    const playlistDiv = document.createElement("div")
    const DeleteDiv = document.createElement("div")
    const text_container = document.createElement("div")
    const text = document.createElement("p")
    const deleteIcon = document.createElement("i")
    playlistDiv.classList.add("playlist", "playlist-item")
    DeleteDiv.classList.add("delete-div-playlist")
    deleteIcon.classList.add("fa-solid", "fa-trash", "delete-icon")
    text_container.appendChild(text);
    text_container.classList.add("playlist-text-container")
    DeleteDiv.appendChild(deleteIcon)
    text.innerText = playlistName
    playlistDiv.appendChild(DeleteDiv)
    playlistDiv.appendChild(text_container)

    Display_Playlists_Div.appendChild(playlistDiv)

    playlistDiv.onmouseover = ()=> {
        DeleteDiv.classList.add("visible")
    }
    playlistDiv.onmouseout = ()=> {
        DeleteDiv.classList.remove("visible")
    }
    deleteIcon.addEventListener("click", (e)=> {
        e.stopPropagation();
        e.target.parentNode.click();
    })
    DeleteDiv.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevent click from reaching `playlistDiv`
        console.log(event)
        console.log("Delete action triggered", event.target.nextSibling.innerText); // Add delete functionality here
        let playlistVer = 0;
        let objectStore ;
        openPlaylistConnection().then((db)=> {
            return new Promise((resolve , reject)=> {
                playlistVer = db.version
                db.close();
                resolve();
            })
        }).then(() => {
            let playlist = indexedDB.open("playlists", playlistVer + 1)
            playlist.onupgradeneeded = (e)=> {
                playlist_db = e.target.result
                objectStore = event.srcElement.nextSibling.innerText
                playlist_db.deleteObjectStore(event.srcElement.nextSibling.innerText);
                console.log(event)
                playlist_db.close();
                console.log(event.target.parentElement)
                event.target.parentElement.remove()
                // let toremove = document.querySelector(".remove")
                // Display_Playlists_Div.remove(toremove)
            }
        })
        
        let songlistVer = 0;
        openSongsConnection().then((db)=> {
            return new Promise((resolve , reject)=> {
                songlistVer = db.version
                db.close();
                resolve();
            })
        }).then(() => {
            let songlist = indexedDB.open("songs", songlistVer + 1)
            songlist.onupgradeneeded = (e)=> {
                songlistdb = e.target.result
                songlistdb.deleteObjectStore(objectStore);
                console.log(event)
                songlistdb.close();
                // console.log(event.target.parentElement)
                event.target.parentElement.remove()
                // let toremove = document.querySelector(".remove")
                // Display_Playlists_Div.remove(toremove)
            }
        })
    });

    text_container.addEventListener("click", (event)=> {
        toggle_All_Playlist_Animation();
        event.target.parentNode.classList.add("playlist-animation")
        console.log(event.target.innerHTML)
        playlistName = (event.target.children)[0].innerText
        console.log(playlistName)
        let songDB_ver = 0;
        let songObjectName ;

        console.log("empty for playlist", songs)
        openSongsConnection().then((db)=> {
            songDB_ver = db.version
            songObjectName = db.objectStoreNames[0]
            console.log("there are objectstores in songs db ", songObjectName)
            db.close();

            openPlaylistConnection().then((playlist_db)=> {
                let tx = playlist_db.transaction([playlistName], "readonly")
                let objectStore = tx.objectStore(playlistName)
                let tempSongs = []
                let cursorRequest = objectStore.openCursor();
                songs = []
                totalSongs = 0;
                cursorRequest.onsuccess = (e)=> {
                    cursor = e.target.result;
                    if (cursor){
                        tempSongs.push(cursor.value)
                        cursor.continue();
                    } else {
                        swapObectStores(playlistName, songDB_ver, songObjectName,  tempSongs).then(()=> {
                            first_load_songs_display();
                            songIndex = 0;
                            console.log(audioElement.paused)
                            let customEvent = new Event("click")
                            // customEvent.index = 0;
                            if (!audioElement.paused){
                                masterPlay.dispatchEvent(customEvent)
                            }
                            playlist_db.close();
                        }).catch(()=> {
                            playlist_db.close();
                            console.log("there was an error swapping the songs")
                        })
                    }
                }
                cursorRequest.onerror = ()=> {
                    console.log("there was an error opening the cursor");
                }
            }).catch(()=> {
                console.log("couldn't open playlist database for songs swapping")
            });
        });
    });
}
function DisplayAll_Playlists() {
    let playlists = indexedDB.open("playlists")
    playlists.onupgradeneeded = (e)=> {
        let db = e.target.result 
        db.createObjectStore("mysongs", {keyPath: "hash"})
    }
    playlists.onsuccess = (event)=> {
        Playlistsdb = event.target.result
        let dbNames = Playlistsdb.objectStoreNames
        console.log("database opened successfully for playlists")
        // console.log("These are all of the Playlists" , dbNames[0])
        for (let i = 0 ; i < dbNames.length ; i++){
            Display_Playlist(dbNames[i])
        }
        // playList_version = parseInt(Playlistsdb.version)
        // console.log(playList_version)
        Playlistsdb.close();
    }
}
DisplayAll_Playlists();




