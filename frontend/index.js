const form = document.getElementById('form')
const box = document.getElementById('box2')
const btn1 = document.getElementById('btn2')
const btn2 = document.getElementById('btn3')


async function submit(){
    const audioFile = document.getElementById('input')
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
        body: formData
    })

    if (!res.ok){
        window.alert('There was an issue with the server')
        return
    }

    text.style.display = 'flex'
    setTimeout(() => {
        text.style.display = 'none'
    }, 3000)
}

async function retrieve(){
    
    btn1.style.display = 'none'
    btn2.style.display = 'flex'

    const res = await fetch('/list', {
        method: "GET"
    })

    if (!res.ok){
        window.alert('There was a server error')
        return
    }

    box.style.display = 'flex'

    const req = await res.json()
    req.info.forEach(item => {
        const div = document.createElement('div')
        div.textContent = `${item.id}: ${item.song_name}`
        box.appendChild(div)
    })
}

function hide(){
    btn1.style.display = 'flex'
    btn2.style.display = 'none'
    box.style.display = 'none'
    box.innerHTML = ''
}


form.addEventListener('submit', (e) => {
    e.preventDefault()
    submit()
})