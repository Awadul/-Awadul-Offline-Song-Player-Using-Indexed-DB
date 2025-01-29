let side_panel_button = document.querySelector(".slide-show-option");
let side_panel = document.querySelector(".side-panel");
let songPlaylists = document.querySelector(".song-playlists")
let playlists = document.getElementsByClassName("playlistName")
side_panel_button.addEventListener("click", () => {
    side_panel.classList.toggle("hide");
    side_panel_button.classList.toggle("slide-hide-option");
    songPlaylists.classList.toggle("hide-song-playlists")
    Array.from(playlists).forEach((element, index)=>{
        element.classList.toggle("hide-song-playlists")
    })
});
