const form = document.getElementById('form')
const box = document.getElementById('box2')
const btn1 = document.getElementById('btn2')
const btn2 = document.getElementById('btn3')
const boxOut = document.getElementById('box-out')
const boxIn = document.getElementById('box-in')
const audioFile = document.getElementById('input')
const delDisplay = document.getElementById('delete')
const valID = document.getElementById('value')
const playBtn = document.getElementById('playBtn')
const pauseBtn = document.getElementById('pauseBtn')
const stopBtn = document.getElementById('stopBtn')
const delFile = document.getElementById('delFile')

const token = localStorage.getItem('accessToken')

if (!token){
   window.alert('your session has expired')
    localStorage.removeItem('accessToken')
    window.location.href = '/'
}

let sound = null;

async function submit(){
    const text = document.getElementById('update')
   // const name = document.getElementById('name')

    if (!audioFile.files[0]){
        window.alert('No song has been selected')
        return
    }

    const formData = new FormData()
    formData.append("audio", audioFile.files[0])

    const res = await fetch('/upload', {
        method: "POST",
        headers: { "authorization": `Bearer ${token}` },
        body: formData
    })

    if (!res.ok){
        window.alert('There was an issue with the server')
        return
    }

    audioFile.value = ''
    boxOut.style.display = 'flex'
    boxIn.style.animation = 'run-bar 3s forwards'

    setTimeout(() => {
        text.style.display = 'flex'
    }, 3000)

    setTimeout(() => {
        text.style.display = 'none'
        btn1.style.display = 'inline'
        btn2.style.display = 'none'
        boxIn.style.animation = 'none'
        boxOut.style.display = 'none'
        box.style.display = 'none'
        delDisplay.style.display = 'none'
    }, 6000)

}

async function retrieve(){
    const res = await fetch('/list', {
        method: "GET",
        headers: { "authorization": `Bearer ${token}`}
    })

    if (!res.ok){
        window.alert('There was a server error')
        return
    }

    btn1.style.display = 'none'
    btn2.style.display = 'flex'
    delDisplay.style.display = 'block'

    box.style.display = 'flex'

    const req = await res.json()
    req.info.forEach(item => {
        const link = document.createElement('a')
        const link2 = document.createElement('a')
        link2.href = `/download/${item.id}`
        link2.textContent = 'download'
        link.href = `/music/${item.id}`
        link.style.color = 'inherit'
        link.style.textDecoration = 'none'

        const div = document.createElement('div')
        div.innerHTML = `${item.id}: ${item.song_name}`
        div.classList.add('items')
        div.appendChild(link2)
        link.appendChild(div)
        box.appendChild(link)

        link2.addEventListener('click', (e) => {
            e.stopPropagation()
        })

        link.addEventListener('click', (e) => {
            e.preventDefault()
            playSong(item.id)
        })
    })
}

async function playSong(id = null){

    if (id !== null){
            valID.value = id
        }

    if (sound === null){
        const res = await fetch(`/music/${valID.value}`, {
            method: "GET",
         })

        if (!res.ok){
            window.alert('No song has been selected')
            return
        }


        const data = await res.blob()
        const audioURL = URL.createObjectURL(data)
        sound = new Audio(audioURL)
        sound.volume = 0.5
        sound.play()
    }
    
    pauseBtn.style.display = 'inline'
    playBtn.style.display = 'none'
    sound.play()
    valID.value = ''
}

function pauseSong(){
    if (!sound){
        return
    }

    playBtn.style.display = 'inline'
    pauseBtn.style.display = 'none'
    sound.pause()
}

function stopSong(){
    sound.pause()
    playBtn.style.display = 'inline'
    pauseBtn.style.display = 'none'
    sound = null
}

function hide(){
    btn1.style.display = 'flex'
    btn2.style.display = 'none'
    delDisplay.style.display = 'none'
    box.style.display = 'none'
    box.innerHTML = ''
}

async function removeSong(){
    const res = await fetch(`/music/${value.value}`, {
        method: "DELETE"
    })

    if (res.status === 204){
        delFile.style.display = 'flex'
        setTimeout(() => {
            delFile.style.display = 'none'
        }, 2000)
        hide()
        value.value = ''
        return
    }
}


form.addEventListener('submit', (e) => {
    e.preventDefault()
    submit()
})

window.addEventListener('load', () => {
    audioFile.value = ''
})

window.addEventListener('beforeunload', () => {
    localStorage.removeItem('accessToken')
})