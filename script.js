let songs = [
    {songName: "Aaye Haaye (Official Video)  Karan Aujla, Nora Fatehi, Neha Kakkar, Jay Trak  Bhushan Kumar",           address:"assets/Songs/Aaye Haaye (Official Video)  Karan Aujla, Nora Fatehi, Neha Kakkar, Jay Trak  Bhushan Kumar.mp3"},
    {songName: "Dhanda Nyoliwala  Russian Bandana (Music Video)  Deepesh Goyal  VYRL Haryanvi",                         address:"assets/Songs/Dhanda Nyoliwala  Russian Bandana (Music Video)  Deepesh Goyal  VYRL Haryanvi.mp3"},
    {songName: "Ishq Ka Raja - Addy Nagar (Official Video)- Hamsar Hayat - New Hindi Songs 2022"   ,                    address:"assets/Songs/Ishq Ka Raja - Addy Nagar (Official Video)- Hamsar Hayat - New Hindi Songs 2022.mp3"},
    {songName: "LONOWN - AVANGARD (super slowed  reverb)"  ,                                                            address:"assets/Songs/LONOWN - AVANGARD (super slowed  reverb).mp3"},
    {songName: "Ogryzek - AURA (Super Slowed)" ,                                                                        address:"assets/Songs/Ogryzek - AURA (Super Slowed).mp3"},
    {songName: "PAYAL SONG (Official Video)_ YO YO HONEY SINGH  NORA FATEHI  PARADOX  GLORY  BHUSHAN KUMAR"  ,          address:"assets/Songs/PAYAL SONG (Official Video)_ YO YO HONEY SINGH  NORA FATEHI  PARADOX  GLORY  BHUSHAN KUMAR.mp3"},
    {songName: "Tu Hi Haqeeqat Lo-fi [slow reverb] Emraan Hashmi, Soha Ali Khan #slowedandreverb #viral #SlowVerse" ,   address:"assets/Songs/WAVY (OFFICIAL VIDEO) KARAN AUJLA  LATEST PUNJABI SONGS 2024.mp3"},
    {songName: "Tu Hi Haqeeqat Lo-fi [slow reverb] Emraan Hashmi, Soha Ali Khan #slowedandreverb #viral #SlowVerse" ,   address:"assets/Songs/WAVY (OFFICIAL VIDEO) KARAN AUJLA  LATEST PUNJABI SONGS 2024.mp3"},
    {songName: "Tu Hi Haqeeqat Lo-fi [slow reverb] Emraan Hashmi, Soha Ali Khan #slowedandreverb #viral #SlowVerse" ,   address:"assets/Songs/WAVY (OFFICIAL VIDEO) KARAN AUJLA  LATEST PUNJABI SONGS 2024.mp3"},
    {songName: "Tu Hi Haqeeqat Lo-fi [slow reverb] Emraan Hashmi, Soha Ali Khan #slowedandreverb #viral #SlowVerse" ,   address:"assets/Songs/WAVY (OFFICIAL VIDEO) KARAN AUJLA  LATEST PUNJABI SONGS 2024.mp3"},
    {songName: "Tu Hi Haqeeqat Lo-fi [slow reverb] Emraan Hashmi, Soha Ali Khan #slowedandreverb #viral #SlowVerse" ,   address:"assets/Songs/WAVY (OFFICIAL VIDEO) KARAN AUJLA  LATEST PUNJABI SONGS 2024.mp3"},
    {songName: "Tu Hi Haqeeqat Lo-fi [slow reverb] Emraan Hashmi, Soha Ali Khan #slowedandreverb #viral #SlowVerse" ,   address:"assets/Songs/WAVY (OFFICIAL VIDEO) KARAN AUJLA  LATEST PUNJABI SONGS 2024.mp3"},
]
let masterPlay = document.getElementById("masterPlay");
let playPrevious = document.getElementById("playPrevious");
let playNext = document.getElementById("playNext")
let songIndex = 0 ;
let audioElement = new Audio(songs[songIndex].address);
let gif = document.getElementById("player-gif-inner")
let songDisplayList = document.getElementsByClassName("song-name");
let progressBar = document.getElementsByClassName("progress-bar")
let progress = 0;
let songlist_conrtolBtn = document.getElementsByClassName("song-list-control-btn");

let timeUpdateProgressBar = () => {
    audioElement.addEventListener("timeupdate", ()=>{
        progress = parseInt((audioElement.currentTime / audioElement.duration ) * 100);
        progressBar[0].value = progress;
    })
}

function Play_from_song_List(index, element) {
    console.log(index)
    console.log(songs[index])

    let click_on_different_link = () => {
                audioElement.pause() // pause the previous song
                progressBar[0].value = 0 ;  // set the progress bar to zero
                songIndex = index;  // change the address to new element
                audioElement = new Audio(songs[songIndex].address)  // load the new song
                // audioElement.load()     // done loading
                audioElement.play() // play that song
                timeUpdateProgressBar();
                masterPlay.classList.replace('fa-circle-play', 'fa-circle-pause')   // change main button to play
                element.classList.replace('fa-circle-play', 'fa-circle-pause')      // change list button to play
                gif.setAttribute("src", "assets/try-cover-2.gif")
                return ;
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
        if (audioElement.paused){
            masterPlay.classList.replace('fa-circle-play', 'fa-circle-pause')
            audioElement.play()
            timeUpdateProgressBar();
            gif.setAttribute("src", "assets/try-cover-2.gif")
        } else {
            masterPlay.classList.replace('fa-circle-pause', 'fa-circle-play')
            audioElement.pause()
            gif.setAttribute("src", "assets/try-cover-2-pause.gif")
        }
        SetAllIcons()
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
    audioElement = new Audio(songs[songIndex].address)
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
    audioElement = new Audio(songs[songIndex].address)
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
        const tempAudio = new Audio(songs[i].address);
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

show_allSongs();
// gif.src = "assets/Covers/gif-still.png"