function truncate(text, limit = 10) {
  return text.length > limit ? text.slice(0, limit) + "..." : text;
}

let currentAudio = null;
let currentPlayBtn = null;
let currentIsPlaying = false;
let currentIndex = -1;
let songs = [];

const playbarPlayBtn = document.querySelector(
  ".playbar .songbuttons img:nth-child(2)"
);
const playbarPrevBtn = document.querySelector(
  ".playbar .songbuttons img:nth-child(1)"
);
const playbarNextBtn = document.querySelector(
  ".playbar .songbuttons img:nth-child(3)"
);
const playbarSongInfo = document.querySelector(".playbar .songinfo");
const playbarSongTime = document.querySelector(".playbar .songtime"); // ✅ NEW
const seekbar = document.getElementById("seekbar");

// ✅ Format time as mm:ss
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

fetch("data.json")
  .then((res) => res.json())
  .then((cardsData) => {
    const container = document.getElementById("card-container");
    const activeSongTitle = document.getElementById("active-song-title");
    const activeSongDesc = document.getElementById("active-song-desc");
    const activePlayBtn = document.querySelector(".lib-playbtn");

    songs = cardsData.map((card, index) => {
      const audio = new Audio(card.audio);
      audio.preload = "auto";
      return { ...card, audio, index };
    });

    songs.forEach((song, index) => {
      const cardElement = document.createElement("div");
      cardElement.classList.add("card");

      cardElement.innerHTML = `
        <img src="${song.img}" alt="${song.title}" />
        <div class="card-title">
          <h2>${song.title}</h2>
          <div class="play-button" style="cursor: pointer;">
            <img class="play-btn" src="images/play-btn.svg" alt="Play" width="40" height="40">
          </div>
        </div>
        <p>${truncate(song.description)}</p>
      `;

      const playBtn = cardElement.querySelector(".play-button");
      let isPlaying = false;

      playBtn.addEventListener("click", () => {
        if (currentAudio && currentAudio !== song.audio) {
          currentAudio.pause();
          clearInterval(window.timeUpdater); // ✅ Stop old timer
          if (currentPlayBtn) {
            currentPlayBtn.querySelector("img.play-btn").src =
              "images/play-btn.svg";
          }
        }

        if (isPlaying) {
          song.audio.pause();
          clearInterval(window.timeUpdater); // ✅
          isPlaying = false;
          currentIsPlaying = false;
          activePlayBtn.src = "images/play.svg";
          playbarPlayBtn.src = "images/play.svg";
        } else {
          song.audio.play();
          isPlaying = true;
          currentIsPlaying = true;

          activeSongTitle.innerText = song.title;
          activeSongDesc.innerText = truncate(song.description);
          activePlayBtn.src = "images/pause.svg";
          playbarPlayBtn.src = "images/pause.svg";
          playbarSongInfo.innerText = song.title;

          currentAudio = song.audio;
          currentIndex = index;
          currentPlayBtn = playBtn; // ✅ SET THIS

          // ✅ Time update logic
          clearInterval(window.timeUpdater);
          window.timeUpdater = setInterval(() => {
            if (currentAudio && currentAudio.duration) {
              playbarSongTime.innerText = `${formatTime(
                currentAudio.currentTime
              )} / ${formatTime(currentAudio.duration)}`;
            }
          }, 500);

          playBtn.querySelector("img.play-btn").src = "images/play-btn.svg";

          song.audio.onended = () => {
            currentIsPlaying = false;
            playbarPlayBtn.src = "images/play.svg";
            activePlayBtn.src = "images/play.svg";
            playBtn.querySelector("img.play-btn").src = "images/play-btn.svg";
            clearInterval(window.timeUpdater); // ✅
          };
        }
      });

      document.body.appendChild(song.audio);
      container.appendChild(cardElement);
    });

    activePlayBtn.addEventListener("click", () => {
      if (!currentAudio) return;

      if (currentIsPlaying) {
        currentAudio.pause();
        clearInterval(window.timeUpdater); // ✅
        currentIsPlaying = false;
        activePlayBtn.src = "images/play.svg";
        playbarPlayBtn.src = "images/play.svg";
        if (currentPlayBtn) {
          currentPlayBtn.querySelector("img.play-btn").src =
            "images/play-btn.svg";
        }
      } else {
        currentAudio.play();
        currentIsPlaying = true;
        activePlayBtn.src = "images/pause.svg";
        playbarPlayBtn.src = "images/pause.svg";
        if (currentPlayBtn) {
          currentPlayBtn.querySelector("img.play-btn").src = "images/pause.svg";
        }

        clearInterval(window.timeUpdater);
        window.timeUpdater = setInterval(() => {
          if (currentAudio && currentAudio.duration) {
            playbarSongTime.innerText = `${formatTime(
              currentAudio.currentTime
            )} / ${formatTime(currentAudio.duration)}`;
          }
        }, 500);
      }
    });

    playbarPlayBtn.addEventListener("click", () => {
      if (currentAudio) {
        if (currentAudio.paused) {
          currentAudio.play();
          currentIsPlaying = true;
          playbarPlayBtn.src = "images/pause.svg";
          activePlayBtn.src = "images/pause.svg";
          if (currentPlayBtn) {
            currentPlayBtn.querySelector("img.play-btn").src =
              "images/pause.svg";
          }

          clearInterval(window.timeUpdater);
          window.timeUpdater = setInterval(() => {
            if (currentAudio && currentAudio.duration) {
              playbarSongTime.innerText = `${formatTime(
                currentAudio.currentTime
              )} / ${formatTime(currentAudio.duration)}`;
            }
          }, 500);
        } else {
          currentAudio.pause();
          currentIsPlaying = false;
          clearInterval(window.timeUpdater);
          playbarPlayBtn.src = "images/play.svg";
          activePlayBtn.src = "images/play.svg";
          if (currentPlayBtn) {
            currentPlayBtn.querySelector("img.play-btn").src =
              "images/play-btn.svg";
          }
        }
      } else if (songs.length > 0) {
        playSong(0); // ✅ Autoplay first
      }
    });

    playbarNextBtn.addEventListener("click", () => {
      if (songs.length === 0) return;
      const nextIndex = (currentIndex + 1) % songs.length;
      playSong(nextIndex);
    });

    playbarPrevBtn.addEventListener("click", () => {
      if (songs.length === 0) return;
      const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
      playSong(prevIndex);
    });

    function playSong(index) {
      if (currentAudio) {
        currentAudio.pause();
        clearInterval(window.timeUpdater);
        if (currentPlayBtn) {
          currentPlayBtn.querySelector("img.play-btn").src =
            "images/play-btn.svg";
        }
      }

      const song = songs[index];
      currentAudio = song.audio;
      currentIndex = index;
      currentIsPlaying = true;

      currentAudio.play();
      playbarPlayBtn.src = "images/pause.svg";
      activePlayBtn.src = "images/pause.svg";
      playbarSongInfo.innerText = song.title;
      activeSongTitle.innerText = song.title;
      activeSongDesc.innerText = truncate(song.description);

      const allCards = document.querySelectorAll(".card");
      currentPlayBtn = allCards[index].querySelector(".play-button"); // ✅ Update ref

      clearInterval(window.timeUpdater);
      window.timeUpdater = setInterval(() => {
        if (currentAudio && currentAudio.duration) {
          seekbar.value =
            (currentAudio.currentTime / currentAudio.duration) * 100;
          playbarSongTime.innerText = `${formatTime(
            currentAudio.currentTime
          )} / ${formatTime(currentAudio.duration)}`;
        }
      }, 500);
      seekbar.addEventListener("input", () => {
        if (currentAudio && currentAudio.duration) {
          const seekTime = (seekbar.value / 100) * currentAudio.duration;
          currentAudio.currentTime = seekTime;
        }
      });
      song.audio.onended = () => {
        currentIsPlaying = false;
        playbarPlayBtn.src = "images/play.svg";
        activePlayBtn.src = "images/play.svg";
        if (currentPlayBtn) {
          currentPlayBtn.querySelector("img.play-btn").src =
            "images/play-btn.svg";
        }
        clearInterval(window.timeUpdater);
      };
    }
  });
