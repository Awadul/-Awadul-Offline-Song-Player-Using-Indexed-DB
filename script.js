// songs = [
    //     {songName: "Aaye Haaye (Official Video)  Karan Aujla, Nora Fatehi, Neha Kakkar, Jay Trak  Bhushan Kumar",   address:"assets/Songs/Aaye Haaye (Official Video)  Karan Aujla, Nora Fatehi, Neha Kakkar, Jay Trak  Bhushan Kumar.mp3"},
    //     {songName: "Dhanda Nyoliwala  Russian Bandana (Music Video)  Deepesh Goyal  VYRL Haryanvi",                 address:"assets/Songs/Dhanda Nyoliwala  Russian Bandana (Music Video)  Deepesh Goyal  VYRL Haryanvi.mp3"},
    //     {songName: "Ishq Ka Raja - Addy Nagar (Official Video)- Hamsar Hayat - New Hindi Songs 2022"   ,            address:"assets/Songs/Ishq Ka Raja - Addy Nagar (Official Video)- Hamsar Hayat - New Hindi Songs 2022.mp3"},
// ]



/**Utitity Functions */
function openSongsConnection(){
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("songs");
        request.onsuccess = (e) => {
            const db = e.target.result;
            resolve(db);
        };
        request.onerror = (e) => {
            reject(new Error("Failed to open songs database"));
        };
    });
}

function openPlaylistConnection() {
    return new Promise((resolve, reject) => {
        const playlistDB_request = indexedDB.open("playlists");
        playlistDB_request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        playlistDB_request.onerror = (e) => {
            reject(new Error("Failed to open playlists database"));
        };
    });
}

/**End untility Functions */

let songs = [];
let songIndex = 0 ;
let totalSongs = 0 ;
let audioElement ;
let currentVolume = 1.0; // Default full volume

// DOM elements
const masterPlay = document.getElementById("masterPlay");
const playPrevious = document.getElementById("playPrevious");
const playNext = document.getElementById("playNext");
const gif = document.getElementById("player-gif-inner");
const progressBar = document.querySelector(".progress-bar");
const volumeSlider = document.getElementById("volume-slider");
const volumeIcon = document.getElementById("volume-icon");
const currentTimeDisplay = document.getElementById("current-time");
const totalTimeDisplay = document.getElementById("total-time");
const currentSongName = document.getElementById("current-song-name");
const loopOption = document.getElementById("loopOption");
const repeatSong = document.querySelector(".repeat-song");
const slideOption = document.querySelector(".slide-option");
const mainSlider = document.querySelector(".main-slider");
const addPlaylistButton = document.querySelector(".add-playlist");
const songDisplayList = document.querySelectorAll(".song-name");

let songlist_conrtolBtn = document.getElementsByClassName("song-list-control-btn");
let loop = true; /*User has true: loop or false: shuffle */
let repeatSame = true;
let progress = 0;

// Initialize the audio context lazily on first user interaction
// This prevents the "AudioContext was not allowed to start" error
let audioContext;
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Update slider's visual state
function updateSliderBackground(slider, value) {
    slider.style.background = `linear-gradient(to right, #1DB954 ${value}%, rgba(83, 83, 83, 0.3) ${value}%)`;
}

function setAudio_for_first_use(){
    if (!songs.length) return;
    
    if (audioElement) {
        audioElement.pause();
        audioElement = null;
    }
    
    audioElement = new Audio(URL.createObjectURL(songs[songIndex].audio));
    audioElement.volume = currentVolume;
    updateCurrentSongDisplay();
    
    // Set up event listeners
    audioElement.addEventListener("loadedmetadata", () => {
        updateTotalTime();
    });
}

function updateCurrentSongDisplay() {
    if (songs.length && songs[songIndex]) {
        currentSongName.textContent = songs[songIndex].songName;
    } else {
        currentSongName.textContent = "Select a song to play";
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

function updateTotalTime() {
    if (audioElement && !isNaN(audioElement.duration)) {
        totalTimeDisplay.textContent = formatTime(audioElement.duration);
    } else {
        totalTimeDisplay.textContent = "0:00";
    }
}

function updateCurrentTime() {
    if (audioElement) {
        currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
    } else {
        currentTimeDisplay.textContent = "0:00";
    }
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
    return new Promise((resolve, reject) => {
        let songBlob = new Blob([file], {type: file.type});
        
        let hashBlob = async (blob) => {
            try {
        const arrayBuffer = await blob.arrayBuffer();
                const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
                const uint8Array = new Uint8Array(hashBuffer);
                const byteArray = Array.from(uint8Array);
                const hexArray = byteArray.map(byte => {
                    return byte.toString(16).padStart(2, "0");
                });
                return hexArray.join('');
            } catch (error) {
                reject(error);
                return null;
            }
        };
        
        hashBlob(songBlob)
            .then((songHash) => {
                if (!songHash) return; // Already rejected in hashBlob
                
                let songs_obj_Name;
                let songAdded = false;
                
                // First add to songs database
                openSongsConnection()
                    .then((db) => {
            songs_obj_Name = db.objectStoreNames[0];
                        if (songs_obj_Name !== undefined) {
                            const transaction = db.transaction([songs_obj_Name], "readwrite");
                            const objectStore = transaction.objectStore(songs_obj_Name);
                            const song = {songName: file.name, audio: songBlob, id: totalSongs, hash: songHash};
                            
                            return new Promise((resolveTransaction, rejectTransaction) => {
                                const request = objectStore.add(song);
                                
                                request.onsuccess = () => {
                    totalSongs++;
                                    songs.push(song);
                    update_items_from_Db();
                                    songAdded = true;
                                    db.close();
                                    resolveTransaction();
                                };
                                
                                request.onerror = (e) => {
                                    db.close();
                                    console.log(e);
                                    rejectTransaction(new Error("Song already exists in the player list"));
                                };
                            });
            } else {
                            db.close();
                            return Promise.reject(new Error("Choose a database"));
                        }
                    })
                    .then(() => {
                        // Then add to playlist database
                        return openPlaylistConnection();
                    })
                    .then((db) => {
                        if (db.objectStoreNames.contains(songs_obj_Name)) {
                            const transaction = db.transaction([songs_obj_Name], "readwrite");
                            const objectStore = transaction.objectStore(songs_obj_Name);
                            const song = {songName: file.name, audio: songBlob, id: totalSongs, hash: songHash};
                            
                            return new Promise((resolvePlaylist, rejectPlaylist) => {
                                const request = objectStore.add(song);
                                
                                request.onsuccess = () => {
                                    console.log("Song has been added successfully in playlist db");
                                    db.close();
                                    resolvePlaylist();
                                };
                                
                                request.onerror = (e) => {
                                    console.log(e);
                                    db.close();
                                    // Don't reject here, as the song is already added to the songs DB
                                    resolvePlaylist();
                                };
                            });
            } else {
                            console.log("Can't find respective object store");
                db.close();
                            return Promise.resolve(); // Continue the chain
                        }
                    })
                    .then(() => {
                        resolve(); // All done successfully
                    })
                    .catch((error) => {
                        if (songAdded) {
                            // If we managed to add the song to the main DB but failed elsewhere,
                            // still consider it a success
                            resolve();
                        } else {
                            reject(error);
                        }
                    });
            })
            .catch(reject);
    });
}
let input_File = document.getElementById("input-file")
input_File.addEventListener("change", (e)=> {
    const file = e.target.files[0]
    if (file) {
        // Show loading indicator
        currentSongName.textContent = "Uploading song...";
        
        addSongtoDB(file)
            .then(() => {
                // Update UI after successful upload
                updateCurrentSongDisplay();
            })
            .catch(error => {
                console.error("Error uploading song:", error);
                currentSongName.textContent = "Error uploading song";
            });
            
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
    // Remove any existing event listeners first to avoid duplicates
    audioElement.removeEventListener("timeupdate", updateProgress);
    
    // Add the event listener
    audioElement.addEventListener("timeupdate", updateProgress);
}

// Create a separate function for the timeupdate handler
function updateProgress() {
    progress = parseInt((audioElement.currentTime / audioElement.duration) * 100);
    progressBar.value = progress;
    updateSliderBackground(progressBar, progress);
    updateCurrentTime();
    if (progressBar.value == 100) {
                LoopOptionControl();
        }
}

let Play_from_song_List = (index, element) => {
    console.log(index);
    console.log(songs[index]);

    let click_on_different_link = () => {
        audioElement.pause(); // pause the previous song
        progressBar.value = 0;  // set the progress bar to zero
        songIndex = index;  // change the audio to new element
        audioElement = new Audio(URL.createObjectURL(songs[songIndex].audio));  // load the new song
        audioElement.volume = currentVolume;
        
        // Update song name display
        updateCurrentSongDisplay();
        
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
            updateCurrentSongDisplay(); // Update song name display
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

// Add a function to update the correct play icon in the song list
function updateCurrentSongIcon(isPlaying) {
    // First reset all icons to play
    SetAllIcons();
    
    // Then set the current song's icon if playing
    if (isPlaying && songIndex < totalSongs) {
        const songListItems = document.querySelectorAll('.song-list-control-btn');
        if (songListItems && songListItems[songIndex]) {
            songListItems[songIndex].classList.replace('fa-circle-play', 'fa-circle-pause');
        }
    }
}

// Update masterPlay event listener
masterPlay.addEventListener('click', (e)=> {
    if (e.hasOwnProperty('index') && e.index !== undefined){
        Play_from_song_List(e.index, e.element)
    } else {
        if (!audioElement){
            setAudio_for_first_use();
        }
        togglePlayPause(masterPlay);
        
        // Update the icon in the song list to match the play state
        const isPlaying = masterPlay.classList.contains('fa-circle-pause');
        updateCurrentSongIcon(isPlaying);
    }
})

progressBar.addEventListener('change' , ()=> {
    audioElement.currentTime = (progressBar.value * audioElement.duration) / 100
    progressBar.style.background = `linear-gradient(to right, rgb(0,0,0),  rgb(156, 156, 92) ${progress}%, black ${progress}%)`;
})

// Update playNext event listener to ensure timer and animation work
playNext.addEventListener('click', ()=> {
    const wasPlaying = !audioElement.paused;
    
    masterPlay.classList.replace('fa-circle-pause', 'fa-circle-play')
    audioElement.pause()
    progressBar.value = 0 ;  // set the progress bar to zero
    songIndex = (songIndex+1) % songs.length
    audioElement = new Audio(URL.createObjectURL(songs[songIndex].audio))
    audioElement.volume = currentVolume;
    audioElement.load()
    
    // Update song name display when changing songs
    updateCurrentSongDisplay();
    
    // Reset all icons to play state
    SetAllIcons();
    
    // If the previous song was playing, automatically play the next song
    if (wasPlaying) {
        audioElement.play().then(() => {
            masterPlay.classList.replace('fa-circle-play', 'fa-circle-pause');
            gif.setAttribute("src", "assets/try-cover-5.gif");
            // Ensure time updates and progress bar works
            timeUpdateProgressBar();
            updateCurrentSongIcon(true);
        }).catch(error => {
            console.error("Error playing next song:", error);
        });
    } else {
        // Pause animation
        gif.setAttribute("src", "assets/try-cover-5-pause.gif");
    }
})

// Update playPrevious event listener to ensure timer and animation work
playPrevious.addEventListener('click', ()=> {
    const wasPlaying = !audioElement.paused;
    
    masterPlay.classList.replace('fa-circle-pause', 'fa-circle-play')
    audioElement.pause()
    songIndex = (songIndex-1)%songs.length
    if (songIndex < 0){
        songIndex = songIndex + songs.length
    }
    audioElement = new Audio(URL.createObjectURL(songs[songIndex].audio))
    audioElement.volume = currentVolume;
    progressBar.value = 0 ;  // set the progress bar to zero
    audioElement.load()
    
    // Update song name display when changing songs
    updateCurrentSongDisplay();
    
    // Reset all icons to play state
    SetAllIcons();
    
    // If the previous song was playing, automatically play the previous song
    if (wasPlaying) {
        audioElement.play().then(() => {
            masterPlay.classList.replace('fa-circle-play', 'fa-circle-pause');
            gif.setAttribute("src", "assets/try-cover-5.gif");
            // Ensure time updates and progress bar works
            timeUpdateProgressBar();
            updateCurrentSongIcon(true);
        }).catch(error => {
            console.error("Error playing previous song:", error);
        });
    } else {
        // Pause animation
        gif.setAttribute("src", "assets/try-cover-5-pause.gif");
    }
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

function songs_UI_generator(song_List_Container, song, i) {
        const li = document.createElement('li');

    // Create the song cover image
        const spanImg = document.createElement('span');
        const img = document.createElement('img');
    img.src = `assets/Covers/${i % 7}.jpg`; // Cycle through available covers
        img.alt = "";
        img.classList.add('song-cover');
        spanImg.appendChild(img);

    // Create the song name display
        const spanName = document.createElement('span');
        spanName.classList.add('song-name');
        spanName.textContent = song.songName;

    // Create the controls container for play/delete
    const controlsContainer = document.createElement('div');
    controlsContainer.style.display = 'flex';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.gap = '0.8rem';

    // Create the play/pause button
        const icon = document.createElement('i');
    icon.classList.add('fa-solid', 'fa-circle-play', 'control-button', 'song-list-control-btn');
    icon.setAttribute('data-index', i);
    
    // Create an elegant delete button
    const deleteBtn = document.createElement('i');
    deleteBtn.classList.add('fa-solid', 'fa-xmark', 'song-delete-btn');
    deleteBtn.title = "Remove song";

    // Add to controls container
    controlsContainer.appendChild(icon);
    controlsContainer.appendChild(deleteBtn);

    // Create duration span
        const dur = document.createElement('span');
        dur.classList.add('song-duration');

    // Load the audio metadata to get the duration
    const tempAudio = new Audio(URL.createObjectURL(song.audio));
        tempAudio.addEventListener('loadedmetadata', () => {
            const minutes = Math.floor(tempAudio.duration / 60);
            const seconds = Math.floor(tempAudio.duration % 60);
            dur.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        });

    // Assemble the list item
        li.appendChild(spanImg);
        li.appendChild(spanName);
        li.appendChild(dur);
    li.appendChild(controlsContainer);

    // Keep the old delete div for compatibility but hide it via CSS
    const DeleteDiv = document.createElement("div");
    DeleteDiv.classList.add("delete-div-song");
    li.appendChild(DeleteDiv);

    // Add event listeners
    icon.addEventListener('click', (event) => {
        event.stopPropagation();
        SetAllIcons();
        Play_from_song_List(i, icon);
    });

    // Add click event to the whole li element for better UX
    li.addEventListener('click', () => {
        SetAllIcons();
        Play_from_song_List(i, icon);
    });

    // Delete functionality with confirmation
    deleteBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent triggering the song play
        
        if (confirm(`Remove "${song.songName}" from your library?`)) {
            deleteSong(song, li, i);
        }
    });

        song_List_Container.appendChild(li);
}

// Function to handle song deletion
function deleteSong(song, liElement, index) {
    openSongsConnection().then((db) => {
        const currentPlaylist = db.objectStoreNames[0];
        const tx = db.transaction([currentPlaylist], "readwrite");
        const objectStore = tx.objectStore(currentPlaylist);
        
        const request = objectStore.delete(song.hash);
        
        request.onsuccess = () => {
            console.log("Song deleted from songs database");
            // Remove from UI and songs array
            liElement.remove();
            songs = songs.filter(s => s.hash !== song.hash);
            totalSongs--;
            
            // If current song was deleted
            if (songIndex === index) {
                if (songs.length > 0) {
                    songIndex = songIndex % songs.length;
                    setAudio_for_first_use();
                    updateCurrentSongDisplay();
                    // Make sure animation is paused
                    gif.src = "assets/try-cover-5-pause.gif";
                    masterPlay.classList.replace('fa-circle-pause', 'fa-circle-play');
                } else {
                    audioElement = null;
                    songIndex = 0;
                    totalSongs = 0;
                    currentSongName.textContent = "No songs available";
                    gif.src = "assets/try-cover-5-pause.gif";
                    masterPlay.classList.replace('fa-circle-pause', 'fa-circle-play');
                }
            }
            
            db.close();
            
            // Also delete from playlist database
            openPlaylistConnection().then((playlistDb) => {
                if (playlistDb.objectStoreNames.contains(currentPlaylist)) {
                    const pTx = playlistDb.transaction([currentPlaylist], "readwrite");
                    const pObjectStore = pTx.objectStore(currentPlaylist);
                    
                    pObjectStore.delete(song.hash);
                    console.log("Song deleted from playlist database");
                    playlistDb.close();
                }
            });
        };
        
        request.onerror = (e) => {
            console.error("Error deleting song:", e);
            db.close();
        };
    });
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
    if (loop == true) {
        // Switch to shuffle mode - use FontAwesome icon
        loopOption.innerHTML = '<i class="fa-solid fa-shuffle control-button"></i>';
        loop = false;
    } else {
        // Switch to loop mode - use FontAwesome icon
        loopOption.innerHTML = '<i class="fa-solid fa-repeat control-button"></i>';
        loop = true;
    }
})

// Add initialization for the loopOption to ensure it shows the correct icon on load
document.addEventListener("DOMContentLoaded", function() {
    // Set initial state of loop icon
    if (loop) {
        loopOption.innerHTML = '<i class="fa-solid fa-repeat control-button"></i>';
    } else {
        loopOption.innerHTML = '<i class="fa-solid fa-shuffle control-button"></i>';
    }
    
    // Set initial state of volume slider background
    updateSliderBackground(volumeSlider, volumeSlider.value);
    
    // Set initial state of progress bar background
    updateSliderBackground(progressBar, 0);
});

let LoopOptionControl = ()=> {
    if (repeatSame) {
        // Repeat the same song
        audioElement.currentTime = 0;
        audioElement.play()
            .then(() => {
                // Make sure the timer updates
                timeUpdateProgressBar();
            })
            .catch(console.error);
    } else if (loop) {
        // Loop through playlist
        songIndex = (songIndex + 1) % totalSongs;
        setAudio_for_first_use();
        audioElement.play()
            .then(() => {
                // Make sure the timer updates
                timeUpdateProgressBar();
                updateCurrentSongDisplay(); // Update display when song changes
                SetAllIcons();
                updateCurrentSongIcon(true); // Update the song list icon
            })
            .catch(console.error);
    } else {
        // Shuffle mode
        const oldIndex = songIndex;
        // Get a new random index different from the current one
        do {
            songIndex = Math.floor(Math.random() * totalSongs);
        } while (songIndex === oldIndex && totalSongs > 1);
        
        setAudio_for_first_use();
        audioElement.play()
            .then(() => {
                // Make sure the timer updates
                timeUpdateProgressBar();
                updateCurrentSongDisplay(); // Update display when song changes
                SetAllIcons();
                updateCurrentSongIcon(true); // Update the song list icon
            })
            .catch(console.error);
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
const slideShowOption = document.querySelector(".slide-show-option");
slideShowOption.addEventListener("click", () => {
    mainSlider.classList.toggle("active");
    
    // Update aria-expanded attribute for accessibility
    const isExpanded = mainSlider.classList.contains("active");
    slideShowOption.setAttribute("aria-expanded", isExpanded.toString());
    
    // Update the aria-label based on state
    slideShowOption.setAttribute("aria-label", isExpanded ? "Close sidebar" : "Open sidebar");
});
/**End slider */



/** Handling playlist add  */

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
    // Create the main playlist div
    const playlistDiv = document.createElement("div");
    playlistDiv.classList.add("playlist", "playlist-item");
    
    // Create the content container
    const contentContainer = document.createElement("div");
    contentContainer.style.display = "flex";
    contentContainer.style.justifyContent = "space-between";
    contentContainer.style.alignItems = "center";
    contentContainer.style.width = "100%";
    
    // Create the text element
    const playlistText = document.createElement("span");
    playlistText.style.flex = "1";
    playlistText.style.whiteSpace = "nowrap";
    playlistText.style.overflow = "hidden";
    playlistText.style.textOverflow = "ellipsis";
    playlistText.textContent = playlistName;
    
    // Create the delete button (similar to song delete button)
    const deleteBtn = document.createElement("i");
    deleteBtn.classList.add("fa-solid", "fa-xmark", "playlist-delete-btn");
    deleteBtn.title = "Remove playlist";
    
    // Assemble the content container
    contentContainer.appendChild(playlistText);
    contentContainer.appendChild(deleteBtn);
    
    // Add content to the playlist div
    playlistDiv.appendChild(contentContainer);
    
    // Add to the DOM
    Display_Playlists_Div.appendChild(playlistDiv);

    // Add event listeners for playlist selection (clicking on the playlist)
    playlistDiv.addEventListener("click", (event) => {
        // Ignore clicks on the delete button
        if (event.target === deleteBtn) return;
        
        // Handle playlist selection
        toggle_All_Playlist_Animation();
        playlistDiv.classList.add("playlist-animation");
        
        // Get the playlist name
        const selectedPlaylistName = playlistText.textContent;
        console.log("Selected playlist:", selectedPlaylistName);
        
        let songDB_ver = 0;
        let songObjectName;

        console.log("empty for playlist", songs);
        openSongsConnection().then((db) => {
            songDB_ver = db.version;
            songObjectName = db.objectStoreNames[0];
            console.log("there are objectstores in songs db ", songObjectName);
            db.close();

            openPlaylistConnection().then((playlist_db) => {
                let tx = playlist_db.transaction([selectedPlaylistName], "readonly");
                let objectStore = tx.objectStore(selectedPlaylistName);
                let tempSongs = [];
                let cursorRequest = objectStore.openCursor();
                songs = [];
                totalSongs = 0;
                cursorRequest.onsuccess = (e) => {
                    cursor = e.target.result;
                    if (cursor) {
                        tempSongs.push(cursor.value);
                        cursor.continue();
                    } else {
                        swapObectStores(selectedPlaylistName, songDB_ver, songObjectName, tempSongs).then(() => {
                            first_load_songs_display();
                            songIndex = 0;
                            
                            // Reset audio for the new playlist
                            if (audioElement) {
                                audioElement.pause();
                                setAudio_for_first_use();
                                updateCurrentSongDisplay();
                                progressBar.value = 0;
                                updateSliderBackground(progressBar, 0);
                                masterPlay.classList.replace('fa-circle-pause', 'fa-circle-play');
                                gif.setAttribute("src", "assets/try-cover-5-pause.gif");
                            }
                            
                            // Auto-close sidebar on mobile after playlist selection
                            if (window.innerWidth <= 768) {
                                mainSlider.classList.remove("active");
                                slideShowOption.setAttribute("aria-expanded", "false");
                            }
                            
                            playlist_db.close();
                        }).catch(() => {
                            playlist_db.close();
                            console.log("there was an error swapping the songs");
                        });
                    }
                };
                cursorRequest.onerror = () => {
                    console.log("there was an error opening the cursor");
                };
            }).catch(() => {
                console.log("couldn't open playlist database for songs swapping");
            });
        });
    });

    // Delete functionality
    deleteBtn.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevent triggering playlist selection
        
        // Confirm deletion
        if (confirm(`Delete playlist "${playlistName}"?`)) {
            deletePlaylist(playlistName, playlistDiv);
        }
    });
}

// Function to handle playlist deletion
function deletePlaylist(playlistName, playlistDiv) {
    let playlistVer = 0;
    
    // Delete from playlists database
    openPlaylistConnection().then((db) => {
        playlistVer = db.version;
        db.close();
        
        let playlist = indexedDB.open("playlists", playlistVer + 1);
        playlist.onupgradeneeded = (e) => {
            const db = e.target.result;
            db.deleteObjectStore(playlistName);
            console.log("Playlist deleted from playlists database");
        };
        
        playlist.onsuccess = (e) => {
            e.target.result.close();
            
            // Remove from UI
            playlistDiv.remove();
            
            // Also delete from songs database if it's the current object store
            let songlistVer = 0;
            openSongsConnection().then((db) => {
                const currentObjectStore = db.objectStoreNames[0];
                songlistVer = db.version;
                db.close();
                
                // Only delete if this playlist is the current object store
                if (currentObjectStore === playlistName) {
                    let songlist = indexedDB.open("songs", songlistVer + 1);
                    songlist.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        db.deleteObjectStore(playlistName);
                        console.log("Playlist deleted from songs database");
                    };
                    
                    songlist.onsuccess = (e) => {
                        e.target.result.close();
                        
                        // Reset the current playlist if needed
                        if (songs.length > 0 && currentObjectStore === playlistName) {
                            songs = [];
                            totalSongs = 0;
                            if (audioElement) {
                                audioElement.pause();
                                audioElement = null;
                                masterPlay.classList.replace('fa-circle-pause', 'fa-circle-play');
                                gif.src = "assets/try-cover-5-pause.gif";
                                currentSongName.textContent = "No songs available";
                            }
                            
                            // Clear the song list
                            const songList = document.querySelector(".song-list");
                            songList.innerHTML = '';
                        }
                    };
                }
            });
        };
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

// Volume control functionality
volumeSlider.addEventListener("input", () => {
    if (audioElement) {
        currentVolume = volumeSlider.value / 100;
        audioElement.volume = currentVolume;
        
        // Update volume icon based on level
        updateVolumeIcon();
    }
    
    // Update slider visual
    updateSliderBackground(volumeSlider, volumeSlider.value);
});

// Update volume icon based on volume level
function updateVolumeIcon() {
    volumeIcon.className = "fa-solid control-button";
    
    if (currentVolume === 0) {
        volumeIcon.classList.add("fa-volume-xmark");
    } else if (currentVolume < 0.5) {
        volumeIcon.classList.add("fa-volume-low");
    } else {
        volumeIcon.classList.add("fa-volume-high");
    }
}

// Toggle mute when clicking volume icon
volumeIcon.addEventListener("click", () => {
    if (audioElement) {
        if (audioElement.volume > 0) {
            // Store the current volume before muting
            volumeSlider.dataset.previousVolume = volumeSlider.value;
            volumeSlider.value = 0;
            audioElement.volume = 0;
        } else {
            // Restore previous volume
            const previousVolume = volumeSlider.dataset.previousVolume || 100;
            volumeSlider.value = previousVolume;
            audioElement.volume = previousVolume / 100;
        }
        
        updateVolumeIcon();
        updateSliderBackground(volumeSlider, volumeSlider.value);
    }
});

// Progress bar interaction
progressBar.addEventListener("input", () => {
    if (audioElement) {
        const seekTime = (progressBar.value / 100) * audioElement.duration;
        audioElement.currentTime = seekTime;
        updateCurrentTime();
    }
    
    // Update progress bar visual
    updateSliderBackground(progressBar, progressBar.value);
});

// Add document click handler to close sidebar when clicking outside
document.addEventListener("click", (event) => {
    // Check if sidebar is open
    if (mainSlider.classList.contains("active")) {
        // Check if click was outside the sidebar and not on the hamburger menu
        const isClickInsideSidebar = mainSlider.contains(event.target);
        const isClickOnHamburger = slideShowOption.contains(event.target);
        
        if (!isClickInsideSidebar && !isClickOnHamburger) {
            mainSlider.classList.remove("active");
            // Update aria attributes for accessibility
            slideShowOption.setAttribute("aria-expanded", "false");
            slideShowOption.setAttribute("aria-label", "Open sidebar");
        }
    }
});




