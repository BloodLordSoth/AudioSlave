const form = document.getElementById('form')
const username = document.getElementById('username')
const password = document.getElementById('password')
const success = document.getElementById('success')

async function register(){
    if (username.value.length === 0){
        window.alert('Username is required')
        return
    }

    if (password.value.length === 0){
        window.alert('Password is required')
        return
    }

    const dataObj = {
        username: username.value,
        password: password.value
    }

    const res = await fetch('/register', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataObj)
    })

    if (!res.ok){
        window.alert('There was a server issue')
        return
    }

    success.style.display = 'flex'
    setTimeout(() => {
        success.style.display = 'none'
    }, 1000)

    setTimeout(() => {
        window.location.href = '/'
    }, 2000)

}

form.addEventListener('submit', (e) => {
    e.preventDefault()
    register()
})